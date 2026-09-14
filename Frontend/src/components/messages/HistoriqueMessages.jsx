import { motion } from 'framer-motion'
import { History } from 'lucide-react'
import { CANAL_LABELS, STATUT_ENVOI_LABELS, formatDate, tronquerTexte } from '../../utils/formatters'
import EmptyState from '../common/EmptyState'
import { staggerContainer, staggerItem } from '../../lib/motion'

const COULEUR_STATUT_ENVOI = {
  en_attente: '#ffb454',
  envoye: '#39ff88',
  echec: '#ff5470',
}

export default function HistoriqueMessages({ messages }) {
  if (!messages || messages.length === 0) {
    return (
      <div>
        <h2 className="mb-3 text-sm font-medium text-ink">Historique</h2>
        <EmptyState icone={History} titre="Aucun message pour le moment" />
      </div>
    )
  }

  return (
    <div>
      <h2 className="mb-3 text-sm font-medium text-ink">Historique ({messages.length})</h2>
      {/* Reveal progressif ligne par ligne plutôt qu'un rendu instantané. */}
      <motion.ul
        variants={staggerContainer(0, 0.05)}
        initial="hidden"
        animate="show"
        className="card divide-y divide-border"
      >
        {messages.map((message) => {
          const enAttente = message.statut_envoi === 'en_attente'
          const couleur = COULEUR_STATUT_ENVOI[message.statut_envoi] ?? '#7c928e'
          return (
            <motion.li
              key={message.id}
              variants={staggerItem}
              className="flex items-start justify-between gap-4 p-4"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-muted">
                  <span className="rounded-sm border border-border px-1.5 py-0.5">
                    {CANAL_LABELS[message.canal] ?? message.canal}
                  </span>
                  {message.est_relance && <span className="text-violet">relance</span>}
                  <span className="inline-flex items-center gap-1.5" style={{ color: couleur }}>
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${enAttente ? 'badge-pulse-dot' : ''}`}
                      style={{ backgroundColor: couleur }}
                    />
                    {STATUT_ENVOI_LABELS[message.statut_envoi] ?? message.statut_envoi}
                  </span>
                </div>
                <p className="mt-1 truncate text-sm text-ink">
                  {tronquerTexte(message.contenu_final ?? message.contenu_genere, 110)}
                </p>
              </div>
              <span className="shrink-0 font-mono text-[11px] text-muted/70">
                {formatDate(message.date_envoi ?? message.date_generation)}
              </span>
            </motion.li>
          )
        })}
      </motion.ul>
    </div>
  )
}
