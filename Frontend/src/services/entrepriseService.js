import api from './api'

export async function listerEntreprises({ skip = 0, limit = 50, statut, type_entreprise } = {}) {
  const { data } = await api.get('/api/entreprises', {
    params: { skip, limit, statut, type_entreprise },
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
