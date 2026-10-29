import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Download,
  KanbanSquare,
  LayoutGrid,
  Loader2,
  Plus,
  Search,
  Upload,
} from 'lucide-react'
import EntrepriseList from '../components/entreprises/EntrepriseList'
import EntrepriseKanban from '../components/entreprises/EntrepriseKanban'
import EntrepriseForm from '../components/entreprises/EntrepriseForm'
import {
  useChangerStatutEntreprise,
  useCreerEntreprise,
  useExporterEntreprises,
  useImporterEntreprises,
  useListeEntreprises,
} from '../hooks/useEntreprises'
import { useToast } from '../components/common/Toast'
import { backdropVariants, modalVariants } from '../lib/motion'
import { PRIORITE_LABELS, STATUT_LABELS, TYPE_ENTREPRISE_LABELS } from '../utils/formatters'

export default function EntreprisesPage() {
  const [filtreStatut, setFiltreStatut] = useState('')
  const [filtreType, setFiltreType] = useState('')
  const [filtrePriorite, setFiltrePriorite] = useState('')
  const [filtreVille, setFiltreVille] = useState('')
  const [filtreTag, setFiltreTag] = useState('')
  const [recherche, setRecherche] = useState('')
  const [rechercheAppliquee, setRechercheAppliquee] = useState('')
  const [vue, setVue] = useState('liste')
  const [limit, setLimit] = useState(50)
  const [modaleOuverte, setModaleOuverte] = useState(false)
  const inputFichier = useRef(null)
  const toast = useToast()

  useEffect(() => {
    const minuteur = setTimeout(() => {
      setRechercheAppliquee(recherche.trim())
      setLimit(50)
    }, 300)
    return () => clearTimeout(minuteur)
  }, [recherche])

  const { data, isLoading, isError } = useListeEntreprises({
    statut: filtreStatut || undefined,
    type_entreprise: filtreType || undefined,
    priorite: filtrePriorite || undefined,
    ville: filtreVille.trim() || undefined,
    tag: filtreTag.trim() || undefined,
    q: rechercheAppliquee || undefined,
    limit,
  })

  const creerEntreprise = useCreerEntreprise()
  const changerStatut = useChangerStatutEntreprise()
  const importer = useImporterEntreprises()
  const exporter = useExporterEntreprises()

  const entreprises = data ?? []

  async function gererCreation(valeurs) {
    try {
      await creerEntreprise.mutateAsync(valeurs)
      setModaleOuverte(false)
      toast.succes(`« ${valeurs.nom} » a été ajoutée au pipeline.`)
    } catch {
      // l'erreur reste affichée dans le formulaire via erreurApi
    }
  }

  async function gererImport(e) {
    const fichier = e.target.files?.[0]
    e.target.value = ''
    if (!fichier) return
    try {
      const resultat = await importer.mutateAsync(fichier)
      toast.succes(
        `${resultat.crees} prospect${resultat.crees > 1 ? 's' : ''} importé${resultat.crees > 1 ? 's' : ''}` +
          (resultat.ignores ? `, ${resultat.ignores} ligne(s) ignorée(s).` : '.'),
      )
    } catch {
      toast.erreur("L'import CSV a échoué. Vérifiez les colonnes du fichier.")
    }
  }

  async function gererExport() {
    try {
      await exporter.mutateAsync()
      toast.succes('Export CSV généré.')
    } catch {
      toast.erreur("L'export CSV a échoué.")
    }
  }

  function changerStatutEntreprise(id, statut) {
    if (!statut) return
    changerStatut.mutate({ id, statut })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Pipeline</p>
          <h1 className="page-title">Entreprises</h1>
          <p className="mt-2 text-sm text-muted">
            Tous vos prospects Tenora, du premier contact à la conversion.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            ref={inputFichier}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={gererImport}
          />
          <button
            type="button"
            className="btn-secondary"
            onClick={() => inputFichier.current?.click()}
            disabled={importer.isPending}
          >
            {importer.isPending ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
            Importer
          </button>
          <button type="button" className="btn-secondary" onClick={gererExport} disabled={exporter.isPending}>
            {exporter.isPending ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
            Exporter
          </button>
          <button type="button" className="btn-primary" onClick={() => setModaleOuverte(true)}>
            <Plus size={16} /> Ajouter
          </button>
        </div>
      </div>

      <div className="card flex flex-col gap-3 p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/60" />
            <input
              className="input w-full pl-9"
              placeholder="Rechercher un nom, email, contact, ville…"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
            />
          </div>

          <div className="flex rounded-sm border border-border">
            <button
              type="button"
              onClick={() => setVue('liste')}
              className={`flex items-center gap-1.5 px-2.5 py-2 text-xs transition-colors ${
                vue === 'liste' ? 'bg-accent/10 text-accent' : 'text-muted hover:text-ink'
              }`}
              aria-label="Vue liste"
            >
              <LayoutGrid size={14} /> Liste
            </button>
            <button
              type="button"
              onClick={() => setVue('kanban')}
              className={`flex items-center gap-1.5 border-l border-border px-2.5 py-2 text-xs transition-colors ${
                vue === 'kanban' ? 'bg-accent/10 text-accent' : 'text-muted hover:text-ink'
              }`}
              aria-label="Vue kanban"
            >
              <KanbanSquare size={14} /> Kanban
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            className="input w-auto"
            value={filtreStatut}
            onChange={(e) => setFiltreStatut(e.target.value)}
          >
            <option value="">Tous les statuts</option>
            {Object.entries(STATUT_LABELS).map(([valeur, label]) => (
              <option key={valeur} value={valeur}>
                {label}
              </option>
            ))}
          </select>

          <select
            className="input w-auto"
            value={filtreType}
            onChange={(e) => setFiltreType(e.target.value)}
          >
            <option value="">Tous les types</option>
            {Object.entries(TYPE_ENTREPRISE_LABELS).map(([valeur, label]) => (
              <option key={valeur} value={valeur}>
                {label}
              </option>
            ))}
          </select>

          <select
            className="input w-auto"
            value={filtrePriorite}
            onChange={(e) => setFiltrePriorite(e.target.value)}
          >
            <option value="">Toutes les priorités</option>
            {Object.entries(PRIORITE_LABELS).map(([valeur, label]) => (
              <option key={valeur} value={valeur}>
                {label}
              </option>
            ))}
          </select>

          <input
            className="input w-32"
            placeholder="Ville"
            value={filtreVille}
            onChange={(e) => setFiltreVille(e.target.value)}
          />

          <input
            className="input w-36"
            placeholder="Tag"
            value={filtreTag}
            onChange={(e) => setFiltreTag(e.target.value)}
          />

          <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.14em] text-muted/60">
            {entreprises.length} affichée{entreprises.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {vue === 'liste' ? (
        <EntrepriseList
          entreprises={entreprises}
          chargement={isLoading}
          erreur={isError}
          onAjouter={() => setModaleOuverte(true)}
        />
      ) : (
        <EntrepriseKanban
          entreprises={entreprises}
          onChangerStatut={changerStatutEntreprise}
          enCours={changerStatut.isPending}
        />
      )}

      {entreprises.length >= limit && (
        <button
          type="button"
          className="btn-secondary self-center"
          onClick={() => setLimit((valeur) => valeur + 50)}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 size={14} className="animate-spin" /> : null}
          Charger plus
        </button>
      )}

      <AnimatePresence>
        {modaleOuverte && (
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-md"
            onClick={() => setModaleOuverte(false)}
            role="presentation"
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              className="card max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6 sm:p-7"
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="eyebrow mb-2">Nouveau prospect</p>
              <h2 className="section-title mb-5">Ajouter une entreprise</h2>
              <EntrepriseForm
                enCours={creerEntreprise.isPending}
                erreurApi={
                  creerEntreprise.isError
                    ? 'Impossible de créer l’entreprise. Vérifiez les champs et réessayez.'
                    : null
                }
                texteBouton="Créer"
                onSubmit={gererCreation}
                onAnnuler={() => setModaleOuverte(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
