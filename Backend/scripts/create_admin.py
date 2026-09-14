"""Crée ou réinitialise un utilisateur admin.
Usage : python scripts/create_admin.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db.base import SessionLocal
from app.models.utilisateur import Utilisateur
from app.core.security import hash_mot_de_passe

EMAIL = "admin@tenora-digital.store"
MOT_DE_PASSE = "change-moi"
NOM = "Admin"


def main():
    db = SessionLocal()
    try:
        utilisateur = db.query(Utilisateur).filter(Utilisateur.email == EMAIL).first()
        if utilisateur:
            utilisateur.mot_de_passe_hash = hash_mot_de_passe(MOT_DE_PASSE)
            utilisateur.est_admin = True
            utilisateur.est_actif = True
            db.commit()
            print(f"Mis à jour : {EMAIL}")
        else:
            utilisateur = Utilisateur(
                nom=NOM,
                email=EMAIL,
                mot_de_passe_hash=hash_mot_de_passe(MOT_DE_PASSE),
                est_admin=True,
                est_actif=True,
            )
            db.add(utilisateur)
            db.commit()
            print(f"Créé : {EMAIL}")
        print(f"Mot de passe : {MOT_DE_PASSE}")
    finally:
        db.close()


if __name__ == "__main__":
    main()