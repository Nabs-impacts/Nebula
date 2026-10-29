import api from './api'

export async function getResumeReponses() {
  const { data } = await api.get('/api/reponses/resume')
  return data
}

export async function listerReponses({ entreprise_id, non_lues, limit = 50 } = {}) {
  const params = { limit }
  if (entreprise_id) params.entreprise_id = entreprise_id
  if (non_lues !== undefined) params.non_lues = non_lues

  const { data } = await api.get('/api/reponses', { params })
  return data
}

export async function marquerReponseLue(id) {
  const { data } = await api.post(`/api/reponses/${id}/lue`)
  return data
}

export async function marquerReponsesLues(entreprise_id = null) {
  const payload = entreprise_id ? { entreprise_id } : {}
  const { data } = await api.post('/api/reponses/marquer-lues', payload)
  return data
}

export async function verifierReponsesImap() {
  const { data } = await api.post('/api/reponses/verifier')
  return data
}
