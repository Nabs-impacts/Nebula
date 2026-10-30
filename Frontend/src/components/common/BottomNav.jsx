import { NavLink } from 'react-router-dom'
import { Building2, LayoutDashboard } from 'lucide-react'
import { useResumeReponses } from '../../hooks/useReponses'

const LIENS = [
  { to: '/entreprises', label: 'Entreprises', icone: Building2 },
  { to: '/dashboard', label: 'Dashboard', icone: LayoutDashboard },
]

export default function BottomNav() {
  const { data: resume } = useResumeReponses()
  const nonLues = resume?.non_lues || 0

  return (
    <nav
      className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg/90 backdrop-blur-xl lg:hidden"
      aria-label="Navigation principale"
    >
      <div className="mx-auto flex h-16 max-w-md items-stretch justify-around px-2">
        {LIENS.map(({ to, label, icone: Icone }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `relative flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-1 rounded-sm px-2 text-xs transition-colors ${
                isActive ? 'text-accent' : 'text-muted hover:text-ink'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`absolute top-0 h-0.5 w-8 rounded-full transition-colors ${
                    isActive ? 'bg-accent' : 'bg-transparent'
                  }`}
                />
                <span className="relative">
                  <Icone size={20} strokeWidth={isActive ? 2 : 1.75} />
                  {to === '/dashboard' && nonLues > 0 && (
                    <span className="absolute -right-2.5 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 font-mono text-xs font-bold text-bg">
                      {nonLues}
                    </span>
                  )}
                </span>
                <span className="leading-none tracking-tight">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
