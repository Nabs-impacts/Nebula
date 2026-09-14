import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, MessageCircle } from 'lucide-react'
import StatutBadge from './StatutBadge'
import { TYPE_ENTREPRISE_LABELS, formatDateCourte } from '../../utils/formatters'
import { staggerItem, hoverLift } from '../../lib/motion'

export default function EntrepriseCard({ entreprise }) {
  const navigate = useNavigate()

  return (
    <motion.button
      type="button"
      variants={staggerItem}
      whileHover={hoverLift}
      onClick={() => navigate(`/entreprises/${entreprise.id}`)}
      className="card group flex w-full flex-col gap-3 p-4 text-left transition-colors hover:border-neon/50 hover:shadow-card"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-ink group-hover:text-neon transition-colors">
            {entreprise.nom}
          </h3>
          <p className="mt-0.5 font-mono text-[11px] text-muted">
            {TYPE_ENTREPRISE_LABELS[entreprise.type_entreprise] ?? entreprise.type_entreprise}
          </p>
        </div>
        <StatutBadge statut={entreprise.statut} />
      </div>

      <div className="flex items-center gap-4 text-xs text-muted">
        {entreprise.email && (
          <span className="inline-flex items-center gap-1.5">
            <Mail size={13} /> {entreprise.email}
          </span>
        )}
        {entreprise.whatsapp && (
          <span className="inline-flex items-center gap-1.5">
            <MessageCircle size={13} /> {entreprise.whatsapp}
          </span>
        )}
      </div>

      <div className="mt-1 flex items-center justify-between border-t border-border pt-2 font-mono text-[11px] text-muted/70">
        <span className="truncate">{entreprise.prototype_a_presenter}</span>
        <span>{formatDateCourte(entreprise.date_mise_a_jour)}</span>
      </div>
    </motion.button>
  )
}
