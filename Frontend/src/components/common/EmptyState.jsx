import { motion } from 'framer-motion'
import { fadeSlideUp } from '../../lib/motion'

export default function EmptyState({ icone: Icone, titre, description, actionLabel, onAction }) {
  return (
    <motion.div
      variants={fadeSlideUp}
      initial="hidden"
      animate="show"
      className="card flex flex-col items-center gap-3 p-12 text-center"
    >
      {Icone && (
        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-surface-alt text-muted">
          <Icone size={22} />
        </div>
      )}
      <div>
        <p className="text-sm font-medium text-ink">{titre}</p>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actionLabel && onAction && (
        <button type="button" className="btn-primary mt-2" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </motion.div>
  )
}
