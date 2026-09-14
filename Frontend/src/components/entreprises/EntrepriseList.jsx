import { motion } from 'framer-motion'
import { Building2 } from 'lucide-react'
import EntrepriseCard from './EntrepriseCard'
import EmptyState from '../common/EmptyState'
import { SkeletonCardGrid } from '../common/Skeleton'
import { STATUT_LABELS, TYPE_ENTREPRISE_LABELS } from '../../utils/formatters'
import { staggerContainer } from '../../lib/motion'

export default function EntrepriseList({
  entreprises,
  chargement,
  erreur,
  filtreStatut,
  filtreType,
  onChangerFiltreStatut,
  onChangerFiltreType,
  onAjouter,
}) {
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <select
          className="input w-auto"
          value={filtreStatut}
          onChange={(e) => onChangerFiltreStatut(e.target.value)}
        >
          <option value="">Tous les statuts</option>
          {Object.entries(STATUT_LABELS).map(([valeur, label]) => (
            <option key={valeur} value={valeur}>
              {label}
            </option>
          ))}
        </select>

        <select
          className="input w-auto"
          value={filtreType}
          onChange={(e) => onChangerFiltreType(e.target.value)}
        >
          <option value="">Tous les types</option>
          {Object.entries(TYPE_ENTREPRISE_LABELS).map(([valeur, label]) => (
            <option key={valeur} value={valeur}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {chargement && <SkeletonCardGrid count={6} />}

      {erreur && !chargement && (
        <p className="card border-danger/40 p-4 text-sm text-danger">
          Impossible de charger les entreprises. Réessayez.
        </p>
      )}

      {!chargement && !erreur && entreprises.length === 0 && (
        <EmptyState
          icone={Building2}
          titre="Aucune entreprise trouvée"
          description="Ajustez les filtres ou ajoutez une nouvelle entreprise au pipeline."
          actionLabel={onAjouter ? 'Ajouter une entreprise' : undefined}
          onAction={onAjouter}
        />
      )}

      {!chargement && !erreur && entreprises.length > 0 && (
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
      )}
    </div>
  )
}
