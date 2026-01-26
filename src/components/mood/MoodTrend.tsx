import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { MOODS, getPeriodMoodDescription } from '../../constants'
import { MoodEmoji } from './MoodEmoji'
import { MoodTrendHeatmap } from './MoodTrendHeatmap'

export type TrendData = {
  date: string
  mood: number
}

type MoodTrendProps = {
  data: TrendData[]
}

type TrendDirection = 'up' | 'down' | 'stable'

const calculateStats = (data: TrendData[]) => {
  if (data.length === 0) return null

  const moods = data.map((d) => d.mood)
  const average = moods.reduce((sum, m) => sum + m, 0) / moods.length

  // Calculate trend by comparing recent half vs older half
  const halfIndex = Math.floor(moods.length / 2)
  const recentHalf = moods.slice(halfIndex)
  const olderHalf = moods.slice(0, halfIndex)

  const recentAverage = recentHalf.reduce((sum, m) => sum + m, 0) / recentHalf.length
  const olderAverage = olderHalf.reduce((sum, m) => sum + m, 0) / olderHalf.length

  const difference = recentAverage - olderAverage
  let trend: TrendDirection = 'stable'
  if (difference > 0.3) trend = 'up'
  else if (difference < -0.3) trend = 'down'

  // Count mood categories
  const goodDays = moods.filter((m) => m >= 4).length
  const toughDays = moods.filter((m) => m <= 2).length

  return {
    average,
    trend,
    goodDays,
    toughDays,
    totalDays: moods.length,
  }
}

const TrendIcon = ({ trend }: { trend: TrendDirection }) => {
  const iconClass = 'w-4 h-4'
  switch (trend) {
    case 'up':
      return <TrendingUp className={iconClass} />
    case 'down':
      return <TrendingDown className={iconClass} />
    case 'stable':
      return <Minus className={iconClass} />
  }
}

const getTrendColor = (trend: TrendDirection): string => {
  switch (trend) {
    case 'up':
      return 'text-emerald-400'
    case 'down':
      return 'text-violet-400'
    case 'stable':
      return 'text-cyan-400'
  }
}

const getTrendLabel = (trend: TrendDirection): string => {
  switch (trend) {
    case 'up':
      return 'Uppåt'
    case 'down':
      return 'Nedåt'
    case 'stable':
      return 'Stabilt'
  }
}

export const MoodTrend = ({ data }: MoodTrendProps) => {
  if (data.length === 0) {
    return (
      <p className="text-slate-500 text-center py-8">
        Ingen data att visa ännu
      </p>
    )
  }

  const stats = calculateStats(data)
  if (!stats) return null

  const roundedMood = Math.round(stats.average)
  const description = getPeriodMoodDescription(stats.average)
  const trendColor = getTrendColor(stats.trend)

  return (
    <div className="space-y-5">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <MoodEmoji mood={roundedMood} size="lg" showLabel={false} />
          <div>
            <p className="text-white font-medium">{description}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className={`flex items-center gap-1 text-sm ${trendColor}`}>
                <TrendIcon trend={stats.trend} />
                {getTrendLabel(stats.trend)}
              </span>
              <span className="text-slate-500 text-sm">
                {stats.totalDays} dagar
              </span>
            </div>
          </div>
        </div>

        {/* Mini legend */}
        <div className="hidden sm:flex items-center gap-1.5">
          {MOODS.map(({ value, color, label }) => (
            <div
              key={value}
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: color }}
              title={label}
            />
          ))}
        </div>
      </div>

      {/* Heatmap */}
      <MoodTrendHeatmap data={data} />

      {/* Footer stats */}
      <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-700/50">
        <div className="flex items-center gap-4">
          {stats.goodDays > 0 && (
            <span className="text-slate-400">
              <span className="text-emerald-400 font-medium">{stats.goodDays}</span> bra {stats.goodDays === 1 ? 'dag' : 'dagar'}
            </span>
          )}
          {stats.toughDays > 0 && (
            <span className="text-slate-400">
              <span className="text-violet-400 font-medium">{stats.toughDays}</span> tuffa {stats.toughDays === 1 ? 'dag' : 'dagar'}
            </span>
          )}
        </div>
        {/* Mobile legend */}
        <div className="flex sm:hidden items-center gap-1">
          {MOODS.map(({ value, color, label }) => (
            <div
              key={value}
              className="w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: color }}
              title={label}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
