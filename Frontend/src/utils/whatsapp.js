const AGENCE = {
  nom: import.meta.env.VITE_AGENCE_NOM || 'Tenora',
  signature: import.meta.env.VITE_AGENCE_SIGNATURE || "L'équipe Tenora",
  telephone_1: import.meta.env.VITE_AGENCE_TELEPHONE_1 || '87773982',
  telephone_2: import.meta.env.VITE_AGENCE_TELEPHONE_2 || '80181172',
  site_web: import.meta.env.VITE_AGENCE_SITE_WEB || 'https://tenora-digital.store',
}

export function normaliserNumeroWhatsapp(numero) {
  if (!numero) return null

  let chiffres = String(numero).replace(/\D/g, '')
  if (!chiffres) return null

  if (chiffres.startsWith('00')) {
    chiffres = chiffres.slice(2)
  }
  if (!chiffres) return null

  if (!chiffres.startsWith('227') && chiffres.length === 8) {
    chiffres = `227${chiffres}`
  }

  if (!/^\d{8,15}$/.test(chiffres)) return null

  return chiffres
}

export function ajouterSignatureWhatsapp(texte) {
  if (!texte) return ''

  const minuscules = texte.toLowerCase()
  if (minuscules.includes('cordialement') || minuscules.includes(AGENCE.nom.toLowerCase())) {
    return texte
  }

  const signature = [
    'Cordialement,',
    AGENCE.signature,
    `${AGENCE.telephone_1} · ${AGENCE.telephone_2}`,
    AGENCE.site_web,
  ]

  return `${texte.trimEnd()}\n\n${signature.join('\n')}`
}

export function genererLienWaMe(numero, message) {
  const numeroNormalise = normaliserNumeroWhatsapp(numero)
  if (!numeroNormalise) return null

  return `https://wa.me/${numeroNormalise}?text=${encodeURIComponent(message ?? '')}`
}
