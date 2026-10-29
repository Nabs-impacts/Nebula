import { useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Save, X } from 'lucide-react'
import { fadeSlideUp } from '../../lib/motion'

export default function MessageEditor({ message, enCours, onEnregistrer, onAnnuler }) {
  const [sujet, setSujet] = useState(message.sujet ?? '')
  const [contenu, setContenu] = useState(message.contenu_final ?? message.contenu_genere)

  return (
    <motion.div variants={fadeSlideUp} initial="hidden" animate="show" className="card p-5 sm:p-6">
      {message.canal === 'email' && (
        <div className="mb-4">
          <label className="label" htmlFor="sujet-message">
            Objet de l’email
          </label>
          <input
            id="sujet-message"
            className="input"
            value={sujet}
            onChange={(e) => setSujet(e.target.value)}
            placeholder="Ex : Les clients de Garage Sahel Auto vous cherchent sur Google"
          />
        </div>
      )}

      <label className="label" htmlFor="contenu-message">
        Corriger le message avant envoi
      </label>
      <textarea
        id="contenu-message"
        className="input min-h-[180px] resize-y font-sans leading-relaxed"
        value={contenu}
        onChange={(e) => setContenu(e.target.value)}
        autoFocus={message.canal !== 'email'}
      />
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" className="btn-ghost" onClick={onAnnuler} disabled={enCours}>
          <X size={14} /> Annuler
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={() => onEnregistrer({ sujet: sujet || null, contenu_final: contenu })}
          disabled={enCours || !contenu.trim()}
        >
          {enCours ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {enCours ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </motion.div>
  )
}
