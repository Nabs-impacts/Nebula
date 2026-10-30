import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Inbox, LogOut, MoreVertical, Settings } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useResumeReponses } from '../../hooks/useReponses'

const TITRES = {
  '/dashboard': 'Dashboard',
  '/entreprises': 'Entreprises',
  '/parametres': 'Paramètres',
}

function titrePage(pathname) {
  if (pathname.startsWith('/entreprises/')) return 'Entreprise'
  return TITRES[pathname] || 'Nebula'
}

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

export default function Navbar() {
  const { utilisateur, deconnecter } = useAuth()
  const { data: resume } = useResumeReponses()
  const { pathname } = useLocation()
  const nonLues = resume?.non_lues || 0
  const [menuOuvert, setMenuOuvert] = useState(false)
  const menuZoneRef = useRef(null)

  useEffect(() => {
    setMenuOuvert(false)
  }, [pathname])

  useEffect(() => {
    if (!menuOuvert) return

    function fermerAuClic(e) {
      if (!menuZoneRef.current?.contains(e.target)) setMenuOuvert(false)
    }
    function fermerAvecEchap(e) {
      if (e.key === 'Escape') setMenuOuvert(false)
    }

    document.addEventListener('mousedown', fermerAuClic)
    document.addEventListener('keydown', fermerAvecEchap)
    return () => {
      document.removeEventListener('mousedown', fermerAuClic)
      document.removeEventListener('keydown', fermerAvecEchap)
    }
  }, [menuOuvert])

  return (
    <header className="safe-top sticky top-0 z-30 shrink-0 border-b border-border bg-bg/70 backdrop-blur-xl">
      <div className="flex min-h-16 items-center justify-between gap-3 px-4 sm:px-8 lg:px-10">
        <div className="flex min-w-0 items-center gap-2.5">
          <Link
            to="/entreprises"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm lg:hidden"
            aria-label="Accueil Nebula"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-sm border border-accent/40 bg-accent/10 font-display text-sm text-accent">
              N
            </span>
          </Link>
          <h1 className="truncate font-display text-lg tracking-tight text-ink lg:hidden">
            {titrePage(pathname)}
          </h1>
          <div className="hidden items-center gap-2.5 lg:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="font-mono text-xs uppercase tracking-[0.22em] text-muted">
              Panel de prospection
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-4">
          {/* Badge des réponses non lues */}
          <Link
            to="/dashboard"
            className={`relative flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-sm px-2.5 text-xs transition-colors sm:min-w-0 sm:justify-start ${
              nonLues > 0
                ? 'border border-accent/40 bg-accent/10 text-accent font-medium'
                : 'text-muted hover:bg-surface-alt hover:text-ink'
            }`}
            aria-label={
              nonLues > 0
                ? `${nonLues} réponse(s) non lue(s)`
                : 'Aucune réponse non lue'
            }
            title={nonLues > 0 ? `${nonLues} réponse(s) non lue(s)` : 'Aucune réponse non lue'}
          >
            <Inbox size={17} />
            <span className="hidden sm:inline">Réponses</span>
            {nonLues > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 font-mono text-xs font-bold text-bg">
                {nonLues}
              </span>
            )}
          </Link>

          <div className="hidden text-right leading-tight sm:block">
            <p className="text-sm text-ink">{utilisateur?.nom}</p>
            <p className="font-mono text-xs text-muted">{utilisateur?.email}</p>
          </div>
          <div className="hidden h-9 w-9 items-center justify-center rounded-full border border-border bg-surface-alt font-mono text-xs text-accent sm:flex">
            {initiales(utilisateur?.nom)}
          </div>
          <button
            type="button"
            onClick={deconnecter}
            className="btn-ghost hidden h-11 w-11 px-0 lg:inline-flex"
            aria-label="Se déconnecter"
            title="Se déconnecter"
          >
            <LogOut size={16} />
          </button>

          {/* Actions secondaires sur mobile et tablette */}
          <div ref={menuZoneRef} className="relative lg:hidden">
            <button
              type="button"
              onClick={() => setMenuOuvert((ouvert) => !ouvert)}
              className="btn-ghost h-11 w-11 px-0"
              aria-label="Ouvrir le menu des actions"
              aria-haspopup="menu"
              aria-expanded={menuOuvert}
              aria-controls="menu-actions-mobile"
            >
              <MoreVertical size={18} />
            </button>

            {menuOuvert && (
              <div
                id="menu-actions-mobile"
                role="menu"
                className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-md border border-border bg-surface p-1.5 shadow-card"
              >
                <Link
                  to="/parametres"
                  role="menuitem"
                  onClick={() => setMenuOuvert(false)}
                  className="flex min-h-11 items-center gap-2.5 rounded-sm px-3 text-sm text-ink transition-colors hover:bg-surface-alt/70"
                >
                  <Settings size={16} />
                  Paramètres
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOuvert(false)
                    deconnecter()
                  }}
                  className="flex min-h-11 w-full items-center gap-2.5 rounded-sm px-3 text-left text-sm text-muted transition-colors hover:bg-surface-alt/70 hover:text-ink"
                >
                  <LogOut size={16} />
                  Se déconnecter
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
