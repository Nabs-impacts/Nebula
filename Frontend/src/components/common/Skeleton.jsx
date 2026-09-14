// Blocs de skeleton génériques. `Skeleton` est le primitif brut (une barre) ;
// les autres exports composent des formes prêtes à l'emploi pour les écrans
// les plus fréquents, afin de ne pas dupliquer la mise en page à chaque fois.

export function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />
}

export function SkeletonCard() {
  return (
    <div className="card flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 flex flex-col gap-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="h-5 w-20 shrink-0" />
      </div>
      <Skeleton className="h-3 w-1/2" />
      <div className="mt-1 flex items-center justify-between border-t border-border pt-2">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  )
}

export function SkeletonCardGrid({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

export function SkeletonStatCard() {
  return (
    <div className="card flex items-center gap-4 p-5">
      <Skeleton className="h-10 w-10 shrink-0 rounded-sm" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  )
}

export function SkeletonTableRow({ cols = 4 }) {
  return (
    <tr className="border-b border-border last:border-0">
      {Array.from({ length: cols }, (_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-3 w-full max-w-[140px]" />
        </td>
      ))}
    </tr>
  )
}

export function SkeletonBlock({ lines = 3 }) {
  return (
    <div className="card flex flex-col gap-2 p-5">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={`h-3 ${i === lines - 1 ? 'w-1/2' : 'w-full'}`} />
      ))}
    </div>
  )
}
