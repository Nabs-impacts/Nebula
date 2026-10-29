import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useResumeReponses } from '../../hooks/useReponses'
import { useToast } from './Toast'

export default function ReponsesNotifier() {
  const { data } = useResumeReponses()
  const toast = useToast()
  const queryClient = useQueryClient()
  const initialRef = useRef(true)
  const precedentNonLuesRef = useRef(0)

  useEffect(() => {
    if (!data) return

    if (initialRef.current) {
      initialRef.current = false
      precedentNonLuesRef.current = data.non_lues
      return
    }

    if (data.non_lues > precedentNonLuesRef.current) {
      const difference = data.non_lues - precedentNonLuesRef.current
      const derniere = data.recentes?.[0]
      const nom = derniere?.nom_entreprise || 'un prospect'

      if (difference === 1) {
        toast.info(`Nouvelle réponse de ${nom}`)
      } else {
        toast.info(`${difference} nouvelles réponses reçues (dont ${nom})`)
      }

      // Invalidation immédiate pour mettre à jour les statuts et le dashboard sans recharger la page
      queryClient.invalidateQueries({ queryKey: ['entreprises'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-actions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['reponses'] })
    }

    precedentNonLuesRef.current = data.non_lues
  }, [data, toast, queryClient])

  return null
}
