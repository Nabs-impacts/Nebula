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
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-0 backdrop-blur-md sm:items-center sm:p-4"
          onClick={onAnnuler}
          role="presentation"
        >
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className="card w-full max-w-sm rounded-b-none rounded-t-lg p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:rounded-lg sm:p-7"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-titre"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="confirm-modal-titre" className="section-title">
              {titre}
            </h2>
            {message && <p className="mt-2 text-sm text-muted">{message}</p>}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="btn-ghost w-full sm:w-auto"
                onClick={onAnnuler}
                disabled={enCours}
              >
                {texteAnnuler}
              </button>
              <button
                type="button"
                className={`${dangereux ? 'btn-danger' : 'btn-primary'} w-full sm:w-auto`}
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
