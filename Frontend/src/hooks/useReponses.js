import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './useAuth'
import {
  getResumeReponses,
  listerReponses,
  marquerReponseLue,
  marquerReponsesLues,
  verifierReponsesImap,
} from '../services/reponseService'

export function useResumeReponses() {
  const { estConnecte } = useAuth()

  return useQuery({
    queryKey: ['reponses-resume'],
    queryFn: getResumeReponses,
    enabled: Boolean(estConnecte),
    refetchInterval: 60000,
    refetchIntervalInBackground: false,
    staleTime: 30000,
  })
}

export function useReponsesEntreprise(entrepriseId) {
  return useQuery({
    queryKey: ['reponses', { entreprise_id: entrepriseId }],
    queryFn: () => listerReponses({ entreprise_id: entrepriseId }),
    enabled: Boolean(entrepriseId),
  })
}

export function useMarquerReponseLue(entrepriseId = null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: marquerReponseLue,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reponses-resume'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-actions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      if (entrepriseId || data.entreprise_id) {
        const id = entrepriseId || data.entreprise_id
        queryClient.invalidateQueries({ queryKey: ['reponses', { entreprise_id: id }] })
        queryClient.invalidateQueries({ queryKey: ['entreprise', id] })
      }
    },
  })
}

export function useMarquerToutesReponsesLues(entrepriseId = null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => marquerReponsesLues(entrepriseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reponses-resume'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-actions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      if (entrepriseId) {
        queryClient.invalidateQueries({ queryKey: ['reponses', { entreprise_id: entrepriseId }] })
        queryClient.invalidateQueries({ queryKey: ['entreprise', entrepriseId] })
      }
    },
  })
}

export function useVerifierReponses() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: verifierReponsesImap,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reponses-resume'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-actions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['entreprises'] })
    },
  })
}
