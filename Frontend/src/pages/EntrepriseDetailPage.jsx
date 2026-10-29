import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Loader2, Pencil, RefreshCw, Sparkles, Trash2 } from 'lucide-react'
import { useEntreprise, useModifierEntreprise, useSupprimerEntreprise } from '../hooks/useEntreprises'
import {
  useCorrigerMessage,
  useEnvoyerMessage,
  useGenererMessage,
  useGenererRelance,
  useHistoriqueMessages,
} from '../hooks/useMessages'
import EntrepriseForm from '../components/entreprises/EntrepriseForm'
import StatutBadge from '../components/entreprises/StatutBadge'
import MessagePreview from '../components/messages/MessagePreview'
import MessageEditor from '../components/messages/MessageEditor'
import HistoriqueMessages from '../components/messages/HistoriqueMessages'
import NotesTimeline from '../components/entreprises/NotesTimeline'
import ConfirmModal from '../components/common/ConfirmModal'
import { SkeletonBlock } from '../components/common/Skeleton'
import { useToast } from '../components/common/Toast'
import { validerFormulaireGeneration } from '../utils/validators'
import {
  CANAL_LABELS,
  PRESENCE_WEB_LABELS,
  PRIORITE_LABELS,
  STATUT_LABELS,
  TYPE_ENTREPRISE_LABELS,
} from '../utils/formatters'
import { fadeIn, fadeSlideUp } from '../lib/motion'

