import { motion } from 'framer-motion'
import { Pencil, Send } from 'lucide-react'
import { CANAL_LABELS, STATUT_ENVOI_LABELS, formatDate } from '../../utils/formatters'
import { fadeSlideUp } from '../../lib/motion'

const COULEUR_STATUT_ENVOI = {
  en_attente: '#ffb454',
  envoye: '#39ff88',
  echec: '#ff5470',
}

export default function MessagePreview({ message, onModifier, onEnvoyer, envoiEnCours }) {
  const contenu = message.contenu_final ?? message.contenu_genere
  const couleur = COULEUR_STATUT_ENVOI[message.statut_envoi] ?? '#7c928e'
  const enAttente = message.statut_envoi === 'en_attente'

  return (
    <motion.div variants={fadeSlideUp} initial="hidden" animate="show" className="card p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-mono text-xs text-muted">
          <span className="rounded-sm border border-border px-2 py-0.5">
            {CANAL_LABELS[message.canal] ?? message.canal}
          </span>
          {message.est_relance && (
            <span className="rounded-sm border border-violet/40 px-2 py-0.5 text-violet">relance</span>
          )}
          <span className="inline-flex items-center gap-1.5" style={{ color: couleur }}>
            <span
              className={`h-1.5 w-1.5 rounded-full ${enAttente ? 'badge-pulse-dot' : ''}`}
              style={{ backgroundColor: couleur }}
            />
            {STATUT_ENVOI_LABELS[message.statut_envoi] ?? message.statut_envoi}
          </span>
        </div>
        <span className="font-mono text-[11px] text-muted/70">
          généré le {formatDate(message.date_generation)}
        </span>
      </div>

      <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{contenu}</p>

      {message.contenu_final && (
        <p className="mt-2 font-mono text-[11px] text-muted/70">version corrigée manuellement</p>
      )}

      <div className="mt-4 flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={onModifier}>
          <Pencil size={14} /> Modifier
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={onEnvoyer}
          disabled={envoiEnCours || message.statut_envoi === 'envoye'}
        >
          <Send size={14} />
          {message.statut_envoi === 'envoye'
            ? 'Déjà envoyé'
            : envoiEnCours
              ? 'Envoi…'
              : 'Envoyer'}
        </button>
      </div>
    </motion.div>
  )
}
