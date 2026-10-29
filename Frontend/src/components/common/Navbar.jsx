import { LogOut, Menu } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

function initiales(nom) {
  if (!nom) return '·'
  return nom
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((mot) => mot[0])
    .join('')
    .toUpperCase()
}

export default function Navbar({ onOuvrirMenu }) {
  const { utilisateur, deconnecter } = useAuth()

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border bg-bg/70 px-5 backdrop-blur-xl sm:px-8 lg:px-10">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOuvrirMenu}
          className="btn-ghost -ml-2 px-2 py-2 lg:hidden"
          aria-label="Ouvrir le menu"
        >
          <Menu size={19} />
        </button>
        <div className="flex items-center gap-2.5">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
            Panel de prospection
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right leading-tight sm:block">
          <p className="text-sm text-ink">{utilisateur?.nom}</p>
          <p className="font-mono text-[10px] text-muted">{utilisateur?.email}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface-alt font-mono text-[11px] text-accent">
          {initiales(utilisateur?.nom)}
        </div>
        <button
          type="button"
          onClick={deconnecter}
          className="btn-ghost px-2 py-2"
          aria-label="Se déconnecter"
          title="Se déconnecter"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  )
}
