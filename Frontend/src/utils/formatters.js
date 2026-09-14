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
  nouveau: { text: '#9aacaa', ring: 'rgba(154,172,170,0.35)', bg: 'rgba(154,172,170,0.1)' },
  message_genere: { text: '#a78bfa', ring: 'rgba(167,139,250,0.35)', bg: 'rgba(167,139,250,0.1)' },
  envoye: { text: '#22d3ee', ring: 'rgba(34,211,238,0.35)', bg: 'rgba(34,211,238,0.1)' },
  en_attente_reponse: { text: '#ffb454', ring: 'rgba(255,180,84,0.35)', bg: 'rgba(255,180,84,0.1)' },
  repondu: { text: '#60a5fa', ring: 'rgba(96,165,250,0.35)', bg: 'rgba(96,165,250,0.1)' },
  relance_envoyee: { text: '#fb923c', ring: 'rgba(251,146,60,0.35)', bg: 'rgba(251,146,60,0.1)' },
  converti: { text: '#39ff88', ring: 'rgba(57,255,136,0.4)', bg: 'rgba(57,255,136,0.12)' },
  perdu: { text: '#ff5470', ring: 'rgba(255,84,112,0.35)', bg: 'rgba(255,84,112,0.1)' },
}

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
