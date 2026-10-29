# API Nebula

Base URL : `http://localhost:8000`. Authentification : `Authorization: Bearer <JWT>` sur toutes les routes sauf `/health` et `/api/auth/login`.

## Santé

| Méthode | Route | Description |
|---|---|---|
| GET | `/health` | Statut de l’API |

## Authentification

| Méthode | Route | Description |
|---|---|---|
| POST | `/api/auth/login` | `{ email, mot_de_passe }` → `{ access_token, token_type }` |

## Utilisateurs

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/utilisateurs/moi` | Profil courant |
| GET | `/api/utilisateurs` | Liste (admin) |
| POST | `/api/utilisateurs` | Création (admin) |
| PATCH | `/api/utilisateurs/{id}` | Modification (admin) |

## Entreprises

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/entreprises` | Liste filtrable |
| POST | `/api/entreprises` | Création |
| GET | `/api/entreprises/{id}` | Détail |
| PATCH | `/api/entreprises/{id}` | Modification partielle (dont `statut`) |
| DELETE | `/api/entreprises/{id}` | Suppression |
| GET | `/api/entreprises/export/csv` | Export CSV (UTF-8 BOM) |
| POST | `/api/entreprises/import/csv` | Import CSV multipart (`fichier`) |

Paramètres de `GET /api/entreprises` : `skip`, `limit`, `statut`, `type_entreprise`, `q`, `ville`, `priorite`, `tag`.

Champs principaux : `nom`, `email`, `whatsapp`, `contact_nom`, `ville`, `site_web`, `presence_web`, `note_google`, `autres_observations`, `priorite`, `tags`, `type_entreprise`, `prototype_a_presenter`, `description_prototype`, `statut`.

## Notes

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/entreprises/{id}/notes` | Liste des notes |
| POST | `/api/entreprises/{id}/notes` | Ajout `{ contenu }` |
| DELETE | `/api/notes/{id}` | Suppression |

## Messages

| Méthode | Route | Description |
|---|---|---|
| POST | `/api/messages` | Création manuelle |
| GET | `/api/messages/entreprise/{id}` | Historique d’une entreprise |
| GET | `/api/messages/{id}` | Détail |
| PATCH | `/api/messages/{id}` | Correction (`sujet`, `contenu_final`, `statut_envoi`) |
| POST | `/api/messages/generer` | Génération IA |
| POST | `/api/messages/relance/{entreprise_id}` | Génération manuelle d’une relance |
| POST | `/api/messages/{id}/envoyer` | Envoi synchrone, retourne le message à jour (502 avec détail si le fournisseur échoue) |
| GET | `/api/messages/{id}/apercu-email` | HTML de l’email branded (même template que Brevo) |

Corps de génération :
```json
{
  "entreprise_id": "uuid",
  "canal": "email",
  "service_a_proposer": "site vitrine + SEO local",
  "ton": "professionnel"
}
```

La génération utilise Groq (modèle défini par `GROQ_MODEL`) puis Mistral en repli. Le prompt impose une observation factuelle, une conséquence concrète, la crédibilité de l’agence, une solution et un pas suivant. La réponse est parsée en `{ objet, corps, angle }`.

## Dashboard

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/dashboard/stats` | Compteurs, répartitions, à relancer, brouillons, réponses |
| GET | `/api/dashboard/actions` | Listes actionnables du jour |

## Envoi

- Email : Brevo (`BREVO_API_KEY`, `BREVO_SENDER_EMAIL`).
- WhatsApp : Meta Cloud API (`WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`). Texte libre uniquement dans la fenêtre de 24 h ; hors fenêtre, utiliser un template approuvé.
- La signature Tenora est ajoutée automatiquement si absente.
- Après envoi : `en_attente_reponse` (ou `relance_envoyee` pour une relance).
