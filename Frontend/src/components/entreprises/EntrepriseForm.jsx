import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import {
  PRESENCE_WEB_LABELS,
  PRIORITE_LABELS,
  TYPE_ENTREPRISE_LABELS,
} from '../../utils/formatters'
import { validerFormulaireEntreprise } from '../../utils/validators'
import FloatingField from '../common/FloatingField'
import { fadeIn } from '../../lib/motion'

const VALEURS_INITIALES_VIDES = {
  nom: '',
  email: '',
  whatsapp: '',
  contact_nom: '',
  ville: '',
  site_web: '',
  presence_web: 'inconnu',
  note_google: '',
  autres_observations: '',
  priorite: 'normale',
  tags: '',
  type_entreprise: '',
  prototype_a_presenter: '',
  description_prototype: '',
}

function normaliserValeursInitiales(valeursInitiales) {
  const texte = (valeur) => (valeur == null ? '' : String(valeur))
  return {
    ...VALEURS_INITIALES_VIDES,
    ...valeursInitiales,
    nom: texte(valeursInitiales?.nom),
    email: texte(valeursInitiales?.email),
    whatsapp: texte(valeursInitiales?.whatsapp),
    contact_nom: texte(valeursInitiales?.contact_nom),
    ville: texte(valeursInitiales?.ville),
    site_web: texte(valeursInitiales?.site_web),
    autres_observations: texte(valeursInitiales?.autres_observations),
    description_prototype: texte(valeursInitiales?.description_prototype),
    prototype_a_presenter: texte(valeursInitiales?.prototype_a_presenter),
    tags: Array.isArray(valeursInitiales?.tags)
      ? valeursInitiales.tags.join(', ')
      : texte(valeursInitiales?.tags),
    note_google: valeursInitiales?.note_google ?? '',
    presence_web: valeursInitiales?.presence_web ?? 'inconnu',
    priorite: valeursInitiales?.priorite ?? 'normale',
    type_entreprise: texte(valeursInitiales?.type_entreprise),
  }
}

