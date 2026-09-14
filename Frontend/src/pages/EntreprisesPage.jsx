import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import EntrepriseList from '../components/entreprises/EntrepriseList'
import EntrepriseForm from '../components/entreprises/EntrepriseForm'
import { useCreerEntreprise, useListeEntreprises } from '../hooks/useEntreprises'
import { useToast } from '../components/common/Toast'
import { backdropVariants, modalVariants } from '../lib/motion'

export default function EntreprisesPage() {
  const [filtreStatut, setFiltreStatut] = useState('')
  const [filtreType, setFiltreType] = useState('')
  const [modaleOuverte, setModaleOuverte] = useState(false)
  const toast = useToast()

  const { data, isLoading, isError } = useListeEntreprises({
    statut: filtreStatut || undefined,
    type_entreprise: filtreType || undefined,
  })

  const creerEntreprise = useCreerEntreprise()

  async function gererCreation(valeurs) {
    try {
      await creerEntreprise.mutateAsync(valeurs)
      setModaleOuverte(false)
      toast.succes(`« ${valeurs.nom} » a été ajoutée au pipeline.`)
    } catch {
      // l'erreur reste affichée dans le formulaire via erreurApi
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-ink">Entreprises</h1>
          <p className="text-sm text-muted">Pipeline de prospection Tenora.</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setModaleOuverte(true)}>
          <Plus size={16} /> Ajouter une entreprise
        </button>
      </div>

      <EntrepriseList
        entreprises={data ?? []}
        chargement={isLoading}
        erreur={isError}
        filtreStatut={filtreStatut}
        filtreType={filtreType}
        onChangerFiltreStatut={setFiltreStatut}
        onChangerFiltreType={setFiltreType}
        onAjouter={() => setModaleOuverte(true)}
      />

      <AnimatePresence>
        {modaleOuverte && (
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setModaleOuverte(false)}
            role="presentation"
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              className="card w-full max-w-lg max-h-[90vh] overflow-y-auto p-6"
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="mb-4 text-base font-medium text-ink">Nouvelle entreprise</h2>
              <EntrepriseForm
                enCours={creerEntreprise.isPending}
                erreurApi={
                  creerEntreprise.isError
                    ? 'Impossible de créer l’entreprise. Vérifiez les champs et réessayez.'
                    : null
                }
                texteBouton="Créer"
                onSubmit={gererCreation}
                onAnnuler={() => setModaleOuverte(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
