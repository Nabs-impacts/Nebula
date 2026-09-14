import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Radio } from 'lucide-react'
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
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 flex flex-col items-center gap-2">
          <Radio size={28} className="text-neon" />
          <h1 className="font-mono text-lg tracking-tight text-ink">nebula</h1>
          <p className="text-sm text-muted">Panel de prospection · Tenora</p>
        </div>

        <form onSubmit={gererSubmit} className="card flex flex-col gap-4 p-6" noValidate>
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

          <button type="submit" className="btn-primary mt-2 w-full" disabled={chargement}>
            {chargement && <Loader2 size={15} className="animate-spin" />}
            {chargement ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
