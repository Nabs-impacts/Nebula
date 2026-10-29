# Nebula

Panel de prospection B2B automatisé — stockage des entreprises prospects (email/WhatsApp), génération IA de propositions personnalisées, et envoi multicanal.

## Structure du projet

```
nebula/
├── backend/     # API FastAPI (entreprises, messages, génération IA, envoi)
├── frontend/    # Panel React (saisie, suivi, validation des messages)
├── infra/       # Docker, Nginx, scripts de déploiement
└── docs/        # Documentation (stack, schéma BDD, compte rendu)
```

## Fonctionnalités principales

- Enregistrement des entreprises prospects (email et/ou WhatsApp) avec type, prototype à présenter et description
- Génération automatique d'une demande d'audition ou proposition personnalisée via IA (Groq / Mistral)
- Envoi par email (Brevo) et WhatsApp (Meta Cloud API)
- Suivi des statuts de prospection et historique des échanges par entreprise
- Relances automatiques et tableau de bord de conversion

## Démarrage rapide

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # renseigner les clés API
alembic upgrade head
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

L'envoi des messages (email/WhatsApp) est synchrone : l'application attend la
réponse de Brevo ou de WhatsApp pour afficher un succès ou une erreur détaillée.
Aucune commande supplémentaire à lancer pour démarrer.

*(Une file d'attente RQ/Redis est déjà codée dans `app/workers/` pour le jour
où le volume d'envois justifiera plusieurs workers avec retries robustes.
Pas nécessaire au démarrage.)*

## Stack technique

Voir [`docs/nebula-stack-technique.md`](docs/nebula-stack-technique.md) pour le détail des choix techniques (FastAPI, PostgreSQL, React, RQ/Redis, Brevo, Meta Cloud API, Groq/Mistral).

## Documentation

- [`docs/nebula-compte-rendu.md`](docs/nebula-compte-rendu.md) — présentation du projet et recommandations
- [`docs/schema-bdd.md`](docs/schema-bdd.md) — schéma de la base de données
- [`docs/api-reference.md`](docs/api-reference.md) — référence des endpoints de l'API

## Équipe

Projet mené par Nabs et son collègue.
