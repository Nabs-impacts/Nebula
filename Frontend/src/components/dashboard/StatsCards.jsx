import { motion } from 'framer-motion'
import { Building2, Send, TrendingUp, XCircle } from 'lucide-react'
import { formatPourcentage } from '../../utils/formatters'
import CountUp from '../common/CountUp'
import { staggerContainer, staggerItem } from '../../lib/motion'

function Carte({ icone: Icone, label, valeur, accent, formatter }) {
  return (
    <motion.div variants={staggerItem} className="card flex items-center gap-4 p-5">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm"
        style={{ backgroundColor: `${accent}1a`, color: accent }}
      >
        <Icone size={18} />
      </div>
      <div>
        <p className="font-mono text-2xl leading-none text-ink">
          <CountUp valeur={valeur} formatter={formatter} />
        </p>
        <p className="mt-1.5 text-xs text-muted">{label}</p>
      </div>
    </motion.div>
  )
}

export default function StatsCards({ stats }) {
  return (
    <motion.div
      variants={staggerContainer(0, 0.06)}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      <Carte icone={Building2} label="Entreprises au total" valeur={stats.total_entreprises} accent="#22d3ee" />
      <Carte icone={Send} label="Messages envoyés" valeur={stats.messages_envoyes} accent="#a78bfa" />
      <Carte
        icone={TrendingUp}
        label="Taux de conversion"
        valeur={stats.taux_conversion_pourcent}
        formatter={formatPourcentage}
        accent="#39ff88"
      />
      <Carte icone={XCircle} label="Messages échoués" valeur={stats.messages_echoues} accent="#ff5470" />
    </motion.div>
  )
}
