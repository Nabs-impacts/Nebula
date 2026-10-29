   import os
   import app.db.init_db  # enregistre tous les modèles
   from app.core.security import hash_mot_de_passe
   from app.db.base import SessionLocal
   from app.models.utilisateur import Utilisateur

   email = os.environ["ADMIN_EMAIL"]
   db = SessionLocal()
   if db.query(Utilisateur).filter(Utilisateur.email == email).first():
       print("Cet utilisateur existe déjà")
   else:
       db.add(Utilisateur(
           nom=os.environ.get("ADMIN_NOM", "Admin"),
           email=email,
           mot_de_passe_hash=hash_mot_de_passe(os.environ["ADMIN_PASSWORD"]),
           est_admin=True,
           est_actif=True,
       ))
       db.commit()
       print("Admin créé")
