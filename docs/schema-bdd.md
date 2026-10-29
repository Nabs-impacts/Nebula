# Schéma de base de données — Nebula

PostgreSQL 16. Les identifiants sont des UUID. Les dates sont stockées en `timestamptz`.

## `utilisateurs`

| Colonne | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `nom` | VARCHAR(255) | requis |
| `email` | VARCHAR(255) | unique, requis |
| `mot_de_passe_hash` | VARCHAR(255) | bcrypt |
| `est_actif` | BOOLEAN | défaut `true` |
| `est_admin` | BOOLEAN | défaut `false` |
| `date_creation` | TIMESTAMPTZ | défaut `now()` |

## `entreprises`

| Colonne | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `nom` | VARCHAR(255) | requis |
| `email` | VARCHAR(255) | nullable |
| `whatsapp` | VARCHAR(30) | format international `+227…` |
| `contact_nom` | VARCHAR(255) | nom du contact |
| `ville` | VARCHAR(120) | ex. Niamey |
| `site_web` | VARCHAR(500) | URL si site existant |
| `presence_web` | ENUM | `aucun_site`, `site_existant`, `inconnu` |
| `note_google` | FLOAT | 0 à 5 |
| `autres_observations` | TEXT | angle d’accroche / faits vérifiés |
| `priorite` | ENUM | `basse`, `normale`, `haute` |
| `tags` | VARCHAR[] | segmentation libre |
| `type_entreprise` | ENUM | `commerce`, `restauration`, `sante`, `education`, `finance`, `agriculture`, `transport`, `autre` |
| `prototype_a_presenter` | VARCHAR(255) | requis |
| `description_prototype` | TEXT | requis |
| `statut` | ENUM | `nouveau`, `message_genere`, `envoye`, `en_attente_reponse`, `repondu`, `relance_envoyee`, `converti`, `perdu` |
| `assigne_a_id` | UUID | nullable |
| `date_creation` | TIMESTAMPTZ | défaut `now()` |
| `date_mise_a_jour` | TIMESTAMPTZ | mise à jour automatique |

Contrainte applicative : au moins un email ou un WhatsApp est requis.

## `messages`

| Colonne | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `entreprise_id` | UUID | FK → `entreprises.id`, `ON DELETE CASCADE` |
| `canal` | ENUM | `email`, `whatsapp` |
| `sujet` | VARCHAR(255) | objet email généré par l’IA |
| `angle` | TEXT | observation utilisée par l’IA |
| `contenu_genere` | TEXT | sortie IA |
| `contenu_final` | TEXT | version corrigée manuellement |
| `est_relance` | BOOLEAN | défaut `false` |
| `statut_envoi` | ENUM | `en_attente`, `envoye`, `echec` |
| `date_generation` | TIMESTAMPTZ | défaut `now()` |
| `date_envoi` | TIMESTAMPTZ | nullable |

## `notes`

| Colonne | Type | Notes |
|---|---|---|
| `id` | UUID | PK |
| `entreprise_id` | UUID | FK → `entreprises.id`, `ON DELETE CASCADE` |
| `auteur_id` | UUID | FK → `utilisateurs.id`, `ON DELETE SET NULL` |
| `contenu` | TEXT | requis |
| `date_creation` | TIMESTAMPTZ | défaut `now()` |

## `prototype_fichiers` (prévu)

Table de stockage des fichiers prototypes (URL Cloudflare R2), non branchée dans l’UI actuelle.

## Relations

- `entreprises` 1—N `messages`
- `entreprises` 1—N `notes`
- `utilisateurs` 1—N `notes` (optionnel)

## Migrations

- `095a6ce51df0` : tables initiales.
- `7b2f4c9a1d3e` : enrichissement prospects, sujet/angle messages, notes.
- `9c1e5a7b2f40` : harmonisation des valeurs d’enum en minuscules.
