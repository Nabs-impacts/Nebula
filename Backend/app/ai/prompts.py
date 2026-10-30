from app.core.config import settings

PROMPT_SYSTEME = f"""Tu es rédacteur commercial pour {settings.agence_nom}, agence web au Niger. Tu écris des messages de prospection B2B sur-mesure, sobres, directs et humains, en français.

RÈGLES STRICTES ET NON NÉGOCIABLES :
- Vouvoiement impératif. Ton direct, concret, respectueux et chaleureux.
- Ne JAMAIS promettre de résultat (« retour sur investissement », « garanti », « 100% », « leader », « chiffre d'affaires multiplié » sont formellement bannis).
- Ne JAMAIS affirmer un fait absent des données fournies. Si le site n'est pas trouvé ou inconnu, écris « je n'ai pas trouvé votre site officiel en ligne » au lieu d'affirmer « vous ne possédez pas de site ».
- Preuves autorisées : uniquement « {settings.agence_preuve_clients} » et « {settings.agence_argument_prix} ». N'invente aucun chiffre, date, prix chiffré ni nom de client.
- Interdits : « solutions innovantes », « dans un monde de plus en plus digital », « n'hésitez pas à », « imbattable », listes à puces, emojis, majuscules criardes.
- Longueur : Email = 90 à 140 mots. WhatsApp = 40 à 90 mots (sans objet).
- Pour l'email, l'objet contient obligatoirement le nom du prospect et fait moins de 60 caractères.
- Termine toujours le corps par exactement : « Si cela vous intéresse, contactez-nous au {settings.agence_telephone_1} ou au {settings.agence_telephone_2}. »
- Ne signe jamais : la signature de l'agence est ajoutée automatiquement par le système.
- Réponds UNIQUEMENT sous forme d'un objet JSON strict valide sans markdown ni texte autour.

FORMAT ATTENDU :
{{"objet": "Sujet court", "corps": "Texte du message", "angle": "Observation concrète utilisée"}}
"""


def construire_prompt_generation(
    nom_entreprise: str,
    canal: str = "email",
    secteur: str | None = None,
    contact_nom: str | None = None,
    ville: str | None = None,
    site_web: str | None = None,
    presence_web: str = "inconnu",
    note_google: float | None = None,
    autres_observations: str | None = None,
    tags: list[str] | None = None,
    notes_chronologie: list[str] | None = None,
    angle_recommande: str | None = None,
    service_recommande: str | None = None,
    consigne_supplementaire: str | None = None,
    problemes_precedents: list[str] | None = None,
) -> str:
    """Construit un prompt compact avec tous les éléments disponibles."""
    lignes = [f"PROSPECT : {nom_entreprise}"]
    if contact_nom:
        lignes.append(f"- Contact : {contact_nom}")
    if secteur and secteur != "autre":
        lignes.append(f"- Secteur : {secteur}")
    if ville:
        lignes.append(f"- Ville : {ville}")
    if presence_web == "aucun_site":
        lignes.append("- Présence web : aucun site officiel trouvé")
    elif presence_web == "site_existant":
        lignes.append(f"- Site web actuel : {site_web or 'URL non renseignée'}")
    if note_google is not None:
        lignes.append(f"- Avis Google : note de {note_google}/5")
    if autres_observations:
        lignes.append(f"- Observations : {autres_observations}")
    if tags:
        lignes.append(f"- Tags : {', '.join(tags)}")
    if notes_chronologie:
        lignes.append(f"- Historique/Notes récentes : {' | '.join(notes_chronologie[:3])}")

    lignes.append(f"\nCANAL : {canal}")
    if service_recommande:
        lignes.append(f"SERVICE À PROPOSER : {service_recommande}")
    if angle_recommande:
        lignes.append(f"ACCROCHE SUGGÉRÉE : {angle_recommande}")
    if consigne_supplementaire:
        lignes.append(f"CONSIGNE SPÉCIFIQUE DE L'UTILISATEUR : {consigne_supplementaire}")

    if problemes_precedents:
        lignes.append(
            "\nATTENTION : Le premier essai a été rejeté pour ces raisons. Corrige-les impérativement :\n"
            + "\n".join(f"- {p}" for p in problemes_precedents)
        )

    lignes.append(
        "\nRédige le message au format JSON strict avec les clés 'objet', 'corps', 'angle'."
    )
    return "\n".join(lignes)


def construire_prompt_relance(
    nom_entreprise: str,
    contenu_precedent: str,
    canal: str,
    sujet_precedent: str | None = None,
    jours_depuis_envoi: int | None = None,
    contact_nom: str | None = None,
    ville: str | None = None,
    secteur: str | None = None,
    autres_observations: str | None = None,
) -> str:
    """Construit le prompt pour une relance suite à une absence de réponse."""
    return f"""Entreprise ciblée : {nom_entreprise}
Contact : {contact_nom or 'non renseigné'}
Secteur : {secteur or 'non précisé'}
Ville : {ville or 'non renseignée'}
Canal : {canal}
Jours écoulés : {jours_depuis_envoi if jours_depuis_envoi is not None else 'quelques jours'}
Observations : {autres_observations or 'aucune'}
Sujet précédent : {sujet_precedent or 'non renseigné'}

Message précédent déjà envoyé sans réponse :
---
{contenu_precedent}
---

Rédige une relance brève (60 à 85 mots), cordiale, avec un angle légèrement renouvelé. Pas d'agressivité ni de culpabilisation. Termine obligatoirement par la phrase avec les deux numéros. Ne signe pas. Format JSON strict attendu."""
