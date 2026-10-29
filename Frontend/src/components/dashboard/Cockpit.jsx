import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Clock3, FilePenLine, MessageCircle } from 'lucide-react'
import { useActionsDashboard } from '../../hooks/useEntreprises'
import { SkeletonBlock } from '../common/Skeleton'
import { formatDateCourte } from '../../utils/formatters'
import { staggerContainer, staggerItem } from '../../lib/motion'

function Bloc({ titre, icone: Icone, couleur, vide, children }) {
  return (
    <motion.div variants={staggerItem} className="card flex flex-col p-4">
      <div className="mb-3 flex items-center gap-2">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-sm"
          style={{ backgroundColor: `${couleur}1a`, color: couleur }}
        >
          <Icone size={14} />
        </span>
        <h3 className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{titre}</h3>
      </div>
      {children}
      {vide && <p className="py-3 text-xs text-muted/60">{vide}</p>}
    </motion.div>
  )
}

export default function Cockpit() {
  const { data, isLoading } = useActionsDashboard()
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SkeletonBlock lines={3} />
        <SkeletonBlock lines={3} />
        <SkeletonBlock lines={3} />
      </div>
    )
  }

  if (!data) return null

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="section-title text-lg">Aujourd’hui</h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted/60">
          à traiter
        </span>
      </div>
      <motion.div
        variants={staggerContainer(0, 0.05)}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 lg:grid-cols-3"
      >
        <Bloc
          titre="À relancer"
          icone={Clock3}
          couleur="#e2725b"
          vide={data.a_relancer.length === 0 ? 'Aucune relance en retard.' : null}
        >
          <ul className="flex flex-col gap-1.5">
            {data.a_relancer.slice(0, 4).map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/entreprises/${item.id}`)}
                  className="flex w-full items-center justify-between gap-2 rounded-sm px-1 py-1.5 text-left transition-colors hover:bg-surface-alt"
                >
                  <span className="min-w-0 truncate text-sm text-ink/85">{item.nom}</span>
                  <span className="shrink-0 font-mono text-[10px] text-coral">
                    {item.jours_depuis_envoi != null ? `J+${item.jours_depuis_envoi}` : '—'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Bloc>

        <Bloc
          titre="Brouillons à valider"
          icone={FilePenLine}
          couleur="#e0a458"
          vide={data.brouillons.length === 0 ? 'Aucun message en attente.' : null}
        >
          <ul className="flex flex-col gap-1.5">
            {data.brouillons.slice(0, 4).map((item) => (
              <li key={item.message_id}>
                <button
                  type="button"
                  onClick={() => navigate(`/entreprises/${item.entreprise_id}`)}
                  className="flex w-full flex-col rounded-sm px-1 py-1.5 text-left transition-colors hover:bg-surface-alt"
                >
                  <span className="truncate text-sm text-ink/85">{item.nom}</span>
                  <span className="truncate font-mono text-[10px] text-muted/60">
                    {item.sujet || item.canal} · {formatDateCourte(item.date_generation)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Bloc>

        <Bloc
          titre="Réponses récentes"
          icone={MessageCircle}
          couleur="#8f9f9f"
          vide={data.reponses_recentes.length === 0 ? 'Aucune réponse récente.' : null}
        >
          <ul className="flex flex-col gap-1.5">
            {data.reponses_recentes.slice(0, 4).map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/entreprises/${item.id}`)}
                  className="flex w-full items-center justify-between gap-2 rounded-sm px-1 py-1.5 text-left transition-colors hover:bg-surface-alt"
                >
                  <span className="min-w-0 truncate text-sm text-ink/85">{item.nom}</span>
                  <span className="shrink-0 font-mono text-[10px] text-sage">{item.statut}</span>
                </button>
              </li>
            ))}
          </ul>
        </Bloc>
      </motion.div>
    </div>
  )
}
