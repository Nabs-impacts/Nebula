import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight, Mail, MessageCircle } from 'lucide-react'
import StatutBadge from './StatutBadge'
import {
  PRIORITE_COLORS,
  PRIORITE_LABELS,
  TYPE_ENTREPRISE_LABELS,
  formatDateCourte,
} from '../../utils/formatters'
import { staggerItem, hoverLift } from '../../lib/motion'

export default function EntrepriseCard({ entreprise }) {
  const navigate = useNavigate()
  const priorite = PRIORITE_COLORS[entreprise.priorite] ?? PRIORITE_COLORS.normale

  return (
    <motion.button
      type="button"
      variants={staggerItem}
      whileHover={hoverLift}
      onClick={() => navigate(`/entreprises/${entreprise.id}`)}
      className="card card-hover group flex w-full flex-col gap-4 p-5 text-left"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
            {TYPE_ENTREPRISE_LABELS[entreprise.type_entreprise] ?? entreprise.type_entreprise}
          </p>
          <h3 className="mt-1.5 truncate font-display text-xl leading-snug tracking-tight text-ink transition-colors group-hover:text-accent">
            {entreprise.nom}
          </h3>
          {entreprise.contact_nom && (
            <p className="mt-0.5 truncate text-xs text-muted">{entreprise.contact_nom}</p>
          )}
        </div>
        <StatutBadge statut={entreprise.statut} />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className="mono-chip inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.08em]"
          style={{ color: priorite.text, borderColor: priorite.ring, backgroundColor: priorite.bg }}
        >
          {PRIORITE_LABELS[entreprise.priorite] ?? entreprise.priorite}
        </span>
        {entreprise.ville && (
          <span className="rounded-sm border border-border px-1.5 py-0.5 font-mono text-[9px] text-muted">
            {entreprise.ville}
          </span>
        )}
        {entreprise.tags?.slice(0, 2).map((tag) => (
          <span
            key={tag}
            className="rounded-sm border border-border px-1.5 py-0.5 font-mono text-[9px] text-muted"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="flex flex-col gap-1.5 text-xs text-muted">
        {entreprise.email && (
          <span className="inline-flex items-center gap-2 truncate">
            <Mail size={12} strokeWidth={1.75} className="shrink-0 text-muted/70" />
            <span className="truncate">{entreprise.email}</span>
          </span>
        )}
        {entreprise.whatsapp && (
          <span className="inline-flex items-center gap-2">
            <MessageCircle size={12} strokeWidth={1.75} className="shrink-0 text-muted/70" />
            {entreprise.whatsapp}
          </span>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/70 pt-3">
        <span className="truncate font-mono text-[10px] text-muted/70">
          {entreprise.prototype_a_presenter}
        </span>
        <span className="flex shrink-0 items-center gap-2 font-mono text-[10px] text-muted/60">
          {formatDateCourte(entreprise.date_mise_a_jour)}
          <ArrowUpRight
            size={13}
            className="text-muted/50 transition-colors group-hover:text-accent"
          />
        </span>
      </div>
    </motion.button>
  )
}
