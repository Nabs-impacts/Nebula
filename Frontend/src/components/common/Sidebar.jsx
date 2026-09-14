import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Building2, LayoutDashboard, Settings, Radio } from 'lucide-react'
import { DURATION } from '../../lib/motion'

const LIENS = [
  { to: '/entreprises', label: 'Entreprises', icone: Building2 },
  { to: '/dashboard', label: 'Dashboard', icone: LayoutDashboard },
  { to: '/parametres', label: 'Paramètres', icone: Settings },
]

export default function Sidebar() {
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex h-14 items-center gap-2 border-b border-border px-5">
        <Radio size={18} className="text-neon" />
        <span className="font-mono text-sm tracking-tight text-ink">nebula</span>
      </div>

      <nav className="flex flex-col gap-1 p-3">
        {LIENS.map(({ to, label, icone: Icone }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `relative flex items-center gap-2.5 rounded-sm px-3 py-2 text-sm transition-colors ${
                isActive ? 'text-neon' : 'text-muted hover:text-ink hover:bg-surface-alt'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active-bg"
                    className="absolute inset-0 rounded-sm border-l-2 border-neon bg-surface-alt"
                    transition={{ duration: DURATION.normal, ease: 'easeOut' }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2.5">
                  <Icone size={16} />
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto p-4 font-mono text-[11px] text-muted/70">
        tenora · v1.0
      </div>
    </aside>
  )
}
