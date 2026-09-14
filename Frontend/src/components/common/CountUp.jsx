import { useEffect, useRef, useState } from 'react'
import { animate, useReducedMotion } from 'framer-motion'

/**
 * Anime un nombre de 0 (ou de la valeur précédente) jusqu'à `valeur`.
 * `formatter` permet de garder le formatage existant (%, arrondis…).
 */
export default function CountUp({ valeur, formatter = (v) => Math.round(v), duree = 0.6 }) {
  const [affiche, setAffiche] = useState(0)
  const precedent = useRef(0)
  const reduitMotion = useReducedMotion()

  useEffect(() => {
    const cible = Number(valeur) || 0

    if (reduitMotion) {
      setAffiche(cible)
      precedent.current = cible
      return
    }

    const controls = animate(precedent.current, cible, {
      duration: duree,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setAffiche(v),
      onComplete: () => {
        precedent.current = cible
      },
    })
    return () => controls.stop()
  }, [valeur, duree, reduitMotion])

  return <>{formatter(affiche)}</>
}
