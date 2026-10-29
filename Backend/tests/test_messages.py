from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_creation_message_sans_auth_refusee():
    payload = {
        "entreprise_id": "00000000-0000-0000-0000-000000000000",
        "canal": "email",
        "contenu_genere": "Message de test",
    }
    reponse = client.post("/api/messages", json=payload)
    assert reponse.status_code == 401


def test_lecture_messages_entreprise_inexistante_retourne_liste_vide_ou_401():
    reponse = client.get("/api/messages/entreprise/00000000-0000-0000-0000-000000000000")
    assert reponse.status_code in (401, 200)


def test_message_avec_canal_invalide_echoue():
    payload = {
        "entreprise_id": "00000000-0000-0000-0000-000000000000",
        "canal": "sms",  # canal non supporté (seuls email/whatsapp existent)
        "contenu_genere": "Message de test",
    }
    reponse = client.post("/api/messages", json=payload)
    assert reponse.status_code in (401, 422)


# NOTE : comme pour test_entreprises.py, ces tests sont des squelettes à compléter
# avec une fixture d'authentification et une base de données de test isolée.
