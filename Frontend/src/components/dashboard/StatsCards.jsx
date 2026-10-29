import { motion } from 'framer-motion'
import { Clock3, FilePenLine, MessageCircle, Send, TrendingUp, Building2 } from 'lucide-react'
import { formatPourcentage } from '../../utils/formatters'
import CountUp from '../common/CountUp'
import { staggerContainer, staggerItem } from '../../lib/motion'

function Carte({ icone: Icone, label, valeur, accent, formatter }) {
  return (
    <motion.div variants={staggerItem} className="card card-hover p-5">
      <div className="flex items-start justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">{label}</p>
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm"
          style={{ backgroundColor: `${accent}1a`, color: accent }}
        >
          <Icone size={15} strokeWidth={1.75} />
        </div>
      </div>
      <p className="mt-5 font-display text-4xl leading-none tracking-tight text-ink">
        <CountUp valeur={valeur} formatter={formatter} />
      </p>
    </motion.div>
  )
}

export default function StatsCards({ stats }) {
  return (
    <motion.div
      variants={staggerContainer(0, 0.06)}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
    >
      <Carte icone={Building2} label="Entreprises au total" valeur={stats.total_entreprises} accent="#9db4c0" />
      <Carte icone={Send} label="Messages envoyés" valeur={stats.messages_envoyes} accent="#e0a458" />
      <Carte icone={MessageCircle} label="Réponses" valeur={stats.reponses ?? 0} accent="#8fbf9f" />
      <Carte icone={Clock3} label="À relancer" valeur={stats.a_relancer ?? 0} accent="#e2725b" />
      <Carte icone={FilePenLine} label="Brouillons à valider" valeur={stats.brouillons ?? 0} accent="#c9a87c" />
      <Carte
        icone={TrendingUp}
        label="Taux de conversion"
        valeur={stats.taux_conversion_pourcent}
        formatter={formatPourcentage}
        accent="#8fbf9f"
      />
    </motion.div>
  )
}
