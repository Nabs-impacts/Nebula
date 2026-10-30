import { useId, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import { fadeIn } from '../../lib/motion'

/**
 * Champ avec label flottant + feedback de validation immédiat (pas
 * seulement au submit). `statut` vaut 'valide' | 'invalide' | undefined —
 * undefined tant que le champ n'a pas été touché, pour ne pas juger l'usager
 * avant qu'il n'ait fini de taper.
 */
export default function FloatingField({
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  erreur,
  touche = false,
  required = false,
  autoComplete,
  autoCapitalize,
  inputMode,
  enterKeyHint,
  name,
  min,
  max,
  step,
  rows,
  pattern,
  spellCheck,
  disabled = false,
  textarea = false,
  placeholder,
}) {
  const id = useId()
  const [focus, setFocus] = useState(false)
  const flotte = focus || Boolean(value)
  const statutValide = touche && !erreur && Boolean(value)
  const statutInvalide = touche && Boolean(erreur)

  const Composant = textarea ? 'textarea' : 'input'
  const modeSaisie =
    inputMode ?? (type === 'email' ? 'email' : type === 'tel' ? 'tel' : undefined)
  const capitalisation =
    autoCapitalize ??
    (['email', 'password', 'url', 'number'].includes(type) ? 'none' : undefined)

  return (
    <div>
      <div className="relative">
        <Composant
          id={id}
          name={name}
          type={textarea ? undefined : type}
          required={required}
          autoComplete={autoComplete}
          autoCapitalize={capitalisation}
          inputMode={modeSaisie}
          enterKeyHint={enterKeyHint}
          min={min}
          max={max}
          step={step}
          rows={rows}
          pattern={pattern}
          spellCheck={spellCheck}
          disabled={disabled}
          value={value}
          onChange={onChange}
          onFocus={() => setFocus(true)}
          onBlur={(e) => {
            setFocus(false)
            onBlur?.(e)
          }}
          placeholder={focus ? placeholder : ''}
          className={`input pr-9 pt-4 transition-colors ${textarea ? 'min-h-[96px] resize-y' : ''} ${
            statutInvalide ? 'border-danger/60 focus:border-danger/60' : ''
          } ${statutValide ? 'border-sage/50' : ''}`}
        />
        <label
          htmlFor={id}
          className={`pointer-events-none absolute left-3 font-medium transition-all duration-150 ${
            flotte
              ? 'top-1.5 text-xs font-medium uppercase tracking-[0.12em] text-muted'
              : `text-sm text-muted ${textarea ? 'top-2.5' : 'top-1/2 -translate-y-1/2'}`
          }`}
        >
          {label}
        </label>

        {(statutValide || statutInvalide) && (
          <span className={`absolute right-3 ${textarea ? 'top-2.5' : 'top-1/2 -translate-y-1/2'}`}>
            {statutValide ? (
              <Check size={15} className="text-sage" />
            ) : (
              <X size={15} className="text-danger" />
            )}
          </span>
        )}
      </div>

      <AnimatePresence>
        {statutInvalide && (
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
    </div>
  )
}
