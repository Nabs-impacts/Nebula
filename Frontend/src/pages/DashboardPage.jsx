import { useStatsDashboard } from '../hooks/useEntreprises'
import StatsCards from '../components/dashboard/StatsCards'
import Cockpit from '../components/dashboard/Cockpit'
import TauxConversionChart from '../components/dashboard/TauxConversionChart'
import { SkeletonStatCard, SkeletonBlock } from '../components/common/Skeleton'

export default function DashboardPage() {
  const { data: stats, isLoading, isError } = useStatsDashboard()

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="eyebrow mb-2">Vue d’ensemble</p>
        <h1 className="page-title">Dashboard</h1>
        <p className="mt-2 text-sm text-muted">La prospection Tenora, en un regard.</p>
      </div>

      {isLoading && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <SkeletonStatCard key={i} />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <SkeletonBlock lines={5} />
            </div>
            <div className="lg:col-span-2">
              <SkeletonBlock lines={5} />
            </div>
          </div>
        </>
      )}

      {isError && !isLoading && (
        <p className="card border-danger/40 p-4 text-sm text-danger">
          Impossible de charger les statistiques du dashboard.
        </p>
      )}

      {stats && (
        <>
          <StatsCards stats={stats} />
          <Cockpit />
          <TauxConversionChart
            repartitionStatuts={stats.repartition_statuts}
            repartitionCanaux={stats.repartition_canaux}
          />
        </>
      )}
    </div>
  )
}
