const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const REGEX_WHATSAPP = /^\+\d{6,15}$/

export function validerEmail(email) {
  return REGEX_EMAIL.test(email.trim())
}

export function validerWhatsapp(numero) {
  return REGEX_WHATSAPP.test(numero.trim())
}

export function validerFormulaireEntreprise(valeurs) {
  const erreurs = {}

  if (!valeurs.nom?.trim()) {
    erreurs.nom = 'Le nom est obligatoire.'
  }

  const aEmail = Boolean(valeurs.email?.trim())
  const aWhatsapp = Boolean(valeurs.whatsapp?.trim())

  if (!aEmail && !aWhatsapp) {
    erreurs.email = 'Renseignez un email ou un numéro WhatsApp.'
    erreurs.whatsapp = 'Renseignez un email ou un numéro WhatsApp.'
  } else {
    if (aEmail && !validerEmail(valeurs.email)) {
      erreurs.email = 'Format email invalide.'
    }
    if (aWhatsapp && !validerWhatsapp(valeurs.whatsapp)) {
      erreurs.whatsapp = 'Format international requis, ex : +22790000000'
    }
  }

  if (!valeurs.type_entreprise) {
    erreurs.type_entreprise = 'Sélectionnez un type d’entreprise.'
  }

  if (!valeurs.prototype_a_presenter?.trim()) {
    erreurs.prototype_a_presenter = 'Ce champ est obligatoire.'
  }

  const note = valeurs.note_google
  if (note !== '' && note !== null && note !== undefined) {
    const valeur = Number(note)
    if (Number.isNaN(valeur) || valeur < 0 || valeur > 5) {
      erreurs.note_google = 'La note doit être comprise entre 0 et 5.'
    }
  }

  if (valeurs.presence_web === 'site_existant' && !valeurs.site_web?.trim()) {
    erreurs.site_web = 'Indiquez l’URL du site existant.'
  }

  return erreurs
}

export function validerFormulaireGeneration(valeurs) {
  const erreurs = {}
  if (!valeurs.canal) {
    erreurs.canal = 'Choisissez un canal.'
  }
  if (!valeurs.service_a_proposer?.trim()) {
    erreurs.service_a_proposer = 'Précisez le service à proposer.'
  }
  return erreurs
}
