import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { creerNote, listerNotes, supprimerNote } from '../services/noteService'

export function useNotes(entrepriseId) {
  return useQuery({
    queryKey: ['notes', entrepriseId],
    queryFn: () => listerNotes(entrepriseId),
    enabled: Boolean(entrepriseId),
  })
}

export function useCreerNote(entrepriseId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (contenu) => creerNote(entrepriseId, contenu),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', entrepriseId] })
    },
  })
}

export function useSupprimerNote(entrepriseId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: supprimerNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', entrepriseId] })
    },
  })
}
