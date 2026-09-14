from urllib.parse import quote


def generer_lien_wa_me(numero_destinataire: str, contenu: str) -> str:
    """Génère un lien wa.me pré-rempli, pour envoi manuel en attendant l'accès
    à l'API Meta Cloud (vérification Business en cours).

    numero_destinataire doit être au format international (avec ou sans '+').
    Le message est pré-rempli mais doit être envoyé manuellement en cliquant
    le lien puis en appuyant sur "Envoyer" dans WhatsApp.
    """
    numero_nettoye = numero_destinataire.lstrip("+").replace(" ", "")
    message_encode = quote(contenu)
    return f"https://wa.me/{numero_nettoye}?text={message_encode}"
