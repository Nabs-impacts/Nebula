import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
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
  const [erreurs, setErreurs] = useState({})
  const [champsTouches, setChampsTouches] = useState({})
  // Section personnalisation ouverte par défaut sur grand écran, repliable
  const [sectionAvanceeOuverte, setSectionAvanceeOuverte] = useState(true)

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
      site_web: true,
    })
    const erreursValidation = validerFormulaireEntreprise(valeurs)
    setErreurs(erreursValidation)
    if (Object.keys(erreursValidation).length === 0) {
      onSubmit(valeurs)
    }
  }

  return (
    <form onSubmit={gererSubmit} className="flex flex-col gap-5" noValidate>
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

      {/* Bloc Essentiel (Toujours visible) */}
      <div className="flex flex-col gap-4">
        <p className="font-mono text-[11px] uppercase tracking-wider text-accent font-medium">
          1. Informations essentielles
        </p>

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
            autoComplete="email"
            placeholder="contact@entreprise.ne"
          />

          <FloatingField
            label="WhatsApp"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={valeurs.whatsapp}
            onChange={(e) => majChamp('whatsapp', e.target.value)}
            onBlur={() => toucherChamp('whatsapp')}
            erreur={erreurs.whatsapp}
            touche={Boolean(champsTouches.whatsapp)}
            placeholder="+22790000000"
          />
        </div>
        <p className="-mt-2 text-xs text-muted">Email ou WhatsApp obligatoire (au moins l'un des deux).</p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="type_entreprise">
              Secteur d'activité
            </label>
            <select
              id="type_entreprise"
              className="input"
              value={valeurs.type_entreprise}
              onChange={(e) => majChamp('type_entreprise', e.target.value)}
            >
              <option value="">Sélectionner un secteur…</option>
              {Object.entries(TYPE_ENTREPRISE_LABELS).map(([valeur, label]) => (
                <option key={valeur} value={valeur}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <FloatingField
            label="Ville"
            value={valeurs.ville}
            onChange={(e) => majChamp('ville', e.target.value)}
            autoComplete="address-level2"
            placeholder="Ex : Niamey"
          />
        </div>
      </div>

      {/* Bloc Repliable : Pour un message plus personnalisé */}
      <div className="rounded-md border border-border/80 bg-surface-alt/10 overflow-hidden">
        <button
          type="button"
          onClick={() => setSectionAvanceeOuverte((v) => !v)}
          className="flex w-full items-center justify-between p-3.5 text-left transition-colors hover:bg-surface-alt/30"
        >
          <div className="flex flex-col">
            <span className="font-mono text-[11px] uppercase tracking-wider text-ink font-medium">
              2. Pour un message plus personnalisé (optionnel)
            </span>
            <span className="text-xs text-muted">
              Site web, avis Google, contact, observations, tags…
            </span>
          </div>
          {sectionAvanceeOuverte ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {sectionAvanceeOuverte && (
          <div className="flex flex-col gap-4 border-t border-border/60 p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FloatingField
                label="Nom du contact (responsable)"
                value={valeurs.contact_nom}
                onChange={(e) => majChamp('contact_nom', e.target.value)}
                autoComplete="name"
                placeholder="Ex : M. Issoufou"
              />

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
                type="url"
                inputMode="url"
                autoCapitalize="none"
                autoComplete="url"
                value={valeurs.site_web}
                onChange={(e) => majChamp('site_web', e.target.value)}
                onBlur={() => toucherChamp('site_web')}
                erreur={erreurs.site_web}
                touche={Boolean(champsTouches.site_web)}
                placeholder="https://…"
              />
            )}

            <FloatingField
              label="Angle d’accroche / observations concrètes"
              value={valeurs.autres_observations}
              onChange={(e) => majChamp('autres_observations', e.target.value)}
              textarea
              placeholder="Ex : 4,6 ★ sur Google Maps, très bons avis sur les délais, aucun site web."
            />

            <FloatingField
              label="Tags (séparés par des virgules)"
              value={valeurs.tags}
              onChange={(e) => majChamp('tags', e.target.value)}
              placeholder="Ex : fort potentiel, bouche-à-oreille, relance"
            />
          </div>
        )}
      </div>

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
