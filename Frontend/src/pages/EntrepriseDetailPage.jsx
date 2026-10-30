import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, CheckCircle2, Loader2, Pencil, RefreshCw, RotateCcw, Sparkles, Trash2 } from 'lucide-react'
import { useEntreprise, useModifierEntreprise, useSupprimerEntreprise } from '../hooks/useEntreprises'
import {
  useAnglesDisponibles,
  useAngleSuggere,
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
import ReponsesRecuesSection from '../components/entreprises/ReponsesRecuesSection'
import NotesTimeline from '../components/entreprises/NotesTimeline'
import ConfirmModal from '../components/common/ConfirmModal'
import CloturerModal from '../components/entreprises/CloturerModal'
import { SkeletonBlock } from '../components/common/Skeleton'
import { useToast } from '../components/common/Toast'
import {
  CANAL_LABELS,
  PRESENCE_WEB_LABELS,
  PRIORITE_LABELS,
  TYPE_ENTREPRISE_LABELS,
} from '../utils/formatters'
import { fadeIn, fadeSlideUp } from '../lib/motion'

function FormulaireGenerationSansDoublon({ entreprise, onGenerer, enCours, onModifierFiche }) {
  const { data: suggestion } = useAngleSuggere(entreprise.id)
  const { data: anglesListe = [] } = useAnglesDisponibles()

  const canalInitial = entreprise.email ? 'email' : entreprise.whatsapp ? 'whatsapp' : 'email'
  const [canal, setCanal] = useState(canalInitial)
  const [angleChoisi, setAngleChoisi] = useState('')
  const [consigne, setConsigne] = useState('')

  useEffect(() => {
    if (suggestion?.code && !angleChoisi) {
      setAngleChoisi(suggestion.code)
    }
  }, [suggestion, angleChoisi])

  function gererSubmit(e) {
    e.preventDefault()
    onGenerer({
      canal,
      angle_code: angleChoisi || suggestion?.code,
      consigne_supplementaire: consigne.trim() || undefined,
    })
  }

  // Filtrer les données renseignées pour le récapitulatif
  const infosAffichees = [
    entreprise.ville && `Ville : ${entreprise.ville}`,
    entreprise.type_entreprise && `Secteur : ${TYPE_ENTREPRISE_LABELS[entreprise.type_entreprise] ?? entreprise.type_entreprise}`,
    entreprise.contact_nom && `Contact : ${entreprise.contact_nom}`,
    entreprise.note_google && `Note Google : ${entreprise.note_google} ★`,
    entreprise.presence_web && entreprise.presence_web !== 'inconnu' && `Web : ${PRESENCE_WEB_LABELS[entreprise.presence_web] ?? entreprise.presence_web}`,
    entreprise.site_web && `Site : ${entreprise.site_web}`,
    entreprise.autres_observations && `Obs : ${entreprise.autres_observations}`,
  ].filter(Boolean)

  return (
    <form onSubmit={gererSubmit} className="card flex flex-col gap-4 p-5 sm:p-6">
      <div>
        <p className="eyebrow mb-1.5">Assistant IA</p>
        <h2 className="section-title">Générer un message de prospection</h2>
      </div>

      {/* Résumé des informations utilisées par l'IA */}
      <div className="rounded-md border border-border/80 bg-surface-alt/20 p-3.5 text-xs text-muted">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="font-mono text-[10px] uppercase tracking-wider text-accent font-medium">
            Informations prises en compte par l'IA
          </span>
          <button
            type="button"
            onClick={onModifierFiche}
            className="text-accent underline hover:text-ink transition-colors"
          >
            Modifier la fiche
          </button>
        </div>
        {infosAffichees.length > 0 ? (
          <p className="leading-relaxed text-ink/80">{infosAffichees.join(' · ')}</p>
        ) : (
          <p className="italic">Seul le nom de l'entreprise est renseigné pour le moment.</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Canal d'envoi</label>
          <select
            className="input"
            value={canal}
            onChange={(e) => setCanal(e.target.value)}
          >
            {Object.entries(CANAL_LABELS).map(([valeur, label]) => (
              <option key={valeur} value={valeur}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Angle proposé (modifiable)</label>
          <select
            className="input"
            value={angleChoisi}
            onChange={(e) => setAngleChoisi(e.target.value)}
          >
            {anglesListe.map((ang) => (
              <option key={ang.code} value={ang.code}>
                {ang.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Consigne supplémentaire (optionnelle)</label>
        <input
          className="input"
          placeholder="Ex : Mettre l'accent sur les délais rapides de livraison ou un ton plus chaleureux"
          value={consigne}
          onChange={(e) => setConsigne(e.target.value)}
        />
      </div>

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
  const [modaleCloture, setModaleCloture] = useState(false)
  const [messageEnEdition, setMessageEnEdition] = useState(null)

  const dernierMessage = historique[0] ?? null
  const auMoinsUnEnvoye = historique.some((m) => m.statut_envoi === 'envoye')
  const estCloture = entreprise?.statut === 'converti' || entreprise?.statut === 'perdu'

  async function gererGeneration(parametres) {
    try {
      await genererMessage.mutateAsync({ entreprise_id: id, ...parametres })
      toast.succes('Message généré avec succès.')
    } catch {
      toast.erreur('Impossible de générer le message.')
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

  async function gererCloture(statut) {
    try {
      await modifierEntreprise.mutateAsync({ statut })
      setModaleCloture(false)
      toast.succes(statut === 'converti' ? 'Entreprise marquée comme convertie !' : 'Entreprise marquée comme perdue.')
    } catch {
      toast.erreur('Impossible de clôturer la conversation.')
    }
  }

  async function gererReouverture() {
    try {
      const nouveauStatut = auMoinsUnEnvoye ? 'en_attente_reponse' : 'nouveau'
      await modifierEntreprise.mutateAsync({ statut: nouveauStatut })
      toast.succes('Conversation rouverte.')
    } catch {
      toast.erreur('Impossible de rouvrir la conversation.')
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

        <div className="flex flex-wrap items-center gap-2">
          {!estCloture ? (
            <button
              type="button"
              className="btn-secondary text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
              onClick={() => setModaleCloture(true)}
              title="Clôturer la conversation quand l'échange est terminé"
            >
              <CheckCircle2 size={14} /> Clôturer
            </button>
          ) : (
            <button
              type="button"
              className="btn-secondary text-muted hover:text-ink"
              onClick={gererReouverture}
              disabled={modifierEntreprise.isPending}
              title="Rouvrir la conversation pour poursuivre la prospection"
            >
              <RotateCcw size={14} /> Rouvrir
            </button>
          )}

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
              <div className="mt-1 flex items-center gap-2">
                <StatutBadge statut={entreprise.statut} />
                <span className="font-mono text-[10px] text-muted/60">(géré automatiquement)</span>
              </div>
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
            {entreprise.autres_observations && (
              <div className="sm:col-span-2">
                <p className="label">Angle d’accroche / observations</p>
                <p className="text-sm leading-relaxed text-ink/85">
                  {entreprise.autres_observations}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <NotesTimeline entrepriseId={id} />

      <ReponsesRecuesSection entrepriseId={id} />

      <FormulaireGenerationSansDoublon
        entreprise={entreprise}
        onGenerer={gererGeneration}
        enCours={genererMessage.isPending}
        onModifierFiche={() => setModeEdition(true)}
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
                numeroWhatsapp={entreprise.whatsapp}
                envoiEnCours={envoyerMessage.isPending}
                onModifier={() => setMessageEnEdition(dernierMessage)}
                onEnvoyer={() => gererEnvoi(dernierMessage.id)}
                onRegenerer={() => gererGeneration({ canal: dernierMessage.canal })}
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

      <CloturerModal
        ouvert={modaleCloture}
        nomEntreprise={entreprise.nom}
        enCours={modifierEntreprise.isPending}
        onCloturer={gererCloture}
        onFermer={() => setModaleCloture(false)}
      />
    </div>
  )
}
