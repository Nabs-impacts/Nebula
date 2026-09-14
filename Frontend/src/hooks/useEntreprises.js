import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  creerEntreprise,
  getEntreprise,
  getStatsDashboard,
  listerEntreprises,
  modifierEntreprise,
  supprimerEntreprise,
} from '../services/entrepriseService'

export function useListeEntreprises({ statut, type_entreprise } = {}) {
  return useQuery({
    queryKey: ['entreprises', { statut, type_entreprise }],
    queryFn: () => listerEntreprises({ statut, type_entreprise }),
  })
}

export function useEntreprise(id) {
  return useQuery({
    queryKey: ['entreprise', id],
    queryFn: () => getEntreprise(id),
    enabled: Boolean(id),
  })
}

export function useCreerEntreprise() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: creerEntreprise,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entreprises'] })
    },
  })
}

export function useModifierEntreprise(id) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => modifierEntreprise(id, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(['entreprise', id], data)
      queryClient.invalidateQueries({ queryKey: ['entreprises'] })
    },
  })
}

export function useSupprimerEntreprise() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: supprimerEntreprise,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entreprises'] })
    },
  })
}

export function useStatsDashboard() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getStatsDashboard,
  })
}
