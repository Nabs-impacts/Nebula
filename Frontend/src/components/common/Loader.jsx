export default function Loader({ label = 'Chargement…', taille = 'md' }) {
  const dimensions = { sm: 'h-4 w-4 border-2', md: 'h-6 w-6 border-2', lg: 'h-9 w-9 border-[3px]' }

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-muted">
      <span
        className={`inline-block animate-spin rounded-full border-neon/30 border-t-neon ${dimensions[taille]}`}
        role="status"
        aria-label={label}
      />
      <span className="font-mono text-xs">{label}</span>
    </div>
  )
}
