import api from './api'

export async function listerEntreprises({
  skip = 0,
  limit = 50,
  statut,
  type_entreprise,
  q,
  ville,
  priorite,
  tag,
} = {}) {
  const { data } = await api.get('/api/entreprises', {
    params: { skip, limit, statut, type_entreprise, q, ville, priorite, tag },
  })
  return data
}

export async function getEntreprise(id) {
  const { data } = await api.get(`/api/entreprises/${id}`)
  return data
}

function nettoyerPayload(payload) {
  const nettoye = { ...payload }
  if (nettoye.email === '') nettoye.email = undefined
  if (nettoye.whatsapp === '') nettoye.whatsapp = undefined
  if (nettoye.note_google === '' || nettoye.note_google === null) nettoye.note_google = undefined
  return nettoye
}

export async function creerEntreprise(payload) {
  const { data } = await api.post('/api/entreprises', nettoyerPayload(payload))
  return data
}

export async function modifierEntreprise(id, payload) {
  const { data } = await api.patch(`/api/entreprises/${id}`, nettoyerPayload(payload))
  return data
}

export async function supprimerEntreprise(id) {
  await api.delete(`/api/entreprises/${id}`)
}

export async function getStatsDashboard() {
  const { data } = await api.get('/api/dashboard/stats')
  return data
}

export async function getActionsDashboard() {
  const { data } = await api.get('/api/dashboard/actions')
  return data
}

export async function importerEntreprisesCsv(fichier) {
  const formulaire = new FormData()
  formulaire.append('fichier', fichier)
  const { data } = await api.post('/api/entreprises/import/csv', formulaire)
  return data
}

export async function exporterEntreprisesCsv() {
  const { data } = await api.get('/api/entreprises/export/csv', { responseType: 'blob' })
  const url = URL.createObjectURL(new Blob([data], { type: 'text/csv;charset=utf-8' }))
  const lien = document.createElement('a')
  lien.href = url
  lien.download = 'prospects-nebula.csv'
  document.body.appendChild(lien)
  lien.click()
  lien.remove()
  URL.revokeObjectURL(url)
}