function FormulaireGeneration({ onGenerer, enCours, erreur }) {
  const [valeurs, setValeurs] = useState({ canal: 'email', service_a_proposer: '', ton: '' })
  const [erreursChamps, setErreursChamps] = useState({})

  function gererSubmit(e) {
    e.preventDefault()
    const erreursValidation = validerFormulaireGeneration(valeurs)
    setErreursChamps(erreursValidation)
    if (Object.keys(erreursValidation).length === 0) {
      onGenerer(valeurs)
    }
  }

  return (
    <form onSubmit={gererSubmit} className="card flex flex-col gap-4 p-5 sm:p-6">
      <div>
        <p className="eyebrow mb-1.5">Assistant IA</p>
        <h2 className="section-title">Générer un message de prospection</h2>
      </div>

      <AnimatePresence>
        {erreur && (
          <motion.p
            variants={fadeIn}
            initial="hidden"
            animate="show"
            exit="exit"
            className="overflow-hidden text-xs text-danger"
          >
            {erreur}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <select
          className="input"
          value={valeurs.canal}
          onChange={(e) => setValeurs((v) => ({ ...v, canal: e.target.value }))}
        >
          {Object.entries(CANAL_LABELS).map(([valeur, label]) => (
            <option key={valeur} value={valeur}>
              {label}
            </option>
          ))}
        </select>

        <input
          className="input sm:col-span-2"
          placeholder="Service à proposer (ex : site vitrine + SEO local)"
          value={valeurs.service_a_proposer}
          onChange={(e) => setValeurs((v) => ({ ...v, service_a_proposer: e.target.value }))}
        />
      </div>
      {erreursChamps.service_a_proposer && (
        <p className="-mt-2 text-xs text-danger">{erreursChamps.service_a_proposer}</p>
      )}

      <input
        className="input"
        placeholder="Ton souhaité (optionnel — ex : chaleureux, direct, formel)"
        value={valeurs.ton}
        onChange={(e) => setValeurs((v) => ({ ...v, ton: e.target.value }))}
      />

      <button type="submit" className="btn-primary self-start" disabled={enCours}>
        {enCours ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
        {enCours ? 'Génération…' : 'Générer le message'}
      </button>
    </form>
  )
}

export default function EntrepriseDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const { data: entreprise, isLoading, isError } = useEntreprise(id)
  const { data: historique = [] } = useHistoriqueMessages(id)

  const modifierEntreprise = useModifierEntreprise(id)
  const supprimerEntreprise = useSupprimerEntreprise()
  const genererMessage = useGenererMessage(id)
  const corrigerMessage = useCorrigerMessage(id)
  const envoyerMessage = useEnvoyerMessage(id)
  const genererRelance = useGenererRelance(id)

  const [modeEdition, setModeEdition] = useState(false)
  const [modaleSuppression, setModaleSuppression] = useState(false)
  const [messageEnEdition, setMessageEnEdition] = useState(null)

  const dernierMessage = historique[0] ?? null
  const auMoinsUnEnvoye = historique.some((m) => m.statut_envoi === 'envoye')

  async function gererGeneration(valeurs) {
    try {
      await genererMessage.mutateAsync({ entreprise_id: id, ...valeurs })
      toast.succes('Message généré avec succès.')
    } catch {
      // erreur déjà affichée dans FormulaireGeneration
    }
  }

  async function gererSuppression() {
    await supprimerEntreprise.mutateAsync(id)
    toast.succes(`« ${entreprise.nom} » a été supprimée.`)
    navigate('/entreprises')
  }

  async function gererEnvoi(messageId) {
    try {
      await envoyerMessage.mutateAsync(messageId)
      toast.succes('Message envoyé.')
    } catch (erreur) {
      const detail = erreur?.response?.data?.detail
      toast.erreur(
        typeof detail === 'string' && detail
          ? detail
          : "L'envoi du message a échoué. Vérifiez la configuration du fournisseur.",
        { duree: 8000 },
      )
    }
  }

  async function gererCorrection(messageId, payload) {
    try {
      await corrigerMessage.mutateAsync({ id: messageId, payload })
      setMessageEnEdition(null)
      toast.succes('Message mis à jour.')
    } catch {
      toast.erreur('Impossible d’enregistrer les corrections.')
    }
  }

  async function gererChangementStatut(statut) {
    try {
      await modifierEntreprise.mutateAsync({ statut })
      toast.succes('Statut mis à jour.')
    } catch {
      toast.erreur('Impossible de changer le statut.')
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <SkeletonBlock lines={2} />
        <SkeletonBlock lines={4} />
        <SkeletonBlock lines={3} />
      </div>
    )
  }
  if (isError || !entreprise) {
    return <p className="card border-danger/40 p-4 text-sm text-danger">Entreprise introuvable.</p>
  }

  return (
    <div className="flex flex-col gap-8">
      <button
        type="button"
        onClick={() => navigate('/entreprises')}
        className="btn-ghost -ml-2 self-start px-2"
      >
        <ArrowLeft size={16} /> Retour aux entreprises
      </button>

      <motion.div
        variants={fadeSlideUp}
        initial="hidden"
        animate="show"
        className="flex flex-wrap items-start justify-between gap-4"
      >
        <div>
          <p className="eyebrow mb-2">
            {TYPE_ENTREPRISE_LABELS[entreprise.type_entreprise] ?? entreprise.type_entreprise}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="page-title">{entreprise.nom}</h1>
            <StatutBadge statut={entreprise.statut} />
          </div>
        </div>

        <div className="flex gap-2">
          <button type="button" className="btn-secondary" onClick={() => setModeEdition((v) => !v)}>
            <Pencil size={14} /> {modeEdition ? 'Fermer' : 'Modifier'}
          </button>
          <button type="button" className="btn-danger" onClick={() => setModaleSuppression(true)}>
            <Trash2 size={14} /> Supprimer
          </button>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {modeEdition ? (
          <motion.div
            key="edition"
            variants={fadeSlideUp}
            initial="hidden"
            animate="show"
            exit="exit"
            className="card p-5 sm:p-6"
          >
            <EntrepriseForm
              valeursInitiales={entreprise}
              enCours={modifierEntreprise.isPending}
              erreurApi={modifierEntreprise.isError ? 'Impossible d’enregistrer les modifications.' : null}
              texteBouton="Enregistrer les modifications"
              onSubmit={async (valeurs) => {
                try {
                  await modifierEntreprise.mutateAsync(valeurs)
                  setModeEdition(false)
                  toast.succes('Modifications enregistrées.')
                } catch {
                  // erreur déjà affichée dans le formulaire
                }
              }}
              onAnnuler={() => setModeEdition(false)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="lecture"
            variants={fadeSlideUp}
            initial="hidden"
            animate="show"
            exit="exit"
            className="card grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6"
          >
            <div>
              <p className="label">Email</p>
              <p className="text-sm text-ink/85">{entreprise.email ?? '—'}</p>
            </div>
            <div>
              <p className="label">WhatsApp</p>
              <p className="text-sm text-ink/85">{entreprise.whatsapp ?? '—'}</p>
            </div>
            <div>
              <p className="label">Contact</p>
              <p className="text-sm text-ink/85">{entreprise.contact_nom ?? '—'}</p>
            </div>
            <div>
              <p className="label">Ville</p>
              <p className="text-sm text-ink/85">{entreprise.ville ?? '—'}</p>
            </div>
            <div>
              <p className="label">Statut</p>
              <select
                className="input mt-1 py-1.5 text-sm"
                value={entreprise.statut}
                onChange={(e) => gererChangementStatut(e.target.value)}
                disabled={modifierEntreprise.isPending}
              >
                {Object.entries(STATUT_LABELS).map(([valeur, label]) => (
                  <option key={valeur} value={valeur}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="label">Priorité</p>
              <p className="text-sm text-ink/85">{PRIORITE_LABELS[entreprise.priorite] ?? entreprise.priorite}</p>
            </div>
            <div>
              <p className="label">Présence web</p>
              <p className="text-sm text-ink/85">
                {PRESENCE_WEB_LABELS[entreprise.presence_web] ?? entreprise.presence_web}
                {entreprise.site_web ? ` · ${entreprise.site_web}` : ''}
              </p>
            </div>
            <div>
              <p className="label">Note Google</p>
              <p className="text-sm text-ink/85">
                {entreprise.note_google != null ? `${entreprise.note_google} / 5` : '—'}
              </p>
            </div>
            {entreprise.tags?.length > 0 && (
              <div className="sm:col-span-2">
                <p className="label">Tags</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {entreprise.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-sm border border-border px-2 py-0.5 font-mono text-[10px] text-muted"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="sm:col-span-2">
              <p className="label">Angle d’accroche / observations</p>
              <p className="text-sm leading-relaxed text-ink/85">
                {entreprise.autres_observations ?? '—'}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="label">Prototype à présenter</p>
              <p className="text-sm text-ink/85">{entreprise.prototype_a_presenter}</p>
            </div>
            {entreprise.description_prototype && (
              <div className="sm:col-span-2">
                <p className="label">Description</p>
                <p className="text-sm leading-relaxed text-ink/85">{entreprise.description_prototype}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <NotesTimeline entrepriseId={id} />

      <FormulaireGeneration
        onGenerer={gererGeneration}
        enCours={genererMessage.isPending}
        erreur={
          genererMessage.isError
            ? genererMessage.error?.response?.status === 502
              ? "La génération IA a échoué, réessayez dans quelques instants."
              : "Impossible de générer le message."
            : null
        }
      />

      {dernierMessage && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="section-title">Dernier message</h2>
            {auMoinsUnEnvoye && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => genererRelance.mutate()}
                disabled={genererRelance.isPending}
              >
                {genererRelance.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <RefreshCw size={14} />
                )}
                {genererRelance.isPending ? 'Génération…' : 'Générer une relance'}
              </button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {messageEnEdition?.id === dernierMessage.id ? (
              <MessageEditor
                key="editeur"
                message={dernierMessage}
                enCours={corrigerMessage.isPending}
                onEnregistrer={(payload) => gererCorrection(dernierMessage.id, payload)}
                onAnnuler={() => setMessageEnEdition(null)}
              />
            ) : (
              <MessagePreview
                key="apercu"
                message={dernierMessage}
                envoiEnCours={envoyerMessage.isPending}
                onModifier={() => setMessageEnEdition(dernierMessage)}
                onEnvoyer={() => gererEnvoi(dernierMessage.id)}
              />
            )}
          </AnimatePresence>
        </div>
      )}

      <HistoriqueMessages messages={historique} />

      <ConfirmModal
        ouvert={modaleSuppression}
        titre="Supprimer cette entreprise ?"
        message="Cette action est irréversible et supprimera aussi son historique de messages."
        texteConfirmer="Supprimer"
        dangereux
        enCours={supprimerEntreprise.isPending}
        onConfirmer={gererSuppression}
        onAnnuler={() => setModaleSuppression(false)}
      />
    </div>
  )
}
