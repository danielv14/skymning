import { BarChart3 } from 'lucide-react'
import { MOODS } from '../../constants'
import { Card } from '../ui/Card'
import type { Entry } from '../../server/db/schema'

type MoodDistributionCardProps = {
  entries: Entry[]
}

export const MoodDistributionCard = ({ entries }: MoodDistributionCardProps) => {
  const counts = new Map<number, number>()
  for (const mood of MOODS) {
    counts.set(mood.value, 0)
  }
  for (const entry of entries) {
    counts.set(entry.mood, (counts.get(entry.mood) ?? 0) + 1)
  }

  const maxCount = Math.max(...Array.from(counts.values()))

  return (
    <Card className="bg-gradient-to-br from-violet-500/8 via-slate-800/50 to-pink-500/8 border-violet-500/15">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-slate-400">
          <BarChart3 className="w-4 h-4" />
          <h3 className="text-xs font-medium uppercase tracking-wider">Fördelning</h3>
        </div>

        <div className="space-y-2.5">
          {[...MOODS].reverse().map((mood) => {
            const count = counts.get(mood.value) ?? 0
            const percentage = entries.length > 0 ? (count / entries.length) * 100 : 0
            const barWidth = maxCount > 0 ? Math.max(count > 0 ? 8 : 0, (count / maxCount) * 100) : 0

            return (
              <div key={mood.value} className="flex items-center gap-3">
                <span className="text-xs text-slate-400 w-14 text-right shrink-0">
                  {mood.label}
                </span>
                <div className="flex-1 h-5 bg-slate-700/20 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${barWidth}%`,
                      backgroundColor: mood.color,
                      boxShadow: count > 0 ? `0 0 8px ${mood.color}30` : 'none',
                    }}
                  />
                </div>
                <span className="text-xs text-slate-500 w-10 shrink-0">
                  {count > 0 ? `${Math.round(percentage)}%` : '—'}
                </span>
              </div>
            )
          })}
        </div>

        <p className="text-xs text-slate-600 pt-1">
          {entries.length} {entries.length === 1 ? 'reflektion' : 'reflektioner'} totalt
        </p>
      </div>
    </Card>
  )
}
