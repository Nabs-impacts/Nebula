// Variants Framer Motion partagés. Centralisés ici pour garder des durées/
// easings cohérents dans toute l'app plutôt que des valeurs éparpillées.
// MotionConfig(reducedMotion="user") au niveau racine (main.jsx) désactive
// déjà tout ceci automatiquement si l'utilisateur a activé
// prefers-reduced-motion — inutile de le re-vérifier composant par composant.

export const DURATION = {
  fast: 0.12,
  normal: 0.2,
  slow: 0.4,
}

export const EASE_SPRING = [0.16, 1, 0.3, 1]

// Conteneur à stagger léger (listes de cartes, lignes de tableau…)
export const staggerContainer = (delayChildren = 0, staggerAmount = 0.04) => ({
  hidden: {},
  show: {
    transition: {
      delayChildren,
      staggerChildren: staggerAmount,
    },
  },
})

export const staggerItem = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.normal, ease: EASE_SPRING },
  },
}

// Apparition/disparition douce d'un bloc (erreurs de formulaire, bannières…)
export const fadeIn = {
  hidden: { opacity: 0, height: 0, marginTop: 0 },
  show: { opacity: 1, height: 'auto', marginTop: 6 },
  exit: { opacity: 0, height: 0, marginTop: 0 },
}

export const fadeSlideUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: DURATION.slow, ease: EASE_SPRING } },
  exit: { opacity: 0, y: -6, transition: { duration: DURATION.fast } },
}

// Backdrop + panneau de modale
export const backdropVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: DURATION.fast } },
  exit: { opacity: 0, transition: { duration: DURATION.fast } },
}

export const modalVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: DURATION.normal, ease: EASE_SPRING } },
  exit: { opacity: 0, scale: 0.97, y: 4, transition: { duration: DURATION.fast } },
}

export const hoverLift = {
  y: -2,
  transition: { duration: DURATION.fast, ease: EASE_SPRING },
}
