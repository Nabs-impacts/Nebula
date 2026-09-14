PROMPT_SYSTEME = """Tu es un assistant commercial spécialisé dans la rédaction de messages de prospection B2B pour Tenora, une entreprise de services digitaux et web au Niger.

Ton rôle : rédiger une demande d'audition ou une proposition commerciale personnalisée, destinée à une entreprise prospect, en te basant sur les informations fournies.

Règles :
- Ton professionnel, courtois, direct, sans être insistant.
- Toujours en français.
- Mentionne le type d'entreprise et adapte le message à son secteur.
- Présente le prototype de manière concrète, sans jargon technique excessif.
- Termine par une proposition claire (demande de rendez-vous ou d'audition).
- Reste concis : 120 à 200 mots pour un email, 60 à 100 mots pour un message WhatsApp.
- Ne signe pas le message (la signature est ajoutée automatiquement)."""


def construire_prompt_generation(
    nom_entreprise: str,
    type_entreprise: str,
    prototype_a_presenter: str,
    description_prototype: str,
    service_a_proposer: str,
    canal: str,
    ton: str = "professionnel",
) -> str:
    """Construit le prompt utilisateur envoyé au modèle pour générer un message initial."""
    return f"""Entreprise ciblée : {nom_entreprise}
Type d'entreprise : {type_entreprise}
Canal du message : {canal}
Ton souhaité : {ton}

Prototype à présenter : {prototype_a_presenter}
Description du prototype : {description_prototype}

Service à proposer : {service_a_proposer}

Rédige le message de prospection destiné à cette entreprise, en suivant les règles définies."""


def construire_prompt_relance(nom_entreprise: str, contenu_precedent: str, canal: str) -> str:
    """Construit le prompt pour une relance suite à une absence de réponse."""
    return f"""Entreprise ciblée : {nom_entreprise}
Canal du message : {canal}

Voici le message initial déjà envoyé, resté sans réponse :
---
{contenu_precedent}
---

Rédige une relance courte et directe, avec un ton légèrement différent du message initial, sans le répéter mot pour mot."""