export default function EntrepriseForm({
  valeursInitiales = VALEURS_INITIALES_VIDES,
  enCours = false,
  erreurApi = null,
  texteBouton = 'Enregistrer',
  onSubmit,
  onAnnuler,
}) {
  const [valeurs, setValeurs] = useState(() => normaliserValeursInitiales(valeursInitiales))
  // Validation en temps réel : recalculée à chaque frappe, mais un champ
  // n'affiche son erreur qu'une fois "touché" pour ne pas juger l'usager
  // avant qu'il ait fini de le remplir.
  const [erreurs, setErreurs] = useState({})
  const [champsTouches, setChampsTouches] = useState({})

  useEffect(() => {
    setErreurs(validerFormulaireEntreprise(valeurs))
  }, [valeurs])

  function majChamp(champ, valeur) {
    setValeurs((prev) => ({ ...prev, [champ]: valeur }))
  }

  function toucherChamp(champ) {
    setChampsTouches((prev) => ({ ...prev, [champ]: true }))
  }

  function gererSubmit(e) {
    e.preventDefault()
    setChampsTouches({
      nom: true,
      email: true,
      whatsapp: true,
      type_entreprise: true,
      prototype_a_presenter: true,
      note_google: true,
      site_web: true,
    })
    const erreursValidation = validerFormulaireEntreprise(valeurs)
    setErreurs(erreursValidation)
    if (Object.keys(erreursValidation).length === 0) {
      onSubmit(valeurs)
    }
  }

  return (
    <form onSubmit={gererSubmit} className="flex flex-col gap-4" noValidate>
      <AnimatePresence>
        {erreurApi && (
          <motion.p
            variants={fadeIn}
            initial="hidden"
            animate="show"
            exit="exit"
            role="alert"
            className="overflow-hidden card border-danger/40 p-3 text-sm text-danger"
          >
            {erreurApi}
          </motion.p>
        )}
      </AnimatePresence>

      <FloatingField
        label="Nom de l’entreprise"
        value={valeurs.nom}
        onChange={(e) => majChamp('nom', e.target.value)}
        onBlur={() => toucherChamp('nom')}
        erreur={erreurs.nom}
        touche={Boolean(champsTouches.nom)}
        required
        placeholder="Ex : Boutique Al-Amana"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FloatingField
          label="Email"
          type="email"
          value={valeurs.email}
          onChange={(e) => majChamp('email', e.target.value)}
          onBlur={() => toucherChamp('email')}
          erreur={erreurs.email}
          touche={Boolean(champsTouches.email)}
          placeholder="contact@entreprise.ne"
        />

        <FloatingField
          label="WhatsApp"
          value={valeurs.whatsapp}
          onChange={(e) => majChamp('whatsapp', e.target.value)}
          onBlur={() => toucherChamp('whatsapp')}
          erreur={erreurs.whatsapp}
          touche={Boolean(champsTouches.whatsapp)}
          placeholder="+22790000000"
        />
      </div>
      <p className="-mt-2 text-xs text-muted">Email ou WhatsApp obligatoire (au moins un des deux).</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FloatingField
          label="Nom du contact"
          value={valeurs.contact_nom}
          onChange={(e) => majChamp('contact_nom', e.target.value)}
          placeholder="Ex : M. Issoufou"
        />
        <FloatingField
          label="Ville"
          value={valeurs.ville}
          onChange={(e) => majChamp('ville', e.target.value)}
          placeholder="Ex : Niamey"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="type_entreprise">
            Type d’entreprise
          </label>
          <select
            id="type_entreprise"
            className={`input ${champsTouches.type_entreprise && erreurs.type_entreprise ? 'border-danger/60' : ''}`}
            value={valeurs.type_entreprise}
            onChange={(e) => majChamp('type_entreprise', e.target.value)}
            onBlur={() => toucherChamp('type_entreprise')}
          >
            <option value="">Sélectionner…</option>
            {Object.entries(TYPE_ENTREPRISE_LABELS).map(([valeur, label]) => (
              <option key={valeur} value={valeur}>
                {label}
              </option>
            ))}
          </select>
          <AnimatePresence>
            {champsTouches.type_entreprise && erreurs.type_entreprise && (
              <motion.p
                variants={fadeIn}
                initial="hidden"
                animate="show"
                exit="exit"
                className="overflow-hidden text-xs text-danger"
              >
                {erreurs.type_entreprise}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <div>
          <label className="label" htmlFor="priorite">
            Priorité
          </label>
          <select
            id="priorite"
            className="input"
            value={valeurs.priorite}
            onChange={(e) => majChamp('priorite', e.target.value)}
          >
            {Object.entries(PRIORITE_LABELS).map(([valeur, label]) => (
              <option key={valeur} value={valeur}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="presence_web">
            Présence web
          </label>
          <select
            id="presence_web"
            className="input"
            value={valeurs.presence_web}
            onChange={(e) => majChamp('presence_web', e.target.value)}
          >
            {Object.entries(PRESENCE_WEB_LABELS).map(([valeur, label]) => (
              <option key={valeur} value={valeur}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <FloatingField
          label="Note Google (0 à 5)"
          type="number"
          step="0.1"
          min="0"
          max="5"
          value={valeurs.note_google}
          onChange={(e) => majChamp('note_google', e.target.value)}
          onBlur={() => toucherChamp('note_google')}
          erreur={erreurs.note_google}
          touche={Boolean(champsTouches.note_google)}
          placeholder="Ex : 4.6"
        />
      </div>

      {valeurs.presence_web === 'site_existant' && (
        <FloatingField
          label="URL du site existant"
          value={valeurs.site_web}
          onChange={(e) => majChamp('site_web', e.target.value)}
          onBlur={() => toucherChamp('site_web')}
          erreur={erreurs.site_web}
          touche={Boolean(champsTouches.site_web)}
          placeholder="https://…"
        />
      )}

      <FloatingField
        label="Angle d’accroche / observations"
        value={valeurs.autres_observations}
        onChange={(e) => majChamp('autres_observations', e.target.value)}
        textarea
        placeholder="Ex : 4,6 ★ sur Google Maps, très bons avis sur les délais, aucun site web."
      />

      <FloatingField
        label="Tags (séparés par des virgules)"
        value={valeurs.tags}
        onChange={(e) => majChamp('tags', e.target.value)}
        placeholder="Ex : fort potentiel, bouche-à-oreille, à relancer"
      />

      <FloatingField
        label="Prototype à présenter"
        value={valeurs.prototype_a_presenter}
        onChange={(e) => majChamp('prototype_a_presenter', e.target.value)}
        onBlur={() => toucherChamp('prototype_a_presenter')}
        erreur={erreurs.prototype_a_presenter}
        touche={Boolean(champsTouches.prototype_a_presenter)}
        required
        placeholder="Ex : Site vitrine + catalogue en ligne"
      />

      <FloatingField
        label="Description du prototype"
        value={valeurs.description_prototype}
        onChange={(e) => majChamp('description_prototype', e.target.value)}
        textarea
        placeholder="Détails à réutiliser lors de la génération du message…"
      />

      <div className="mt-2 flex justify-end gap-2">
        {onAnnuler && (
          <button type="button" className="btn-ghost" onClick={onAnnuler} disabled={enCours}>
            Annuler
          </button>
        )}
        <button type="submit" className="btn-primary" disabled={enCours}>
          {enCours && <Loader2 size={14} className="animate-spin" />}
          {enCours ? 'Enregistrement…' : texteBouton}
        </button>
      </div>
    </form>
  )
}
