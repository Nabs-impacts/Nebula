import unicodedata
from typing import Any
from app.core.config import settings


def _normaliser(texte: str | None) -> str:
    if not texte:
        return ""
    texte = unicodedata.normalize("NFKD", texte).encode("ascii", "ignore").decode("utf-8")
    return texte.lower().strip()


ANGLES_DISPONIBLES = [
    {
        "code": "aucun_site",
        "label": "Absence de site web (Création site vitrine)",
        "service": "Création de site vitrine responsive et optimisé mobile",
    },
    {
        "code": "refonte_mobile",
        "label": "Refonte site web non adapté au mobile",
        "service": "Modernisation et refonte adaptée aux mobiles",
    },
    {
        "code": "avis_google",
        "label": "Valorisation des avis Google & visibilité",
        "service": "Page professionnelle de réservation intégrant vos avis Google Maps",
    },
    {
        "code": "social_vers_site",
        "label": "Présence réseaux sociaux vers boutique/catalogue",
        "service": "Catalogue en ligne et commande directe via WhatsApp",
    },
    {
        "code": "commerce_boutique",
        "label": "Commerce / Vente au détail",
        "service": "Boutique en ligne avec catalogue produits et commandes WhatsApp",
    },
    {
        "code": "restauration_menu",
        "label": "Restaurant / Café / Traiteur",
        "service": "Menu interactif en ligne avec réservations et commandes WhatsApp",
    },
    {
        "code": "services_artisan",
        "label": "Artisan / Garage / Prestations",
        "service": "Site vitrine avec carte d'accès Google et contact WhatsApp en un clic",
    },
    {
        "code": "hebergement_location",
        "label": "Hôtel / Résidence / Hébergement",
        "service": "Site de présentation des chambres et module de réservation directe",
    },
    {
        "code": "formation_ecole",
        "label": "École / Centre de formation",
        "service": "Site d'information des programmes avec formulaire d'inscription en ligne",
    },
    {
        "code": "sante_rendezvous",
        "label": "Clinique / Cabinet médical",
        "service": "Site institutionnel avec prise de rendez-vous et coordonnées d'urgence",
    },
    {
        "code": "defaut_local",
        "label": "Présence digitale locale ciblée",
        "service": "Site vitrine moderne adapté aux clients locaux",
    },
]


