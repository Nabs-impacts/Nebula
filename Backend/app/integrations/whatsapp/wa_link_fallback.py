import re
from urllib.parse import quote


def normaliser_numero_whatsapp(numero: str | None) -> str | None:
    """Normalise un numéro WhatsApp vers le format international attendu par wa.me.

    - conserve uniquement les chiffres (retire +, espaces, tirets, parenthèses) ;
    - retire les « 00 » initiaux ;
    - ajoute l'indicatif du Niger (227) à un numéro local de 8 chiffres ;
    - ne double jamais un numéro qui commence déjà par 227.

    Retourne None si le numéro est vide ou invalide.
    """
    if not numero:
        return None

    chiffres = re.sub(r"\D", "", str(numero))
    if not chiffres:
        return None

    if chiffres.startswith("00"):
        chiffres = chiffres[2:]

    if not chiffres:
        return None

    if chiffres.startswith("227"):
        # Déjà au format international : ne pas préfixer une seconde fois.
        pass
    elif len(chiffres) == 8:
        chiffres = f"227{chiffres}"

    if not re.fullmatch(r"\d{8,15}", chiffres):
        return None

    return chiffres


def generer_lien_wa_me(numero_destinataire: str, contenu: str) -> str:
    """Génère un lien wa.me pré-rempli, pour envoi manuel en attendant l'accès
    à l'API Meta Cloud (vérification Business en cours).

    numero_destinataire peut être au format local (8 chiffres) ou international.
    Le message est pré-rempli mais doit être envoyé manuellement en cliquant
    le lien puis en appuyant sur "Envoyer" dans WhatsApp.
    """
    numero_nettoye = normaliser_numero_whatsapp(numero_destinataire)
    if numero_nettoye is None:
        raise ValueError("Numéro WhatsApp invalide")

    message_encode = quote(contenu, safe="")
    return f"https://wa.me/{numero_nettoye}?text={message_encode}"
