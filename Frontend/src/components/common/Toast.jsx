import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, XCircle, X, Info } from 'lucide-react'
import { DURATION, EASE_SPRING } from '../../lib/motion'

const ToastContext = createContext(null)

const ICONES = {
  succes: CheckCircle2,
  erreur: XCircle,
  info: Info,
}

const STYLES = {
  succes: { color: '#8fbf9f', border: 'rgba(143,191,159,0.35)' },
  erreur: { color: '#d9695b', border: 'rgba(217,105,91,0.35)' },
  info: { color: '#9db4c0', border: 'rgba(157,180,192,0.35)' },
}

let idIncrement = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const retirerToast = useCallback((id) => {
    setToasts((liste) => liste.filter((t) => t.id !== id))
  }, [])

  const notifier = useCallback(
    (message, { type = 'info', duree = 4000 } = {}) => {
      const id = ++idIncrement
      setToasts((liste) => [...liste, { id, message, type }])
      if (duree) {
        setTimeout(() => retirerToast(id), duree)
      }
      return id
    },
    [retirerToast],
  )

  const valeur = useMemo(
    () => ({
      notifier,
      succes: (message, options) => notifier(message, { ...options, type: 'succes' }),
      erreur: (message, options) => notifier(message, { ...options, type: 'erreur' }),
      info: (message, options) => notifier(message, { ...options, type: 'info' }),
    }),
    [notifier],
  )

  return (
    <ToastContext.Provider value={valeur}>
      {children}

      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2"
        role="region"
        aria-label="Notifications"
      >
        <AnimatePresence>
          {toasts.map((toast) => {
            const Icone = ICONES[toast.type] ?? Info
            const style = STYLES[toast.type] ?? STYLES.info
            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 24, transition: { duration: DURATION.fast } }}
                transition={{ duration: DURATION.normal, ease: EASE_SPRING }}
                role={toast.type === 'erreur' ? 'alert' : 'status'}
                className="card pointer-events-auto flex items-start gap-3 p-3.5"
                style={{ borderColor: style.border }}
              >
                <Icone size={18} style={{ color: style.color }} className="mt-0.5 shrink-0" />
                <p className="flex-1 text-sm text-ink">{toast.message}</p>
                <button
                  type="button"
                  onClick={() => retirerToast(toast.id)}
                  className="shrink-0 text-muted transition-colors hover:text-ink"
                  aria-label="Fermer la notification"
                >
                  <X size={14} />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast doit être utilisé à l’intérieur de <ToastProvider>')
  }
  return ctx
}
