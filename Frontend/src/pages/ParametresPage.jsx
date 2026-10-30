import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Loader2, UserPlus } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { creerUtilisateur, listerUtilisateurs } from '../services/authService'
import { SkeletonTableRow } from '../components/common/Skeleton'
import { useToast } from '../components/common/Toast'
import { formatDateCourte } from '../utils/formatters'
import { fadeSlideUp, staggerContainer, staggerItem } from '../lib/motion'

function FormulaireNouvelUtilisateur({ onCree }) {
  const [valeurs, setValeurs] = useState({ nom: '', email: '', mot_de_passe: '', est_admin: false })
  const queryClient = useQueryClient()
  const toast = useToast()

  const mutation = useMutation({
    mutationFn: creerUtilisateur,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['utilisateurs'] })
      toast.succes(`Utilisateur « ${valeurs.nom} » créé.`)
      setValeurs({ nom: '', email: '', mot_de_passe: '', est_admin: false })
      onCree?.()
    },
    onError: () => toast.erreur('Impossible de créer cet utilisateur.'),
  })

  function gererSubmit(e) {
    e.preventDefault()
    mutation.mutate(valeurs)
  }

  return (
    <form onSubmit={gererSubmit} className="card flex flex-col gap-3 p-5">
      <h3 className="section-title text-base">Créer un utilisateur</h3>
      {mutation.isError && (
        <p className="text-xs text-danger">Impossible de créer cet utilisateur.</p>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          className="input"
          placeholder="Nom"
          autoComplete="name"
          value={valeurs.nom}
          onChange={(e) => setValeurs((v) => ({ ...v, nom: e.target.value }))}
          required
        />
        <input
          className="input"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          placeholder="Email"
          value={valeurs.email}
          onChange={(e) => setValeurs((v) => ({ ...v, email: e.target.value }))}
          required
        />
        <input
          className="input"
          type="password"
          autoComplete="new-password"
          placeholder="Mot de passe"
          value={valeurs.mot_de_passe}
          onChange={(e) => setValeurs((v) => ({ ...v, mot_de_passe: e.target.value }))}
          required
        />
        <label className="flex min-h-11 items-center gap-2 text-sm text-muted accent-accent">
          <input
            type="checkbox"
            checked={valeurs.est_admin}
            onChange={(e) => setValeurs((v) => ({ ...v, est_admin: e.target.checked }))}
          />
          Administrateur
        </label>
      </div>
      <button type="submit" className="btn-primary self-start" disabled={mutation.isPending}>
        {mutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
        {mutation.isPending ? 'Création…' : 'Créer'}
      </button>
    </form>
  )
}

function GestionUtilisateurs() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['utilisateurs'],
    queryFn: listerUtilisateurs,
  })

  return (
    <div className="flex flex-col gap-4">
      <FormulaireNouvelUtilisateur onCree={refetch} />

      {isError && <p className="text-sm text-danger">Impossible de charger les utilisateurs.</p>}

      {(isLoading || data) && (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border text-xs text-muted">
              <tr>
                <th className="px-4 py-2 font-normal">Nom</th>
                <th className="px-4 py-2 font-normal">Email</th>
                <th className="px-4 py-2 font-normal">Rôle</th>
                <th className="px-4 py-2 font-normal">Statut</th>
                <th className="px-4 py-2 font-normal">Créé le</th>
              </tr>
            </thead>
            <motion.tbody
              variants={staggerContainer(0, 0.04)}
              initial="hidden"
              animate="show"
            >
              {isLoading &&
                Array.from({ length: 3 }, (_, i) => <SkeletonTableRow key={i} cols={5} />)}
              {data?.map((u) => (
                <motion.tr
                  key={u.id}
                  variants={staggerItem}
                  className="border-b border-border transition-colors last:border-0 hover:bg-surface-alt"
                >
                  <td className="px-4 py-2.5 text-ink">{u.nom}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted">{u.email}</td>
                  <td className="px-4 py-2.5 text-muted">{u.est_admin ? 'Admin' : 'Membre'}</td>
                  <td className="px-4 py-2.5">
                    <span className={u.est_actif ? 'text-sage' : 'text-danger'}>
                      {u.est_actif ? 'Actif' : 'Désactivé'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted">
                    {formatDateCourte(u.date_creation)}
                  </td>
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function ParametresPage() {
  const { utilisateur } = useAuth()
  const [utilisateurLocal, setUtilisateurLocal] = useState(utilisateur)

  useEffect(() => setUtilisateurLocal(utilisateur), [utilisateur])

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="eyebrow mb-2">Compte</p>
        <h1 className="page-title">Paramètres</h1>
        <p className="mt-2 text-sm text-muted">Profil et gestion des accès.</p>
      </div>

      <motion.div variants={fadeSlideUp} initial="hidden" animate="show" className="card max-w-md p-5">
        <h2 className="section-title mb-4 text-base">Mon profil</h2>
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Nom</dt>
            <dd className="text-ink">{utilisateurLocal?.nom}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Email</dt>
            <dd className="font-mono text-xs text-ink">{utilisateurLocal?.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Rôle</dt>
            <dd className="text-ink">{utilisateurLocal?.est_admin ? 'Administrateur' : 'Membre'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Membre depuis</dt>
            <dd className="text-ink">{formatDateCourte(utilisateurLocal?.date_creation)}</dd>
          </div>
        </dl>
      </motion.div>

      {utilisateurLocal?.est_admin && (
        <div>
          <h2 className="section-title mb-3 text-lg">Utilisateurs</h2>
          <GestionUtilisateurs />
        </div>
      )}
    </div>
  )
}
