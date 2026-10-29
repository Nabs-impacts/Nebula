import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Clock3, FilePenLine, MessageCircle, RefreshCw } from 'lucide-react'
import { useActionsDashboard } from '../../hooks/useEntreprises'
import { useResumeReponses, useVerifierReponses } from '../../hooks/useReponses'
import { SkeletonBlock } from '../common/Skeleton'
import { useToast } from '../common/Toast'
import { formatDateCourte } from '../../utils/formatters'
import { staggerContainer, staggerItem } from '../../lib/motion'

function formaterTempsEcoule(dateIso) {
  if (!dateIso) return null
  const date = new Date(dateIso)
  const diffMinutes = Math.floor((new Date() - date) / 60000)
  if (diffMinutes < 1) return 'à l’instant'
  if (diffMinutes < 60) return `il y a ${diffMinutes} min`
  const diffHeures = Math.floor(diffMinutes / 60)
  if (diffHeures < 24) return `il y a ${diffHeures} h`
  return `il y a ${Math.floor(diffHeures / 24)} j`
}

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
  const { data: resumeReponses } = useResumeReponses()
  const verifierMutation = useVerifierReponses()
  const navigate = useNavigate()
  const toast = useToast()

  const derniereVerif = formaterTempsEcoule(resumeReponses?.derniere_verification)

  async function gererVerificationManuelle() {
    try {
      const res = await verifierMutation.mutateAsync()
      if (res.limitation_active) {
        toast.info('Vérification déjà effectuée il y a moins d’une minute.')
      } else if (res.nouvelles_reponses > 0) {
        toast.succes(`${res.nouvelles_reponses} nouvelle(s) réponse(s) détectée(s) !`)
      } else {
        toast.info('Aucune nouvelle réponse trouvée.')
      }
    } catch {
      toast.erreur('Échec de la relève IMAP.')
    }
  }

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
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <h2 className="section-title text-lg">Aujourd’hui</h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted/60">
            à traiter
          </span>
        </div>

        {/* Contrôle et statut IMAP */}
        <div className="flex items-center gap-3">
          {resumeReponses?.imap_actif ? (
            <div className="flex items-center gap-2">
              {derniereVerif && (
                <span className="font-mono text-[10px] text-muted/70">
                  Dernière vérification {derniereVerif}
                </span>
              )}
              <button
                type="button"
                onClick={gererVerificationManuelle}
                disabled={verifierMutation.isPending}
                className="btn-ghost flex items-center gap-1.5 px-2 py-1 text-xs text-muted hover:text-ink"
                title="Vérifier la boîte email maintenant"
              >
                <RefreshCw
                  size={12}
                  className={verifierMutation.isPending ? 'animate-spin text-accent' : ''}
                />
                <span className="font-mono text-[10px] uppercase tracking-wider">
                  {verifierMutation.isPending ? 'Vérification…' : 'Vérifier maintenant'}
                </span>
              </button>
            </div>
          ) : (
            <span className="font-mono text-[10px] text-muted/60">
              Réception des réponses non configurée
            </span>
          )}
        </div>
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
          <ul className="flex flex-col gap-2">
            {data.reponses_recentes.slice(0, 4).map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/entreprises/${item.id}`)}
                  className={`flex w-full flex-col rounded-sm p-1.5 text-left transition-colors hover:bg-surface-alt ${
                    item.non_lu ? 'bg-accent/[0.06] border border-accent/30' : ''
                  }`}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 min-w-0 truncate text-sm font-medium text-ink/90">
                      {item.non_lu && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      )}
                      <span className="truncate">{item.nom}</span>
                    </span>
                    <span className="shrink-0 font-mono text-[10px] text-sage">{item.statut}</span>
                  </div>
                  {item.extrait ? (
                    <p className="mt-1 line-clamp-2 font-sans text-xs text-muted/80 leading-snug break-words">
                      {item.extrait}
                    </p>
                  ) : (
                    <span className="mt-0.5 font-mono text-[10px] text-muted/60">
                      Mis à jour {formatDateCourte(item.date_mise_a_jour)}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </Bloc>
      </motion.div>
    </div>
  )
}
