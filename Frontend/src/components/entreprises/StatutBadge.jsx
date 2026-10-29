import { STATUT_COLORS, STATUT_LABELS } from '../../utils/formatters'

export default function StatutBadge({ statut }) {
  const couleur = STATUT_COLORS[statut] ?? STATUT_COLORS.nouveau
  const label = STATUT_LABELS[statut] ?? statut

  return (
    <span
      className="mono-chip inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-sm border px-2 py-1 uppercase tracking-[0.08em]"
      style={{
        color: couleur.text,
        borderColor: couleur.ring,
        backgroundColor: couleur.bg,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: couleur.text }} />
      {label}
    </span>
  )
}