def choisir_angle(entreprise: Any) -> dict[str, str]:
    """Sélectionne l'angle le plus pertinent d'après les informations disponibles."""
    # Support dict ou objet SQLAlchemy/Pydantic
    def _val(nom: str) -> Any:
        if isinstance(entreprise, dict):
            return entreprise.get(nom)
        return getattr(entreprise, nom, None)

    nom = _val("nom") or "Votre entreprise"
    ville = _val("ville") or ""
    presence_web = str(_val("presence_web") or "").lower()
    site_web = _val("site_web") or ""
    note_google = _val("note_google")
    obs = _normaliser(_val("autres_observations"))
    secteur = _normaliser(str(_val("type_entreprise") or ""))
    nom_norm = _normaliser(nom)

    # 1. Absence explicite de site
    if presence_web == "aucun_site" or "aucun site" in obs or "pas de site" in obs:
        return {
            "code": "aucun_site",
            "service": "site vitrine moderne et rapide sur smartphone",
            "accroche": f"En recherchant {nom} à {ville or 'votre adresse'}, je n'ai pas trouvé votre site officiel en ligne.",
        }

    # 2. Site existant à refondre
    if (
        presence_web == "site_existant"
        and ("lent" in obs or "mobile" in obs or "ancien" in obs or "obsolete" in obs or "refonte" in obs)
    ):
        return {
            "code": "refonte_mobile",
            "service": "modernisation et adaptation complète sur smartphone",
            "accroche": f"En consultant votre présence en ligne ({site_web or nom}), j'ai constaté que votre site mériterait une mise à niveau pour smartphones.",
        }

    # 3. Note ou avis Google disponibles
    if note_google is not None or "avis" in obs or "google" in obs or "etoile" in obs:
        note_str = f"{note_google} ★ " if note_google else ""
        return {
            "code": "avis_google",
            "service": "page professionnelle intégrant vos excellents avis et la géolocalisation",
            "accroche": f"J'ai remarqué les très bons retours ({note_str}sur Google Maps) laissés par les clients de {nom}.",
        }

    # 4. Réseaux sociaux / WhatsApp uniquement
    if "facebook" in obs or "instagram" in obs or "whatsapp" in obs or "tiktok" in obs:
        return {
            "code": "social_vers_site",
            "service": "catalogue en ligne avec commandes directes sur WhatsApp",
            "accroche": f"Votre activité sur les réseaux sociaux montre l'intérêt des clients pour {nom}, mais centraliser vos offres sur un catalogue dédié faciliterait vos ventes.",
        }

    # 5. Secteurs d'activité spécifiques
    if any(k in secteur or k in nom_norm for k in ["restau", "cafe", "snack", "traiteur", "bar", "pizza", "burger"]):
        return {
            "code": "restauration_menu",
            "service": "menu interactif sur smartphone et bouton de commande WhatsApp",
            "accroche": f"Pour un établissement réputé comme {nom}, les clients veulent consulter le menu et réserver facilement depuis leur téléphone.",
        }

    if any(k in secteur or k in nom_norm for k in ["boutique", "magasin", "commerce", "vente", "pret-a-porter", "mode", "chaussure"]):
        return {
            "code": "commerce_boutique",
            "service": "boutique en ligne avec catalogue photos et commande WhatsApp",
            "accroche": f"Les clients de {nom} recherchent souvent vos articles et leurs disponibilités avant même de se déplacer.",
        }

    if any(k in secteur or k in nom_norm for k in ["garage", "auto", "mecanic", "artisan", "plomb", "electr", "batiment", "menuis"]):
        return {
            "code": "services_artisan",
            "service": "site vitrine avec localisation Google Maps et bouton d'appel direct",
            "accroche": f"En cas de besoin urgent d'un spécialiste, vos futurs clients cherchent directement une entreprise de confiance comme {nom} sur Internet.",
        }

    if any(k in secteur or k in nom_norm for k in ["hotel", "residence", "auberge", "heberg", "chambre"]):
        return {
            "code": "hebergement_location",
            "service": "site de présentation des chambres et demandes de réservation directes",
            "accroche": f"Pour préparer un séjour ou une halte, les voyageurs apprécient de visualiser immédiatement les chambres et les tarifs de {nom}.",
        }

    if any(k in secteur or k in nom_norm for k in ["ecole", "format", "institut", "academ", "cours", "universite"]):
        return {
            "code": "formation_ecole",
            "service": "portail d'information des programmes et pré-inscriptions en ligne",
            "accroche": f"Pour faire leur choix d'orientation, les familles et apprenants s'informent en priorité sur les formations de {nom} sur le web.",
        }

    if any(k in secteur or k in nom_norm for k in ["sante", "clinic", "cabinet", "docteur", "dentist", "pharmaci", "optiq"]):
        return {
            "code": "sante_rendezvous",
            "service": "site d'information médicale avec coordonnées claires et prise de rendez-vous",
            "accroche": f"Pour des soins ou une consultation auprès de {nom}, les patients ont besoin de repérer rapidement vos horaires et de vous joindre.",
        }

    # 6. Angle par défaut
    lieu = f" à {ville}" if ville else ""
    return {
        "code": "defaut_local",
        "service": "site vitrine moderne valorisant votre savoir-faire et vos coordonnées",
        "accroche": f"En découvrant les activités de {nom}{lieu}, nous avons pensé qu'une visibilité web claire vous permettrait d'attirer davantage de clients.",
    }


def message_de_secours(entreprise: Any, canal: str = "email") -> dict[str, str]:
    """Construit un message humain, irréprochable et prêt à l'envoi sans appel IA."""
    def _val(nom: str) -> Any:
        if isinstance(entreprise, dict):
            return entreprise.get(nom)
        return getattr(entreprise, nom, None)

    nom = _val("nom") or "votre établissement"
    contact = _val("contact_nom")
    salutation = f"Bonjour {contact}," if contact else f"Bonjour,"

    angle_info = choisir_angle(entreprise)
    accroche = angle_info["accroche"]
    service = angle_info["service"]

    phrase_contact = (
        f"Si cela vous intéresse, contactez-nous au {settings.agence_telephone_1} "
        f"ou au {settings.agence_telephone_2}."
    )

    if canal == "whatsapp":
        sujet = ""
        corps = (
            f"{salutation}\n\n"
            f"{accroche}\n\n"
            f"Avec {settings.agence_nom}, nous pouvons vous préparer un {service}, rapide sur mobile et sans engagement de votre part, afin que vous puissiez juger du résultat.\n\n"
            f"{phrase_contact}"
        )
    else:
        sujet = f"Une idée pour le développement de {nom}"[:58]
        corps = (
            f"{salutation}\n\n"
            f"{accroche}\n\n"
            f"Aujourd'hui, de plus en plus de clients recherchent des professionnels fiables depuis leur smartphone avant de décider. "
            f"Pour {nom}, nous pouvons concevoir un {service}, clair, facile à trouver et livré rapidement.\n\n"
            f"Nous accompagnons {settings.agence_preuve_clients} avec {settings.agence_argument_prix}. "
            f"Nous pouvons vous préparer une première maquette visuelle avec votre nom pour que vous voyiez le rendu.\n\n"
            f"{phrase_contact}"
        )

    return {
        "sujet": sujet,
        "corps": corps,
        "angle": angle_info["accroche"],
        "source": "secours",
    }
