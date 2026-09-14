# Compte rendu — Projet Nebula

## 1. Résumé du projet

**Nebula** est un système de gestion et de prospection commerciale B2B semi-automatisé, destiné à un usage interne (toi et ton collègue). Il vise à structurer et automatiser la démarche de prospection d'entreprises pour leur proposer des services digitaux et web.

Le système repose sur trois piliers :

1. **Un panel de gestion** permettant d'enregistrer des entreprises prospects avec leurs coordonnées (email et/ou numéro WhatsApp) et des métadonnées qualifiantes (type d'entreprise, prototype à présenter, description du prototype).
2. **Un moteur d'envoi multicanal** connecté à des services d'email et de WhatsApp (WhatsApp Business API) pour diffuser les messages.
3. **Un module de génération IA** qui, à partir des informations saisies sur l'entreprise et le service proposé, rédige automatiquement une demande d'audition ou une proposition commerciale personnalisée, prête à être envoyée.

L'ensemble forme un pipeline : **saisie des données → génération du message par IA → envoi automatisé → suivi.**

## 2. Fonctionnalités identifiées

### 2.1 Panel de gestion des entreprises
- Ajout / édition / suppression d'une fiche entreprise
- Champs : nom, email, numéro WhatsApp (l'un, l'autre, ou les deux), type d'entreprise, prototype à présenter, description du prototype
- Stockage en base de données

### 2.2 Module d'envoi
- Envoi d'emails automatisé
- Envoi de messages WhatsApp automatisé
- Connexion aux deux canaux selon les coordonnées disponibles

### 2.3 Génération IA du message
- L'IA reçoit les infos de l'entreprise + le service à proposer
- Elle rédige une demande d'audition ou une proposition personnalisée
- Le message généré est ensuite envoyé à l'entreprise

## 3. Recommandations et pistes d'amélioration

### 3.1 Suivi et statut de prospection (prioritaire)
Sans ça, le système envoie des messages mais ne sait pas ce qu'il en advient. Ajouter un statut par entreprise :
`Nouveau → Message généré → Envoyé → En attente de réponse → Répondu → Relance envoyée → Converti / Perdu`

### 3.2 Historique des échanges
Conserver un fil (thread) par entreprise : messages envoyés, dates, réponses reçues (si vous branchez la réception). Ça évite de renvoyer deux fois le même message et permet de reprendre le contexte pour une relance.

### 3.3 Validation humaine avant envoi (human-in-the-loop)
Plutôt qu'un envoi 100% automatique dès la génération IA, prévoir une étape de **relecture/validation** du message généré avant envoi (surtout au début). Ça évite les erreurs embarrassantes envoyées en masse à des prospects réels. Peut devenir optionnel une fois la qualité de génération éprouvée.

### 3.4 Relances automatiques
Si aucune réponse après X jours, programmer une relance (générée elle aussi par l'IA, avec un ton différent — plus court, plus direct).

### 3.5 Plusieurs variantes de message
Faire générer 2-3 versions du message par l'IA et laisser le choix (ou tester lequel convertit le mieux — A/B testing léger).

### 3.6 Segmentation et tags
Ajouter des tags/catégories (secteur d'activité, taille, région, priorité) pour filtrer et cibler les campagnes plus finement, et adapter le ton du message généré selon le secteur.

### 3.7 Import en masse
Permettre l'import CSV/Excel d'une liste d'entreprises plutôt que la saisie unitaire — utile si vous constituez une base de prospects à partir de sources externes.

### 3.8 File d'attente d'envoi (queue)
Les envois emails/WhatsApp ne sont pas toujours instantanés (limites de débit, échecs de livraison). Une file d'attente asynchrone avec retry automatique évite de perdre des messages en cas d'échec API.

### 3.9 Validation des contacts
Vérifier le format email et numéro WhatsApp à la saisie pour éviter les échecs d'envoi silencieux.

### 3.10 Gestion des fichiers du prototype
Si le "prototype à présenter" implique des visuels, une démo ou un document, prévoir le stockage et la jointure automatique de ces fichiers dans le message (pièce jointe email, lien pour WhatsApp).

### 3.11 Multi-utilisateur avec assignation
Comme vous êtes deux, prévoir une assignation des entreprises à l'un ou l'autre (éviter les doublons de prospection) et des permissions basiques.

### 3.12 Respect des bonnes pratiques anti-spam
- Ne pas dépasser les limites d'envoi imposées par les fournisseurs email et par l'API WhatsApp Business (risque de blocage du compte)
- Prévoir un lien/mention de désinscription pour les emails
- Espacer les envois (délai entre chaque message plutôt qu'un envoi en rafale)

### 3.13 Tableau de bord analytique
Vue d'ensemble : nombre de prospects, taux de réponse, taux de conversion, canal le plus efficace (email vs WhatsApp). Utile pour ajuster la stratégie avec des données concrètes plutôt qu'à l'instinct.

## 4. Architecture technique suggérée

| Composant | Rôle |
|---|---|
| Backend API | Gère les entreprises, déclenche génération IA et envois |
| Base de données | Entreprises, historique des messages, statuts, fichiers |
| Worker / queue (asynchrone) | Traite les envois email/WhatsApp en arrière-plan avec retry |
| Service IA | Génère le message à partir des infos entreprise + service proposé |
| Intégration email | API SMTP ou fournisseur transactionnel (ex : Brevo, Mailgun) |
| Intégration WhatsApp | WhatsApp Business API (via un fournisseur type Meta Cloud API, Twilio, ou 360dialog) |
| Panel (frontend) | Interface de saisie, suivi des statuts, validation des messages générés |

## 5. Prochaines étapes suggérées

1. Définir le schéma de base de données (entreprises, messages, statuts, utilisateurs)
2. Choisir les fournisseurs email et WhatsApp Business
3. Construire le panel de saisie + liste des entreprises avec statut
4. Intégrer la génération IA avec validation humaine avant envoi (v1)
5. Ajouter la file d'envoi asynchrone
6. Itérer vers l'automatisation complète (relances, A/B testing) une fois la v1 stable
