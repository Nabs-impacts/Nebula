# Stack technique — Projet Nebula

Stack pensée pour un démarrage à faible volume, avec priorité au **gratuit / free tier** partout où c'est viable, tout en restant évolutive si la prospection monte en charge plus tard.

## 1. Vue d'ensemble

| Couche | Choix | Coût |
|---|---|---|
| Backend | FastAPI (Python) | Gratuit |
| Base de données | PostgreSQL | Gratuit (VPS existant ou Neon free tier) |
| Frontend (panel) | React + Vite (ou Next.js) | Gratuit (Vercel) |
| File d'attente / tâches asynchrones | RQ + Redis (léger) | Gratuit |
| Email | Brevo | Déjà en place, free tier 300 mails/jour |
| WhatsApp | Meta Cloud API (WhatsApp Business Platform) | Free tier généreux au démarrage |
| Génération IA | Groq API (Llama 3.3) | Gratuit |
| Hébergement | VPS Hetzner existant (Tenora) | Déjà payé |
| Stockage fichiers (prototypes) | Cloudflare R2 | Free tier 10 Go |

## 2. Backend — FastAPI (Python)

Vous l'utilisez déjà côté Tenora et NigerCivil, donc pas de nouvelle courbe d'apprentissage. FastAPI gère bien :
- Les endpoints CRUD entreprises
- Le déclenchement de la génération IA
- L'appel aux API Brevo / WhatsApp

**Librairies utiles :** `sqlalchemy` + `alembic` (migrations, déjà votre habitude), `pydantic` pour valider les fiches entreprises (email/numéro), `httpx` pour appeler les API externes.

## 3. Base de données — PostgreSQL

Réutiliser l'instance PostgreSQL sur votre VPS Hetzner (déjà en place pour Tenora) évite un coût et une gestion supplémentaires. Une base ou un schéma dédié suffit pour Nebula.

**Tables principales suggérées :**
- `entreprises` (nom, email, whatsapp, type, description_prototype, tags, statut)
- `messages` (entreprise_id, canal, contenu_genere, contenu_final, date_envoi, statut_envoi)
- `utilisateurs` (toi + ton collègue, pour l'assignation)

## 4. Frontend — React (Vite ou Next.js)

Un simple panel admin : liste des entreprises, formulaire d'ajout, aperçu du message généré avant envoi, statuts. Déployable gratuitement sur Vercel, comme le frontend Tenora. Pas besoin de framework lourd vu la taille du panel.

## 5. File d'attente légère — RQ + Redis

Vu le faible volume de départ, pas besoin de Celery (plus lourd à configurer). **RQ (Redis Queue)** est plus simple, suffisant pour gérer :
- Les envois email/WhatsApp en tâche de fond
- Les retries en cas d'échec d'API

Redis peut tourner en conteneur Docker sur votre VPS existant, sans coût additionnel. Alternative encore plus simple si vous voulez zéro infra en plus : `FastAPI BackgroundTasks` pour commencer, puis migrer vers RQ si le volume augmente.

## 6. Email — Brevo (déjà en place)

Vous l'utilisez déjà, donc rien à changer. Le free tier (300 mails/jour) est largement suffisant pour démarrer. Utiliser leur API REST (ou le SDK Python officiel) plutôt que SMTP direct pour profiter du tracking d'ouverture/clics inclus.

## 7. WhatsApp — Meta Cloud API

Pour démarrer sans frais :
- **Meta Cloud API** (WhatsApp Business Platform officielle) : free tier avec un quota de conversations gratuites par mois, largement suffisant en phase de lancement. Nécessite une vérification d'entreprise Meta Business (peut prendre quelques jours, donc à démarrer tôt).
- Alternative si la vérification Meta est trop lente pour commencer : envoyer manuellement via des liens `wa.me/<numero>?text=<message_pré-rempli>` généré automatiquement par votre panel — pas d'automatisation complète, mais zéro friction technique pour un MVP en attendant l'accès API.

**À éviter pour l'instant :** Twilio ou 360dialog, qui ajoutent une couche de coût (markup sur chaque message) inutile à faible volume — l'API Meta directe est plus économique une fois validée.

## 8. Génération IA — Groq (recommandé) ou Mistral

Deux options gratuites solides pour la rédaction des messages :

- **Groq API** (modèles Llama 3.3/3.1) : gratuit avec un quota de requêtes/jour généreux, très rapide, qualité de rédaction correcte en français. Bon choix par défaut pour démarrer sans dépense.
- **Mistral AI (La Plateforme)** : alternative avec un free tier également, modèles nativement plus à l'aise en français vu leur origine — à considérer si la qualité de rédaction en français de Groq/Llama ne satisfait pas pleinement.

Recommandation : commencer avec Groq (rapidité + gratuité), garder Mistral en secours/comparaison si besoin d'affiner le ton des messages générés.

## 9. Stockage des prototypes — Cloudflare R2

Vous l'utilisez déjà pour Tenora (backups, ebooks). Le free tier (10 Go, pas de frais de sortie) suffit largement pour stocker les visuels/documents de prototypes à joindre aux messages.

## 10. Hébergement global

Tout peut tourner sur le **VPS Hetzner déjà utilisé pour Tenora**, en conteneurs Docker séparés (backend Nebula, Redis, PostgreSQL si pas déjà mutualisé) pour ne pas mélanger les projets tout en évitant un coût de serveur supplémentaire. Frontend sur Vercel comme pour Tenora.

## 11. Résumé des coûts au démarrage

| Service | Coût |
|---|---|
| Backend + DB + Redis | 0 (VPS déjà payé) |
| Frontend Vercel | 0 |
| Brevo | 0 (free tier déjà utilisé) |
| Meta Cloud API WhatsApp | 0 (free tier de lancement) |
| Groq / Mistral IA | 0 (free tier) |
| Cloudflare R2 | 0 (free tier) |
| **Total** | **0 FCFA supplémentaire** |

Le seul vrai coût potentiel à prévoir plus tard : dépasser les quotas gratuits Brevo/Meta/Groq si le volume de prospection augmente fortement — mais ça reste un problème de "bonne nouvelle" (ça voudra dire que Nebula marche).
