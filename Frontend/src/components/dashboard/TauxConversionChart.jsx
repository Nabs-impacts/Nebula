import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { motion } from 'framer-motion'
import { CANAL_LABELS, STATUT_COLORS, STATUT_LABELS } from '../../utils/formatters'
import { staggerContainer, staggerItem } from '../../lib/motion'

const COULEURS_CANAUX = ['#22d3ee', '#a78bfa', '#39ff88', '#ffb454']

function InfoBulle({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-sm border border-border bg-surface-alt px-3 py-2 font-mono text-xs text-ink">
      <p>{label}</p>
      <p className="text-neon">{payload[0].value}</p>
    </div>
  )
}

export default function TauxConversionChart({ repartitionStatuts = {}, repartitionCanaux = {} }) {
  const donneesStatuts = Object.entries(repartitionStatuts).map(([statut, valeur]) => ({
    statut,
    label: STATUT_LABELS[statut] ?? statut,
    valeur,
    couleur: STATUT_COLORS[statut]?.text ?? '#7c928e',
  }))

  const donneesCanaux = Object.entries(repartitionCanaux).map(([canal, valeur]) => ({
    name: CANAL_LABELS[canal] ?? canal,
    value: valeur,
  }))

  return (
    <motion.div
      variants={staggerContainer(0.1, 0.08)}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-4 lg:grid-cols-5"
    >
      <motion.div variants={staggerItem} className="card p-5 lg:col-span-3">
        <h2 className="mb-4 text-sm font-medium text-ink">Répartition par statut</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={donneesStatuts} margin={{ left: -20 }}>
            <XAxis
              dataKey="label"
              tick={{ fill: '#7c928e', fontSize: 11 }}
              angle={-25}
              textAnchor="end"
              interval={0}
              height={60}
            />
            <YAxis tick={{ fill: '#7c928e', fontSize: 11 }} allowDecimals={false} />
            <Tooltip content={<InfoBulle />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            <Bar dataKey="valeur" radius={[3, 3, 0, 0]}>
              {donneesStatuts.map((entree) => (
                <Cell key={entree.statut} fill={entree.couleur} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div variants={staggerItem} className="card p-5 lg:col-span-2">
        <h2 className="mb-4 text-sm font-medium text-ink">Répartition par canal</h2>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={donneesCanaux}
              dataKey="value"
              nameKey="name"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={3}
            >
              {donneesCanaux.map((entree, index) => (
                <Cell key={entree.name} fill={COULEURS_CANAUX[index % COULEURS_CANAUX.length]} />
              ))}
            </Pie>
            <Tooltip content={<InfoBulle />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-2 flex flex-wrap justify-center gap-3 font-mono text-[11px] text-muted">
          {donneesCanaux.map((entree, index) => (
            <span key={entree.name} className="inline-flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: COULEURS_CANAUX[index % COULEURS_CANAUX.length] }}
              />
              {entree.name} ({entree.value})
            </span>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
