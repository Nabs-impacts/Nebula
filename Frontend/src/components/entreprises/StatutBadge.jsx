import { STATUT_COLORS, STATUT_LABELS } from '../../utils/formatters'

export default function StatutBadge({ statut }) {
  const couleur = STATUT_COLORS[statut] ?? STATUT_COLORS.nouveau
  const label = STATUT_LABELS[statut] ?? statut

  return (
    <span
      className="mono-chip inline-flex items-center gap-1.5 rounded-sm border px-2 py-1"
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
