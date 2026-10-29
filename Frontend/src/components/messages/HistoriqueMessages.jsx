import { motion } from 'framer-motion'
import { History } from 'lucide-react'
import { CANAL_LABELS, STATUT_ENVOI_LABELS, formatDate, tronquerTexte } from '../../utils/formatters'
import EmptyState from '../common/EmptyState'
import { staggerContainer, staggerItem } from '../../lib/motion'

const COULEUR_STATUT_ENVOI = {
  en_attente: '#e0a458',
  envoye: '#8fbf9f',
  echec: '#d9695b',
}

export default function HistoriqueMessages({ messages }) {
  if (!messages || messages.length === 0) {
    return (
      <div>
        <h2 className="section-title mb-3">Historique</h2>
        <EmptyState icone={History} titre="Aucun message pour le moment" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="section-title">Historique</h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted/70">
          {messages.length} message{messages.length > 1 ? 's' : ''}
        </span>
      </div>
      {/* Reveal progressif ligne par ligne plutôt qu'un rendu instantané. */}
      <motion.ul
        variants={staggerContainer(0, 0.05)}
        initial="hidden"
        animate="show"
        className="card divide-y divide-border/70 overflow-hidden"
      >
        {messages.map((message) => {
          const enAttente = message.statut_envoi === 'en_attente'
          const couleur = COULEUR_STATUT_ENVOI[message.statut_envoi] ?? '#a89b8c'
          return (
            <motion.li
              key={message.id}
              variants={staggerItem}
              className="flex items-start justify-between gap-4 px-5 py-4 transition-colors hover:bg-surface-alt/30"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                  <span className="rounded-sm border border-border px-1.5 py-0.5">
                    {CANAL_LABELS[message.canal] ?? message.canal}
                  </span>
                  {message.est_relance && <span className="text-coral">relance</span>}
                  <span className="inline-flex items-center gap-1.5" style={{ color: couleur }}>
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${enAttente ? 'badge-pulse-dot' : ''}`}
                      style={{ backgroundColor: couleur }}
                    />
                    {STATUT_ENVOI_LABELS[message.statut_envoi] ?? message.statut_envoi}
                  </span>
                </div>
                {message.sujet && (
                  <p className="mt-1.5 truncate text-sm text-ink/90">{message.sujet}</p>
                )}
                <p className={`${message.sujet ? 'mt-0.5' : 'mt-1.5'} truncate text-sm text-ink/70`}>
                  {tronquerTexte(message.contenu_final ?? message.contenu_genere, 110)}
                </p>
              </div>
              <span className="shrink-0 font-mono text-[10px] text-muted/60">
                {formatDate(message.date_envoi ?? message.date_generation)}
              </span>
            </motion.li>
          )
        })}
      </motion.ul>
    </div>
  )
}
