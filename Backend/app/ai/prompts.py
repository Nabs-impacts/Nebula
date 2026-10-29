from app.core.config import settings

PROMPT_SYSTEME = f"""Tu es rédacteur commercial pour {settings.agence_nom}, une agence web au Niger qui vend des solutions digitales aux entreprises locales (site vitrine, boutique en ligne, application de commande, etc.).

Tu écris des emails de prospection personnalisés, directs et humains, en français.

RÈGLES ABSOLUES :
- Vouvoiement systématique. Ton direct, concret, respectueux. Jamais insistant.
- Structure attendue : 1) une observation précise sur CETTE entreprise, tirée uniquement des données fournies → 2) le problème que cela lui fait perdre, avec une conséquence concrète → 3) la crédibilité de l'agence → 4) UNE solution adaptée, avec des détails concrets (contenu, délai) → 5) un petit pas suivant simple (maquette gratuite) et les coordonnées.
- Pour un email : 90 à 140 mots. Pour WhatsApp : 50 à 90 mots, sans objet.
- Termine toujours le corps par exactement : « Si cela vous intéresse, contactez-nous au {settings.agence_telephone_1} ou au {settings.agence_telephone_2}. »
- Ne signe jamais le message : la signature est ajoutée automatiquement après le corps.
- L'objet est spécifique, contient le nom de l'entreprise et fait moins de 60 caractères.
- Preuves autorisées : {settings.agence_preuve_clients} et {settings.agence_argument_prix}. Tu peux les mentionner. N'invente JAMAIS d'autre chiffre, nom de client, année d'existence ou résultat.
- N'invente JAMAIS un fait sur l'entreprise : note Google, avis, absence de site, horaires, effectif, actualité. Si une donnée manque, adapte l'accroche au secteur et à la ville sans affirmer un fait non fourni.
- Si « présence web » vaut « inconnu », ne dis pas que l'entreprise n'a pas de site. Si elle vaut « aucun_site », tu peux t'appuyer dessus. Si elle vaut « site_existant », tu peux mentionner le site fourni.
- Interdit : « solutions innovantes », « dans un monde de plus en plus digital », « nous sommes leader », « n'hésitez pas à », les listes à puces, les emojis, les majuscules criardes.
- Ne recopie jamais l'exemple de référence : il montre le style et la structure, pas le contenu.

EXEMPLE DE RÉFÉRENCE (à ne pas copier) :
Objet : Les clients de Garage Sahel Auto vous cherchent sur Google

Bonjour M. Issoufou,

En cherchant un garage à Niamey, je suis tombé sur Garage Sahel Auto : 4,6 ★ sur Google Maps, et des avis qui parlent de votre sérieux et de vos délais. En revanche, aucun site ne s'affiche. Un client qui veut vos horaires, vos tarifs ou prendre rendez-vous doit appeler ou passer sur place. Certains vont donc directement chez un concurrent qui a une page claire, et vous ne le saurez jamais.

Nous avons une solide expérience dans la création de sites pour entreprises locales et nous avons déjà fait nos preuves auprès de nombreuses entreprises. Pour vous : un site rapide sur mobile avec vos services, vos avis, un bouton WhatsApp pour réserver et votre position sur la carte, livré en 7 jours.

Nous pouvons vous préparer une maquette avec votre nom et vos photos pour que vous voyiez le rendu avant de décider. Si cela vous intéresse, contactez-nous au {settings.agence_telephone_1} ou au {settings.agence_telephone_2}.

FORMAT DE SORTIE :
Réponds uniquement par un objet JSON valide, sans texte autour, avec exactement ces clés :
{{"objet": "objet de l'email, vide pour WhatsApp", "corps": "corps du message", "angle": "l'observation concrète utilisée en une phrase"}}
"""


def _formater_donnees(
    nom_entreprise: str,
    type_entreprise: str,
    contact_nom: str | None,
    ville: str | None,
    site_web: str | None,
    presence_web: str,
    note_google: float | None,
    autres_observations: str | None,
    prototype_a_presenter: str,
    description_prototype: str,
    service_a_proposer: str,
    canal: str,
    ton: str,
) -> str:
    if presence_web == "aucun_site":
        situation_web = "aucun site web trouvé"
    elif presence_web == "site_existant":
        situation_web = f"site existant : {site_web or 'URL non renseignée'}"
    else:
        situation_web = "non renseignée (ne rien affirmer sur l'absence de site)"

    return f"""DONNÉES DU PROSPECT :
- Nom de l'entreprise : {nom_entreprise}
- Contact : {contact_nom or 'non renseigné'}
- Secteur : {type_entreprise}
- Ville : {ville or 'non renseignée'}
- Présence web : {situation_web}
- Note Google : {note_google if note_google is not None else 'non renseignée'}
- Autres observations : {autres_observations or 'aucune'}

OFFRE À PROPOSER :
- Prototype : {prototype_a_presenter}
- Description : {description_prototype}
- Service à proposer : {service_a_proposer}

PARAMÈTRES :
- Canal : {canal}
- Ton souhaité : {ton or 'professionnel'}
"""


def construire_prompt_generation(
    nom_entreprise: str,
    type_entreprise: str,
    prototype_a_presenter: str,
    description_prototype: str,
    service_a_proposer: str,
    canal: str,
    ton: str = "professionnel",
    contact_nom: str | None = None,
    ville: str | None = None,
    site_web: str | None = None,
    presence_web: str = "inconnu",
    note_google: float | None = None,
    autres_observations: str | None = None,
) -> str:
    """Construit le prompt utilisateur envoyé au modèle pour générer un message initial."""
    donnees = _formater_donnees(
        nom_entreprise=nom_entreprise,
        type_entreprise=type_entreprise,
        contact_nom=contact_nom,
        ville=ville,
        site_web=site_web,
        presence_web=presence_web,
        note_google=note_google,
        autres_observations=autres_observations,
        prototype_a_presenter=prototype_a_presenter,
        description_prototype=description_prototype,
        service_a_proposer=service_a_proposer,
        canal=canal,
        ton=ton,
    )
    return f"""{donnees}

Rédige le message de prospection pour ce prospect, en respectant strictement les règles et le format JSON."""


def construire_prompt_relance(
    nom_entreprise: str,
    contenu_precedent: str,
    canal: str,
    sujet_precedent: str | None = None,
    jours_depuis_envoi: int | None = None,
    contact_nom: str | None = None,
    ville: str | None = None,
    type_entreprise: str = "autre",
    autres_observations: str | None = None,
) -> str:
    """Construit le prompt pour une relance suite à une absence de réponse."""
    return f"""Entreprise ciblée : {nom_entreprise}
Contact : {contact_nom or 'non renseigné'}
Secteur : {type_entreprise}
Ville : {ville or 'non renseignée'}
Canal du message : {canal}
Jours depuis le premier envoi : {jours_depuis_envoi if jours_depuis_envoi is not None else 'non renseigné'}
Observations : {autres_observations or 'aucune'}

Objet du message initial : {sujet_precedent or 'non renseigné'}

Voici le message initial déjà envoyé, resté sans réponse :
---
{contenu_precedent}
---

Rédige une relance courte (60 à 90 mots), avec un angle légèrement différent, sans répéter mot pour mot le message initial. Rappelle très brièvement la valeur, propose un pas suivant simple (maquette gratuite ou question rapide), et termine par la phrase de contact habituelle. Ne signe pas. Respecte le format JSON demandé."""
