import { AnimatePresence, motion } from 'framer-motion'
import { backdropVariants, modalVariants } from '../../lib/motion'

export default function ConfirmModal({
  ouvert,
  titre = 'Confirmer l’action',
  message,
  texteConfirmer = 'Confirmer',
  texteAnnuler = 'Annuler',
  dangereux = false,
  enCours = false,
  onConfirmer,
  onAnnuler,
}) {
  return (
    <AnimatePresence>
      {ouvert && (
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="show"
          exit="exit"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={onAnnuler}
          role="presentation"
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className="card w-full max-w-sm p-6"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-titre"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="confirm-modal-titre" className="text-base font-medium text-ink">
              {titre}
            </h2>
            {message && <p className="mt-2 text-sm text-muted">{message}</p>}

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={onAnnuler} disabled={enCours}>
                {texteAnnuler}
              </button>
              <button
                type="button"
                className={dangereux ? 'btn-danger' : 'btn-primary'}
                onClick={onConfirmer}
                disabled={enCours}
              >
                {enCours ? 'Patientez…' : texteConfirmer}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
