import { Check, CheckCheck, Inbox, Loader2 } from 'lucide-react'
import { useMarquerReponseLue, useMarquerToutesReponsesLues, useReponsesEntreprise } from '../../hooks/useReponses'
import { formatDateCourte } from '../../utils/formatters'

export default function ReponsesRecuesSection({ entrepriseId }) {
  const { data: reponses = [], isLoading } = useReponsesEntreprise(entrepriseId)
  const marquerLue = useMarquerReponseLue(entrepriseId)
  const marquerToutesLues = useMarquerToutesReponsesLues(entrepriseId)

  const nonLues = reponses.filter((r) => !r.lu)

  return (
    <div className="card flex flex-col gap-4 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-sm bg-accent/10 text-accent">
            <Inbox size={15} />
          </span>
          <div>
            <h2 className="section-title text-base">Réponses reçues</h2>
            <p className="font-mono text-[10px] text-muted">
              {reponses.length} réponse{reponses.length > 1 ? 's' : ''} détectée{reponses.length > 1 ? 's' : ''}
              {nonLues.length > 0 && ` (${nonLues.length} non lue${nonLues.length > 1 ? 's' : ''})`}
            </p>
          </div>
        </div>

        {nonLues.length > 1 && (
          <button
            type="button"
            onClick={() => marquerToutesLues.mutate()}
            disabled={marquerToutesLues.isPending}
            className="btn-ghost text-xs"
          >
            {marquerToutesLues.isPending ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <CheckCheck size={13} />
            )}
            Tout marquer comme lu
          </button>
        )}
      </div>

      {isLoading && (
        <p className="py-4 text-center font-mono text-xs text-muted">Chargement des réponses…</p>
      )}

      {!isLoading && reponses.length === 0 && (
        <div className="py-4 text-center">
          <p className="text-xs text-muted/70">Aucune réponse reçue pour cette entreprise.</p>
          <p className="mt-1 text-[11px] text-muted/50">
            Les réponses envoyées à l'adresse de contact seront automatiquement relevées.
          </p>
        </div>
      )}

      {!isLoading && reponses.length > 0 && (
        <div className="flex flex-col gap-3">
          {reponses.map((reponse) => (
            <div
              key={reponse.id}
              className={`rounded-sm border p-4 transition-colors ${
                reponse.lu
                  ? 'border-border/60 bg-surface-alt/20'
                  : 'border-accent/40 bg-accent/[0.04]'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {!reponse.lu && (
                      <span
                        className="h-2 w-2 shrink-0 rounded-full bg-accent"
                        title="Non lu"
                      />
                    )}
                    <p className="truncate font-medium text-sm text-ink">
                      {reponse.objet || '(Sans objet)'}
                    </p>
                  </div>
                  <p className="mt-0.5 truncate font-mono text-[11px] text-muted">
                    De : {reponse.expediteur} · {formatDateCourte(reponse.recu_le)}
                  </p>
                </div>

                {!reponse.lu ? (
                  <button
                    type="button"
                    onClick={() => marquerLue.mutate(reponse.id)}
                    disabled={marquerLue.isPending}
                    className="btn-secondary shrink-0 py-1 px-2.5 text-xs"
                    title="Marquer comme lu"
                  >
                    {marquerLue.isPending ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Check size={12} />
                    )}
                    Marquer lu
                  </button>
                ) : (
                  <span className="shrink-0 font-mono text-[10px] text-muted/60">Lu</span>
                )}
              </div>

              {/* Contenu affiché strictement en texte brut (protection contre toute injection et traité comme donnée) */}
              <div className="mt-3 rounded-sm bg-bg/50 p-3 font-sans text-xs leading-relaxed text-ink/90 whitespace-pre-wrap select-text break-words border border-border/40">
                {reponse.extrait || '(Message vide)'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
