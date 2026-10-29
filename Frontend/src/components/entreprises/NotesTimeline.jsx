import { useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, MessageSquarePlus, Trash2 } from 'lucide-react'
import { useCreerNote, useNotes, useSupprimerNote } from '../../hooks/useNotes'
import { useToast } from '../common/Toast'
import { formatDate } from '../../utils/formatters'
import { staggerContainer, staggerItem } from '../../lib/motion'

export default function NotesTimeline({ entrepriseId }) {
  const [contenu, setContenu] = useState('')
  const { data: notes = [], isLoading } = useNotes(entrepriseId)
  const creerNote = useCreerNote(entrepriseId)
  const supprimerNote = useSupprimerNote(entrepriseId)
  const toast = useToast()

  async function gererSubmit(e) {
    e.preventDefault()
    if (!contenu.trim()) return
    try {
      await creerNote.mutateAsync(contenu.trim())
      setContenu('')
      toast.succes('Note ajoutée.')
    } catch {
      toast.erreur("Impossible d'ajouter la note.")
    }
  }

  async function gererSuppression(id) {
    try {
      await supprimerNote.mutateAsync(id)
      toast.succes('Note supprimée.')
    } catch {
      toast.erreur('Impossible de supprimer la note.')
    }
  }

  return (
    <div className="card p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="section-title">Notes & suivi</h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted/60">
          {notes.length}
        </span>
      </div>

      <form onSubmit={gererSubmit} className="mb-4 flex flex-col gap-2">
        <textarea
          className="input min-h-[76px] resize-y"
          placeholder="Compte rendu d'appel, objection, prochaine étape…"
          value={contenu}
          onChange={(e) => setContenu(e.target.value)}
        />
        <button
          type="submit"
          className="btn-secondary self-end"
          disabled={creerNote.isPending || !contenu.trim()}
        >
          {creerNote.isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <MessageSquarePlus size={14} />
          )}
          Ajouter la note
        </button>
      </form>

      {isLoading && <p className="text-xs text-muted">Chargement…</p>}

      {!isLoading && notes.length === 0 && (
        <p className="rounded-sm border border-dashed border-border/70 px-3 py-4 text-center text-xs text-muted/60">
          Aucune note pour le moment.
        </p>
      )}

      <motion.ul
        variants={staggerContainer(0, 0.04)}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-2"
      >
        {notes.map((note) => (
          <motion.li
            key={note.id}
            variants={staggerItem}
            className="group rounded-sm border border-border/70 bg-surface-alt/30 p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink/85">{note.contenu}</p>
              <button
                type="button"
                className="shrink-0 text-muted/40 opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
                onClick={() => gererSuppression(note.id)}
                aria-label="Supprimer la note"
              >
                <Trash2 size={13} />
              </button>
            </div>
            <p className="mt-2 font-mono text-[10px] text-muted/60">{formatDate(note.date_creation)}</p>
          </motion.li>
        ))}
      </motion.ul>
    </div>
  )
}
