import api from './api'

export async function genererMessage({
  entreprise_id,
  canal = 'email',
  consigne_supplementaire,
  angle_code,
  service_a_proposer,
}) {
  const { data } = await api.post('/api/messages/generer', {
    entreprise_id,
    canal,
    consigne_supplementaire,
    angle_code,
    service_a_proposer,
  })
  return data
}

export async function getHistoriqueMessages(entrepriseId) {
  const { data } = await api.get(`/api/messages/entreprise/${entrepriseId}`)
  return data
}

export async function getMessage(id) {
  const { data } = await api.get(`/api/messages/${id}`)
  return data
}

export async function corrigerMessage(id, payload) {
  const { data } = await api.patch(`/api/messages/${id}`, payload)
  return data
}

export async function envoyerMessage(id) {
  const { data } = await api.post(`/api/messages/${id}/envoyer`)
  return data
}

export async function marquerEnvoyeManuellement(id) {
  const { data } = await api.post(`/api/messages/${id}/marquer-envoye-manuellement`)
  return data
}

export async function genererRelance(entrepriseId) {
  const { data } = await api.post(`/api/messages/relance/${entrepriseId}`)
  return data
}

export async function getApercuEmail(id) {
  const { data } = await api.get(`/api/messages/${id}/apercu-email`)
  return data
}

export async function getAngleSuggere(entrepriseId) {
  const { data } = await api.get(`/api/messages/entreprise/${entrepriseId}/angle-suggere`)
  return data
}

export async function getAnglesDisponibles() {
  const { data } = await api.get('/api/messages/angles-disponibles')
  return data
}
