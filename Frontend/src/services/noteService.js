import api from './api'

export async function listerNotes(entrepriseId) {
  const { data } = await api.get(`/api/entreprises/${entrepriseId}/notes`)
  return data
}

export async function creerNote(entrepriseId, contenu) {
  const { data } = await api.post(`/api/entreprises/${entrepriseId}/notes`, { contenu })
  return data
}

export async function supprimerNote(noteId) {
  await api.delete(`/api/notes/${noteId}`)
}
