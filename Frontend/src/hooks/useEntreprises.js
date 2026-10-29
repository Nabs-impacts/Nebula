import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  creerEntreprise,
  exporterEntreprisesCsv,
  getActionsDashboard,
  getEntreprise,
  getStatsDashboard,
  importerEntreprisesCsv,
  listerEntreprises,
  modifierEntreprise,
  supprimerEntreprise,
} from '../services/entrepriseService'

export function useListeEntreprises({
  statut,
  type_entreprise,
  q,
  ville,
  priorite,
  tag,
  limit = 50,
} = {}) {
  return useQuery({
    queryKey: ['entreprises', { statut, type_entreprise, q, ville, priorite, tag, limit }],
    queryFn: () => listerEntreprises({ statut, type_entreprise, q, ville, priorite, tag, limit }),
    placeholderData: (precedent) => precedent,
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

export function useChangerStatutEntreprise() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, statut }) => modifierEntreprise(id, { statut }),
    onSuccess: (data) => {
      queryClient.setQueryData(['entreprise', data.id], data)
      queryClient.invalidateQueries({ queryKey: ['entreprises'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-actions'] })
    },
  })
}

export function useImporterEntreprises() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: importerEntreprisesCsv,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entreprises'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

export function useExporterEntreprises() {
  return useMutation({ mutationFn: exporterEntreprisesCsv })
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

export function useActionsDashboard() {
  return useQuery({
    queryKey: ['dashboard-actions'],
    queryFn: getActionsDashboard,
  })
}
