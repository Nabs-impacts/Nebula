import { LogOut } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

export default function Navbar() {
  const { utilisateur, deconnecter } = useAuth()

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-6">
      <div className="font-mono text-xs text-muted">
        <span className="text-neon">●</span> panel de prospection
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right leading-tight">
          <p className="text-sm text-ink">{utilisateur?.nom}</p>
          <p className="font-mono text-[11px] text-muted">{utilisateur?.email}</p>
        </div>
        <button
          type="button"
          onClick={deconnecter}
          className="btn-ghost"
          aria-label="Se déconnecter"
          title="Se déconnecter"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  )
}
