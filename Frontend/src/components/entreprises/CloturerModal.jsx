import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, XCircle, X } from 'lucide-react'
import { backdropVariants, modalVariants } from '../../lib/motion'

export default function CloturerModal({
  ouvert,
  nomEntreprise,
  enCours = false,
  onCloturer,
  onFermer,
}) {
  return (
    <AnimatePresence>
      {ouvert && (
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="show"
          exit="exit"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-md p-4"
          onClick={onFermer}
          role="presentation"
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className="card w-full max-w-md p-6 sm:p-7"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cloturer-modal-titre"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="eyebrow mb-1">Fin de prospection</p>
                <h2 id="cloturer-modal-titre" className="section-title text-lg">
                  Clôturer la conversation
                </h2>
              </div>
              <button
                type="button"
                onClick={onFermer}
                disabled={enCours}
                className="btn-ghost -mr-2 -mt-2 p-1.5 text-muted hover:text-ink"
                aria-label="Fermer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="mt-2 text-sm text-muted">
              Sélectionnez l'issue de la conversation avec <strong className="text-ink">{nomEntreprise}</strong>.
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => onCloturer('converti')}
                disabled={enCours}
                className="group flex items-start gap-3.5 rounded-sm border border-emerald-500/30 bg-emerald-500/[0.06] p-3.5 text-left transition-colors hover:border-emerald-500/60 hover:bg-emerald-500/[0.12]"
              >
                <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-400" />
                <div>
                  <p className="text-sm font-medium text-ink group-hover:text-emerald-300">
                    Converti (Client signé)
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    L'entreprise a accepté l'offre ou commandé une prestation.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onCloturer('perdu')}
                disabled={enCours}
                className="group flex items-start gap-3.5 rounded-sm border border-rose-500/30 bg-rose-500/[0.06] p-3.5 text-left transition-colors hover:border-rose-500/60 hover:bg-rose-500/[0.12]"
              >
                <XCircle size={20} className="mt-0.5 shrink-0 text-rose-400" />
                <div>
                  <p className="text-sm font-medium text-ink group-hover:text-rose-300">
                    Perdu (Sans suite / Refus)
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    L'entreprise a décliné ou n'est plus intéressée.
                  </p>
                </div>
              </button>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                className="btn-ghost text-xs"
                onClick={onFermer}
                disabled={enCours}
              >
                Annuler
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
