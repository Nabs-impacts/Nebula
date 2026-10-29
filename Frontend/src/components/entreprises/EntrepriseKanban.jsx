import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Building2, GripVertical } from 'lucide-react'
import StatutBadge from './StatutBadge'
import EmptyState from '../common/EmptyState'
import { KANBAN_COLONNES, PRIORITE_COLORS, PRIORITE_LABELS, STATUT_LABELS } from '../../utils/formatters'
import { staggerContainer, staggerItem } from '../../lib/motion'

function CarteKanban({ entreprise, onChangerStatut, enCours }) {
  const navigate = useNavigate()
  const [survol, setSurvol] = useState(false)
  const priorite = PRIORITE_COLORS[entreprise.priorite] ?? PRIORITE_COLORS.normale

  return (
    <motion.div
      variants={staggerItem}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', entreprise.id)
        e.dataTransfer.effectAllowed = 'move'
      }}
      onMouseEnter={() => setSurvol(true)}
      onMouseLeave={() => setSurvol(false)}
      onClick={() => navigate(`/entreprises/${entreprise.id}`)}
      className={`card group cursor-pointer p-3 transition-colors ${
        survol ? 'border-accent/40 bg-surface-alt' : ''
      } ${enCours ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink group-hover:text-accent">
            {entreprise.nom}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-muted">
            {entreprise.contact_nom || entreprise.ville || entreprise.email || '—'}
          </p>
        </div>
        <GripVertical size={14} className="shrink-0 text-muted/40" />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span
          className="mono-chip inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.08em]"
          style={{ color: priorite.text, borderColor: priorite.ring, backgroundColor: priorite.bg }}
        >
          {PRIORITE_LABELS[entreprise.priorite] ?? entreprise.priorite}
        </span>
        {entreprise.tags?.slice(0, 2).map((tag) => (
          <span
            key={tag}
            className="rounded-sm border border-border px-1.5 py-0.5 font-mono text-[9px] text-muted"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-3" onClick={(e) => e.stopPropagation()}>
        <select
          className="w-full rounded-sm border border-border bg-surface px-2 py-1 text-[11px] text-muted outline-none focus:border-accent/60"
          value={entreprise.statut === 'envoye' ? 'en_attente_reponse' : entreprise.statut}
          onChange={(e) => onChangerStatut(entreprise.id, e.target.value)}
          disabled={enCours}
          aria-label={`Changer le statut de ${entreprise.nom}`}
        >
          {Object.entries(STATUT_LABELS).map(([valeur, label]) => (
            <option key={valeur} value={valeur}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </motion.div>
  )
}

export default function EntrepriseKanban({ entreprises, onChangerStatut, enCours }) {
  const [colonneSurvolee, setColonneSurvolee] = useState(null)

  if (entreprises.length === 0) {
    return <EmptyState icone={Building2} titre="Aucune entreprise dans le pipeline" />
  }

  return (
    <motion.div
      variants={staggerContainer(0, 0.04)}
      initial="hidden"
      animate="show"
      className="flex gap-3 overflow-x-auto pb-3"
    >
      {KANBAN_COLONNES.map((colonne) => {
        const elements = entreprises.filter((entreprise) => colonne.statuts.includes(entreprise.statut))
        const survolee = colonneSurvolee === colonne.statut
        return (
          <div
            key={colonne.statut}
            onDragOver={(e) => {
              e.preventDefault()
              setColonneSurvolee(colonne.statut)
            }}
            onDragLeave={() => setColonneSurvolee(null)}
            onDrop={(e) => {
              e.preventDefault()
              setColonneSurvolee(null)
              const id = e.dataTransfer.getData('text/plain')
              if (id) onChangerStatut(id, colonne.statut)
            }}
            className={`flex w-[260px] shrink-0 flex-col rounded-md border p-2 transition-colors ${
              survolee ? 'border-accent/50 bg-accent/[0.04]' : 'border-border bg-surface/50'
            }`}
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                {colonne.label}
              </span>
              <span className="font-mono text-[10px] text-muted/60">{elements.length}</span>
            </div>
            <div className="flex min-h-[80px] flex-col gap-2">
              {elements.map((entreprise) => (
                <CarteKanban
                  key={entreprise.id}
                  entreprise={entreprise}
                  onChangerStatut={onChangerStatut}
                  enCours={enCours}
                />
              ))}
              {elements.length === 0 && (
                <p className="rounded-sm border border-dashed border-border/70 px-2 py-4 text-center text-[10px] text-muted/50">
                  Déposer ici
                </p>
              )}
            </div>
          </div>
        )
      })}
    </motion.div>
  )
}
