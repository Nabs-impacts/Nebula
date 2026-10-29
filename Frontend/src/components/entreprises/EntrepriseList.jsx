import { motion } from 'framer-motion'
import { Building2 } from 'lucide-react'
import EntrepriseCard from './EntrepriseCard'
import EmptyState from '../common/EmptyState'
import { SkeletonCardGrid } from '../common/Skeleton'
import { staggerContainer } from '../../lib/motion'

export default function EntrepriseList({ entreprises, chargement, erreur, onAjouter }) {
  if (chargement) return <SkeletonCardGrid count={6} />

  if (erreur) {
    return (
      <p className="card border-danger/40 p-4 text-sm text-danger">
        Impossible de charger les entreprises. Réessayez.
      </p>
    )
  }

  if (entreprises.length === 0) {
    return (
      <EmptyState
        icone={Building2}
        titre="Aucune entreprise trouvée"
        description="Ajustez les filtres ou ajoutez une nouvelle entreprise au pipeline."
        actionLabel={onAjouter ? 'Ajouter une entreprise' : undefined}
        onAction={onAjouter}
      />
    )
  }

  return (
    <motion.div
      variants={staggerContainer(0, 0.04)}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
    >
      {entreprises.map((entreprise) => (
        <EntrepriseCard key={entreprise.id} entreprise={entreprise} />
      ))}
    </motion.div>
  )
}
