import { useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, Save, X } from 'lucide-react'
import { fadeSlideUp } from '../../lib/motion'

export default function MessageEditor({ message, enCours, onEnregistrer, onAnnuler }) {
  const [contenu, setContenu] = useState(message.contenu_final ?? message.contenu_genere)

  return (
    <motion.div variants={fadeSlideUp} initial="hidden" animate="show" className="card p-5">
      <p className="label">Corriger le message avant envoi</p>
      <textarea
        className="input min-h-[160px] resize-y font-sans"
        value={contenu}
        onChange={(e) => setContenu(e.target.value)}
        autoFocus
      />
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" className="btn-ghost" onClick={onAnnuler} disabled={enCours}>
          <X size={14} /> Annuler
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={() => onEnregistrer(contenu)}
          disabled={enCours || !contenu.trim()}
        >
          {enCours ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {enCours ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </motion.div>
  )
}
