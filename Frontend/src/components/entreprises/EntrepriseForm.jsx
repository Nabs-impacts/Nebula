import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { TYPE_ENTREPRISE_LABELS } from '../../utils/formatters'
import { validerFormulaireEntreprise } from '../../utils/validators'
import FloatingField from '../common/FloatingField'
import { fadeIn } from '../../lib/motion'

const VALEURS_INITIALES_VIDES = {
  nom: '',
  email: '',
  whatsapp: '',
  type_entreprise: '',
  prototype_a_presenter: '',
  description_prototype: '',
}

export default function EntrepriseForm({
  valeursInitiales = VALEURS_INITIALES_VIDES,
  enCours = false,
  erreurApi = null,
  texteBouton = 'Enregistrer',
  onSubmit,
  onAnnuler,
}) {
  const [valeurs, setValeurs] = useState({ ...VALEURS_INITIALES_VIDES, ...valeursInitiales })
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
