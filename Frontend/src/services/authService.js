import api from './api'

export async function login(email, mot_de_passe) {
  const { data } = await api.post('/api/auth/login', { email, mot_de_passe })
  return data // { access_token, token_type }
}

export async function getProfil() {
  const { data } = await api.get('/api/utilisateurs/moi')
  return data
}

export async function listerUtilisateurs() {
  const { data } = await api.get('/api/utilisateurs')
  return data
}

export async function creerUtilisateur(payload) {
  const { data } = await api.post('/api/utilisateurs', payload)
  return data
}

export async function modifierUtilisateur(id, payload) {
  const { data } = await api.patch(`/api/utilisateurs/${id}`, payload)
  return data
}
