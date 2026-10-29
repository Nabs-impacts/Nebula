export const STATUT_LABELS = {
  nouveau: 'Nouveau',
  message_genere: 'Message généré',
  envoye: 'Envoyé',
  en_attente_reponse: 'En attente de réponse',
  repondu: 'Répondu',
  relance_envoyee: 'Relance envoyée',
  converti: 'Converti',
  perdu: 'Perdu',
}

export const STATUT_COLORS = {
  nouveau: { text: '#a89b8c', ring: 'rgba(168,155,140,0.32)', bg: 'rgba(168,155,140,0.09)' },
  message_genere: { text: '#c9a87c', ring: 'rgba(201,168,124,0.34)', bg: 'rgba(201,168,124,0.1)' },
  envoye: { text: '#9db4c0', ring: 'rgba(157,180,192,0.34)', bg: 'rgba(157,180,192,0.1)' },
  en_attente_reponse: { text: '#e0a458', ring: 'rgba(224,164,88,0.36)', bg: 'rgba(224,164,88,0.1)' },
  repondu: { text: '#8fb0c4', ring: 'rgba(143,176,196,0.34)', bg: 'rgba(143,176,196,0.1)' },
  relance_envoyee: { text: '#e2725b', ring: 'rgba(226,114,91,0.36)', bg: 'rgba(226,114,91,0.1)' },
  converti: { text: '#8fbf9f', ring: 'rgba(143,191,159,0.4)', bg: 'rgba(143,191,159,0.11)' },
  perdu: { text: '#d9695b', ring: 'rgba(217,105,91,0.34)', bg: 'rgba(217,105,91,0.09)' },
}

export const PRIORITE_LABELS = {
  basse: 'Basse',
  normale: 'Normale',
  haute: 'Haute',
}

export const PRIORITE_COLORS = {
  basse: { text: '#9db4c0', ring: 'rgba(157,180,192,0.34)', bg: 'rgba(157,180,192,0.1)' },
  normale: { text: '#e0a458', ring: 'rgba(224,164,88,0.36)', bg: 'rgba(224,164,88,0.1)' },
  haute: { text: '#e2725b', ring: 'rgba(226,114,91,0.36)', bg: 'rgba(226,114,91,0.1)' },
}

export const PRESENCE_WEB_LABELS = {
  aucun_site: 'Aucun site web',
  site_existant: 'Site existant',
  inconnu: 'Non vérifié',
}

export const KANBAN_COLONNES = [
  { statut: 'nouveau', label: 'Nouveau', statuts: ['nouveau'] },
  { statut: 'message_genere', label: 'À valider', statuts: ['message_genere'] },
  {
    statut: 'en_attente_reponse',
    label: 'Contacté',
    statuts: ['envoye', 'en_attente_reponse'],
  },
  { statut: 'relance_envoyee', label: 'Relancé', statuts: ['relance_envoyee'] },
  { statut: 'repondu', label: 'Répondu', statuts: ['repondu'] },
  { statut: 'converti', label: 'Converti', statuts: ['converti'] },
  { statut: 'perdu', label: 'Perdu', statuts: ['perdu'] },
]

export const TYPE_ENTREPRISE_LABELS = {
  commerce: 'Commerce',
  restauration: 'Restauration',
  sante: 'Santé',
  education: 'Éducation',
  finance: 'Finance',
  agriculture: 'Agriculture',
  transport: 'Transport',
  autre: 'Autre',
}

export const CANAL_LABELS = {
  email: 'Email',
  whatsapp: 'WhatsApp',
}

export const STATUT_ENVOI_LABELS = {
  en_attente: 'En attente',
  envoye: 'Envoyé',
  echec: 'Échec',
}

export function formatDate(dateIso) {
  if (!dateIso) return '—'
  const date = new Date(dateIso)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatDateCourte(dateIso) {
  if (!dateIso) return '—'
  const date = new Date(dateIso)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function formatPourcentage(valeur) {
  if (valeur === null || valeur === undefined) return '—'
  return `${Number(valeur).toFixed(1).replace(/\.0$/, '')}%`
}

export function tronquerTexte(texte, longueur = 80) {
  if (!texte) return ''
  return texte.length > longueur ? `${texte.slice(0, longueur).trim()}…` : texte
}
