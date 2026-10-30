import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  corrigerMessage,
  envoyerMessage,
  genererMessage,
  genererRelance,
  getAngleSuggere,
  getAnglesDisponibles,
  getApercuEmail,
  getHistoriqueMessages,
  getMessage,
  marquerEnvoyeManuellement,
} from '../services/messageService'

export function useHistoriqueMessages(entrepriseId) {
  return useQuery({
    queryKey: ['messages', entrepriseId],
    queryFn: () => getHistoriqueMessages(entrepriseId),
    enabled: Boolean(entrepriseId),
  })
}

export function useAngleSuggere(entrepriseId) {
  return useQuery({
    queryKey: ['angle-suggere', entrepriseId],
    queryFn: () => getAngleSuggere(entrepriseId),
    enabled: Boolean(entrepriseId),
  })
}

export function useAnglesDisponibles() {
  return useQuery({
    queryKey: ['angles-disponibles'],
    queryFn: getAnglesDisponibles,
    staleTime: 1000 * 60 * 10,
  })
}

export function useMessage(id, { poll = false } = {}) {
  return useQuery({
    queryKey: ['message', id],
    queryFn: () => getMessage(id),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      if (!poll) return false
      return query.state.data?.statut_envoi === 'en_attente' ? 2500 : false
    },
  })
}

export function useGenererMessage(entrepriseId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: genererMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', entrepriseId] })
      queryClient.invalidateQueries({ queryKey: ['entreprise', entrepriseId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-actions'] })
    },
  })
}

export function useCorrigerMessage(entrepriseId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => corrigerMessage(id, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(['message', data.id], data)
      queryClient.invalidateQueries({ queryKey: ['messages', entrepriseId] })
    },
  })
}

export function useEnvoyerMessage(entrepriseId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: envoyerMessage,
    onSettled: (_data, _erreur, messageId) => {
      queryClient.invalidateQueries({ queryKey: ['messages', entrepriseId] })
      queryClient.invalidateQueries({ queryKey: ['message', messageId] })
      queryClient.invalidateQueries({ queryKey: ['entreprise', entrepriseId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-actions'] })
    },
  })
}

export function useMarquerEnvoyeManuellement(entrepriseId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: marquerEnvoyeManuellement,
    onSuccess: (data) => {
      queryClient.setQueryData(['message', data.id], data)
      queryClient.invalidateQueries({ queryKey: ['messages', entrepriseId] })
      queryClient.invalidateQueries({ queryKey: ['entreprise', entrepriseId] })
      queryClient.invalidateQueries({ queryKey: ['entreprises'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-actions'] })
    },
  })
}

export function useGenererRelance(entrepriseId) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => genererRelance(entrepriseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', entrepriseId] })
      queryClient.invalidateQueries({ queryKey: ['entreprise', entrepriseId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-actions'] })
    },
  })
}

export function useApercuEmail(id, { enabled = true } = {}) {
  return useQuery({
    queryKey: ['apercu-email', id],
    queryFn: () => getApercuEmail(id),
    enabled: Boolean(id) && enabled,
    staleTime: 30_000,
  })
}
