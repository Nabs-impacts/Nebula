class ErreurIA(Exception):
    """Erreur générique d'appel à un fournisseur IA."""
    pass


class ReponseIACoupeeOuVide(ErreurIA):
    """La réponse retournée par l'IA est vide ou a été tronquée par la limite de tokens."""
    pass


class LimiteDebitIAErreur(ErreurIA):
    """Erreur 429 avec attente non supportée ou quota dépassé."""
    pass
