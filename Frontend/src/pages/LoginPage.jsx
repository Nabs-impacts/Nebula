import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Loader2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import FloatingField from '../components/common/FloatingField'
import { validerEmail } from '../utils/validators'
import { fadeIn } from '../lib/motion'

export default function LoginPage() {
  const { connecter, chargement, erreur } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [toucheEmail, setToucheEmail] = useState(false)
  const [touchePassword, setTouchePassword] = useState(false)

  const erreurEmail = email && !validerEmail(email) ? 'Format email invalide.' : null
  const erreurPassword = touchePassword && !motDePasse ? 'Mot de passe requis.' : null

  async function gererSubmit(e) {
    e.preventDefault()
    setToucheEmail(true)
    setTouchePassword(true)
    if (erreurEmail || !motDePasse) return
    try {
      await connecter(email, motDePasse)
      navigate('/entreprises', { replace: true })
    } catch {
      // l'erreur est déjà exposée via le contexte auth
    }
  }

  return (
    <div className="flex min-h-screen bg-bg">
      <div className="relative hidden w-[46%] flex-col justify-between overflow-hidden border-r border-border bg-surface/40 p-12 lg:flex">
        <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-accent/[0.07] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-coral/[0.05] blur-3xl" />

        <div className="relative flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-sm border border-accent/40 bg-accent/10 font-display text-lg text-accent">
            N
          </span>
          <div className="flex flex-col leading-none">
            <span className="font-display text-2xl tracking-tight text-ink">Nebula</span>
            <span className="mt-1 font-mono text-[9px] uppercase tracking-[0.24em] text-muted">
              Prospection · Tenora
            </span>
          </div>
        </div>

        <div className="relative max-w-md">
          <p className="eyebrow mb-5">Le pipeline, sans friction</p>
          <h1 className="font-display text-[2.6rem] leading-[1.08] tracking-tight text-ink">
            La prospection,
            <br />
            avec méthode.
          </h1>
          <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-muted">
            Centralisez vos prospects, générez des messages personnalisés et suivez chaque
            conversation — du premier contact à la signature.
          </p>
        </div>

        <div className="relative flex items-center gap-3 border-t border-border/70 pt-6">
          <span className="font-display text-2xl text-accent">01</span>
          <p className="text-xs leading-relaxed text-muted">
            Saisie, génération IA, relecture et envoi multicanal.
            <br />
            Un seul espace de travail pour toute l’équipe.
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-5 py-12 sm:px-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm"
        >
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-sm border border-accent/40 bg-accent/10 font-display text-lg text-accent">
              N
            </span>
            <span className="font-display text-2xl tracking-tight text-ink">Nebula</span>
          </div>

          <p className="eyebrow mb-2">Connexion</p>
          <h2 className="font-display text-3xl tracking-tight text-ink">Bon retour.</h2>
          <p className="mt-2 text-sm text-muted">
            Accédez à votre espace de prospection Tenora.
          </p>

          <form onSubmit={gererSubmit} className="mt-8 flex flex-col gap-5" noValidate>
            <AnimatePresence>
              {erreur && (
                <motion.p
                  variants={fadeIn}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  role="alert"
                  className="overflow-hidden rounded-sm border border-danger/40 bg-danger/10 p-3 text-sm text-danger"
                >
                  {erreur}
                </motion.p>
              )}
            </AnimatePresence>

            <FloatingField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setToucheEmail(true)}
              erreur={erreurEmail}
              touche={toucheEmail}
              required
              autoComplete="username"
              placeholder="user@tenora.ne"
            />

            <FloatingField
              label="Mot de passe"
              type="password"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              onBlur={() => setTouchePassword(true)}
              erreur={erreurPassword}
              touche={touchePassword}
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />

            <button type="submit" className="btn-primary mt-1 w-full" disabled={chargement}>
              {chargement && <Loader2 size={15} className="animate-spin" />}
              {chargement ? 'Connexion…' : 'Se connecter'}
              {!chargement && <ArrowRight size={15} />}
            </button>
          </form>

          <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.18em] text-muted/60">
            Nebula · usage interne
          </p>
        </motion.div>
      </div>
    </div>
  )
}
