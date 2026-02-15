import { Link } from '@tanstack/react-router'
import { Trophy, ChevronRight } from 'lucide-react'
import { MoodEmoji } from '../mood/MoodEmoji'
import { Card } from '../ui/Card'
import type { WeekOverview } from '../../server/functions/monthlySummaries'

type BestWorstWeekCardProps = {
  weeks: WeekOverview[]
}

type WeekHighlightProps = {
  week: WeekOverview
  label: string
  color: 'emerald' | 'violet'
}

const colorStyles = {
  emerald: {
    bg: 'bg-emerald-500/10 border-emerald-500/20 group-hover:bg-emerald-500/15 group-hover:border-emerald-500/30',
    text: 'text-emerald-400',
    chevron: 'text-emerald-400/50 group-hover:text-emerald-400',
  },
  violet: {
    bg: 'bg-violet-500/10 border-violet-500/20 group-hover:bg-violet-500/15 group-hover:border-violet-500/30',
    text: 'text-violet-400',
    chevron: 'text-violet-400/50 group-hover:text-violet-400',
  },
} as const

const WeekHighlight = ({ week, label, color }: WeekHighlightProps) => {
  const styles = colorStyles[color]
  const entryCount = week.entries.length

  return (
    <Link
      to="/timeline/$year/$week"
      params={{ year: String(week.year), week: String(week.week) }}
      className="group"
    >
      <div className={`rounded-2xl border p-3 sm:p-4 transition-all duration-200 ${styles.bg}`}>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-medium ${styles.text}`}>{label}</span>
          <ChevronRight className={`w-3.5 h-3.5 transition-colors ${styles.chevron}`} />
        </div>
        <div className="flex items-center gap-2 mb-1">
          <MoodEmoji mood={Math.round(week.averageMood!)} size="sm" showLabel={false} />
          <span className="text-lg font-bold text-white">V{week.week}</span>
        </div>
        <p className="text-xs text-slate-400">
          Snitt {week.averageMood!.toFixed(1)} · {entryCount} {entryCount === 1 ? 'dag' : 'dagar'}
        </p>
      </div>
    </Link>
  )
}

export const BestWorstWeekCard = ({ weeks }: BestWorstWeekCardProps) => {
  const weeksWithEntries = weeks.filter((week) => week.averageMood !== null)

  if (weeksWithEntries.length < 2) return null

  const bestWeek = weeksWithEntries.reduce((best, week) =>
    week.averageMood! > best.averageMood! ? week : best
  )

  const worstWeek = weeksWithEntries.reduce((worst, week) =>
    week.averageMood! < worst.averageMood! ? week : worst
  )

  if (bestWeek.week === worstWeek.week && bestWeek.year === worstWeek.year) return null

  return (
    <Card className="bg-gradient-to-br from-amber-500/8 via-slate-800/50 to-indigo-500/8 border-amber-500/15">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-slate-400">
          <Trophy className="w-4 h-4" />
          <h3 className="text-xs font-medium uppercase tracking-wider">Veckans toppar</h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <WeekHighlight week={bestWeek} label="Bästa veckan" color="emerald" />
          <WeekHighlight week={worstWeek} label="Tuffaste veckan" color="violet" />
        </div>
      </div>
    </Card>
  )
}
