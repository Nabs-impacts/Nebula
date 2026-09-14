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
