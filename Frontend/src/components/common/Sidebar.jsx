import { NavLink } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Building2, LayoutDashboard, Settings, X } from 'lucide-react'
import { useResumeReponses } from '../../hooks/useReponses'
import { DURATION } from '../../lib/motion'

const LIENS = [
  { to: '/entreprises', label: 'Entreprises', icone: Building2 },
  { to: '/dashboard', label: 'Dashboard', icone: LayoutDashboard },
  { to: '/parametres', label: 'Paramètres', icone: Settings },
]

function ContenuSidebar({ onFermer }) {
  const { data: resume } = useResumeReponses()
  const nonLues = resume?.non_lues || 0

  return (
    <>
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        <NavLink to="/entreprises" className="flex items-center gap-3" onClick={onFermer}>
          <span className="flex h-9 w-9 items-center justify-center rounded-sm border border-accent/40 bg-accent/10 font-display text-base text-accent">
            N
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-xl tracking-tight text-ink">Nebula</span>
            <span className="mt-1 font-mono text-[9px] uppercase tracking-[0.22em] text-muted">
              Prospection
            </span>
          </span>
        </NavLink>

        <button
          type="button"
          onClick={onFermer}
          className="btn-ghost -mr-2 px-2 py-2 lg:hidden"
          aria-label="Fermer le menu"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-6">
        <div>
          <p className="px-3 pb-2 font-mono text-[9px] uppercase tracking-[0.24em] text-muted/70">
            Espace de travail
          </p>
          <nav className="flex flex-col gap-1">
            {LIENS.map(({ to, label, icone: Icone }) => (
              <NavLink
                key={to}
                to={to}
                onClick={onFermer}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition-colors ${
                    isActive
                      ? 'bg-accent/[0.07] text-accent'
                      : 'text-muted hover:bg-surface-alt/60 hover:text-ink'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`absolute left-0 top-1/2 h-5 w-px -translate-y-1/2 rounded-full transition-colors ${
                        isActive ? 'bg-accent' : 'bg-transparent'
                      }`}
                    />
                    <Icone size={16} strokeWidth={1.75} />
                    <span className="flex-1 tracking-tight">{label}</span>
                    {to === '/dashboard' && nonLues > 0 && (
                      <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 font-mono text-[9px] font-bold text-bg">
                        {nonLues}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="mt-auto rounded-md border border-border/70 bg-surface-alt/40 p-3.5">
          <p className="font-display text-sm text-ink">Tenora</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Prospection commerciale assistée par IA.
          </p>
          <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.2em] text-muted/60">
            v1.0 · interne
          </p>
        </div>
      </div>
    </>
  )
}

export default function Sidebar({ ouvert = false, onFermer }) {
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-surface/80 backdrop-blur-xl lg:flex">
        <ContenuSidebar onFermer={() => {}} />
      </aside>

      <AnimatePresence>
        {ouvert && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DURATION.fast }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={onFermer}
              role="presentation"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: DURATION.normal, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-border bg-surface shadow-card"
            >
              <ContenuSidebar onFermer={onFermer} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
