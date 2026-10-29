import { useState } from 'react'
import { motion } from 'framer-motion'
import { Pencil, Send } from 'lucide-react'
import { CANAL_LABELS, STATUT_ENVOI_LABELS, formatDate } from '../../utils/formatters'
import { fadeSlideUp } from '../../lib/motion'
import { useApercuEmail } from '../../hooks/useMessages'

const COULEUR_STATUT_ENVOI = {
  en_attente: '#e0a458',
  envoye: '#8fbf9f',
  echec: '#d9695b',
}

export default function MessagePreview({ message, onModifier, onEnvoyer, envoiEnCours }) {
  const contenu = message.contenu_final ?? message.contenu_genere
  const couleur = COULEUR_STATUT_ENVOI[message.statut_envoi] ?? '#a89b8c'
  const enAttente = message.statut_envoi === 'en_attente'
  const estEmail = message.canal === 'email'
  const [mode, setMode] = useState('texte')
  const { data: apercu, isLoading: apercuEnChargement } = useApercuEmail(message.id, {
    enabled: estEmail && mode === 'email',
  })

  return (
    <motion.div
      variants={fadeSlideUp}
      initial="hidden"
      animate="show"
      className="card overflow-hidden"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 bg-surface-alt/30 px-5 py-3">
        <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
          <span className="rounded-sm border border-border px-2 py-0.5">
            {CANAL_LABELS[message.canal] ?? message.canal}
          </span>
          {message.est_relance && (
            <span className="rounded-sm border border-coral/40 px-2 py-0.5 text-coral">
              relance
            </span>
          )}
          <span className="inline-flex items-center gap-1.5" style={{ color: couleur }}>
            <span
              className={`h-1.5 w-1.5 rounded-full ${enAttente ? 'badge-pulse-dot' : ''}`}
              style={{ backgroundColor: couleur }}
            />
            {STATUT_ENVOI_LABELS[message.statut_envoi] ?? message.statut_envoi}
          </span>
        </div>
        <span className="font-mono text-[10px] text-muted/60">
          généré le {formatDate(message.date_generation)}
        </span>
      </div>

      <div className="p-5 sm:p-6">
        {estEmail && (
          <div className="mb-4 inline-flex rounded-sm border border-border p-0.5">
            {[
              ['texte', 'Texte'],
              ['email', 'Email'],
            ].map(([valeur, libelle]) => (
              <button
                key={valeur}
                type="button"
                onClick={() => setMode(valeur)}
                className={`rounded-sm px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors ${
                  mode === valeur ? 'bg-accent/15 text-accent' : 'text-muted hover:text-ink'
                }`}
              >
                {libelle}
              </button>
            ))}
          </div>
        )}

        {estEmail && mode === 'email' ? (
          apercuEnChargement ? (
            <p className="py-10 text-center font-mono text-xs uppercase tracking-[0.14em] text-muted">
              Rendu de l'email…
            </p>
          ) : (
            <iframe
              title="Aperçu de l'email"
              srcDoc={apercu?.html}
              sandbox=""
              className="h-[760px] w-full rounded-sm border border-border bg-white"
            />
          )
        ) : (
          <>
            {message.sujet && (
              <div className="mb-4 border-b border-border/60 pb-3">
                <p className="label mb-1">Objet</p>
                <p className="font-display text-lg leading-snug text-ink">{message.sujet}</p>
              </div>
            )}
            <p className="whitespace-pre-wrap text-[15px] leading-[1.75] text-ink/90">{contenu}</p>
          </>
        )}

        {message.angle && (
          <p className="mt-4 rounded-sm border border-accent/25 bg-accent/[0.04] px-3 py-2 text-xs leading-relaxed text-muted">
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-accent">
              Angle utilisé ·{' '}
            </span>
            {message.angle}
          </p>
        )}

        {message.contenu_final && (
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-muted/60">
            version corrigée manuellement
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
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
      </div>
    </motion.div>
  )
}
