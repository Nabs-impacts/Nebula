import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.ai import angles, generateur_message
from app.core.config import settings

client = TestClient(app)


def test_creation_message_sans_auth_refusee():
    payload = {
        "entreprise_id": "00000000-0000-0000-0000-000000000000",
        "canal": "email",
        "contenu_genere": "Message de test",
    }
    reponse = client.post("/api/messages", json=payload)
    assert reponse.status_code == 401


def test_parsing_json_robuste():
    # 1. JSON propre
    res1 = generateur_message.extraire_json_robuste('{"objet": "Test", "corps": "Bonjour"}')
    assert res1 == {"objet": "Test", "corps": "Bonjour"}

    # 2. JSON entouré de markdown ```json
    res2 = generateur_message.extraire_json_robuste('```json\n{"objet": "Test", "corps": "Contenu"}\n```')
    assert res2 == {"objet": "Test", "corps": "Contenu"}

    # 3. JSON avec texte autour
    res3 = generateur_message.extraire_json_robuste('Voici la proposition :\n{"objet": "A", "corps": "B"}\nBonne journée.')
    assert res3 == {"objet": "A", "corps": "B"}

    # 4. JSON coupé réparable
    res4 = generateur_message.extraire_json_robuste('{"objet": "Titre", "corps": "Message incomplet sans fin')
    assert res4 is not None and res4.get("objet") == "Titre"

    # 5. Réponse vide ou non-JSON
    assert generateur_message.extraire_json_robuste("") is None
    assert generateur_message.extraire_json_robuste("Je refuse de répondre.") is None


def test_choisir_angle_cas_multiples():
    # 1. Sans site
    e1 = {"nom": "Boutique Al-Baraka", "presence_web": "aucun_site"}
    a1 = angles.choisir_angle(e1)
    assert a1["code"] == "aucun_site"

    # 2. Refonte mobile
    e2 = {"nom": "Hôtel Sahel", "presence_web": "site_existant", "autres_observations": "Site lent et pas adapté mobile"}
    a2 = angles.choisir_angle(e2)
    assert a2["code"] == "refonte_mobile"

    # 3. Note Google
    e3 = {"nom": "Pharmacie Centrale", "note_google": 4.7}
    a3 = angles.choisir_angle(e3)
    assert a3["code"] == "avis_google"

    # 4. Présence sociale / WhatsApp
    e4 = {"nom": "Mode Niamey", "autres_observations": "Page Facebook très active mais pas de catalogue"}
    a4 = angles.choisir_angle(e4)
    assert a4["code"] == "social_vers_site"

    # 5. Restauration
    e5 = {"nom": "Le Gourmet", "type_entreprise": "restauration"}
    a5 = angles.choisir_angle(e5)
    assert a5["code"] == "restauration_menu"

    # 6. Garage / Artisan
    e6 = {"nom": "Garage Mécanique Express", "type_entreprise": "transport"}
    a6 = angles.choisir_angle(e6)
    assert a6["code"] == "services_artisan"

    # 7. École
    e7 = {"nom": "Institut des Métiers", "type_entreprise": "education"}
    a7 = angles.choisir_angle(e7)
    assert a7["code"] == "formation_ecole"

    # 8. Uniquement un nom (presque aucune info)
    e8 = {"nom": "Issa SARL"}
    a8 = angles.choisir_angle(e8)
    assert a8["code"] == "defaut_local"
    assert "Issa SARL" in a8["accroche"]


def test_controler_qualite_regles():
    nom = "Garage Sahel"
    tel_phrase = f"contactez-nous au {settings.agence_telephone_1} ou au {settings.agence_telephone_2}."

    # Trop court
    corps_court = f"Bonjour Garage Sahel. {tel_phrase}"
    pbs = generateur_message.controler_qualite("Objet court", corps_court, nom, canal="email")
    assert any("trop court" in p.lower() for p in pbs)

    # Mot interdit
    corps_interdit = (
        f"Bonjour Garage Sahel. Nous vous offrons une solution innovante garantissant un bon retour sur investissement "
        f"pour votre activité locale. Nous sommes disponibles pour échanger dès aujourd'hui afin de voir comment concevoir "
        f"votre vitrine en ligne dans les meilleurs délais. {tel_phrase}"
    )
    pbs2 = generateur_message.controler_qualite("Objet valide pour Garage Sahel", corps_interdit, nom, canal="email")
    assert any("interdite" in p.lower() for p in pbs2)

    # Téléphone manquant
    corps_sans_tel = (
        f"Bonjour Garage Sahel. Nous pouvons concevoir un site web performant pour votre entreprise locale afin de "
        f"présenter vos services et faciliter le contact avec vos clients de la région. N'hésitez pas à nous écrire." * 3
    )
    pbs3 = generateur_message.controler_qualite("Objet Garage Sahel", corps_sans_tel, nom, canal="email")
    assert any("téléphoniques" in p.lower() for p in pbs3)

    # Présence de JSON
    corps_avec_json = f'{{"objet": "Test", "corps": "Bonjour Garage Sahel... {tel_phrase}"}} ' * 6
    pbs4 = generateur_message.controler_qualite("Objet", corps_avec_json, nom, canal="email")
    assert any("json" in p.lower() for p in pbs4)


def test_message_de_secours_complet_et_conforme():
    entreprise = {"nom": "Al-Amana Boutique", "ville": "Niamey"}
    secours_email = angles.message_de_secours(entreprise, canal="email")
    assert secours_email["source"] == "secours"
    assert settings.agence_telephone_1 in secours_email["corps"]
    assert settings.agence_telephone_2 in secours_email["corps"]
    assert "Al-Amana Boutique" in secours_email["corps"]

    # Le message de secours passe le contrôle qualité avec succès
    problemes = generateur_message.controler_qualite(
        secours_email["sujet"],
        secours_email["corps"],
        "Al-Amana Boutique",
        canal="email",
    )
    assert problemes == []


def test_chaine_secours_simulation(monkeypatch):
    # Simule l'échec complet de Groq et Mistral -> doit produire un message de secours propre
    def faux_groq_fail(*args, **kwargs):
        raise RuntimeError("Groq down")

    def faux_mistral_fail(*args, **kwargs):
        raise RuntimeError("Mistral down")

    monkeypatch.setattr("app.ai.groq_client.generer_texte", faux_groq_fail)
    monkeypatch.setattr("app.ai.mistral_client.generer_texte", faux_mistral_fail)

    entreprise = {"nom": "Boulangerie Moderne", "ville": "Niamey"}
    resultat = generateur_message.generer_message_prospection(entreprise, canal="email")

    assert resultat.source == "secours"
    assert "{" not in resultat.corps
    assert "Boulangerie Moderne" in resultat.corps
    assert settings.agence_telephone_1 in resultat.corps
