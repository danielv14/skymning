import { format } from 'date-fns'
import { sv } from 'date-fns/locale'
import { Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { MoodEmoji } from '../mood/MoodEmoji'
import { Card } from '../ui/Card'

type MonthComparisonCardProps = {
  currentAverage: number | null
  previousAverage: number | null
  previousMonth: Date
}

export const MonthComparisonCard = ({
  currentAverage,
  previousAverage,
  previousMonth,
}: MonthComparisonCardProps) => {
  const previousMonthLabel = format(previousMonth, 'MMMM', { locale: sv })

  const hasBothAverages = currentAverage !== null && previousAverage !== null
  const delta = hasBothAverages ? currentAverage - previousAverage : null
  const trend = delta !== null
    ? delta > 0.15 ? 'improving' : delta < -0.15 ? 'declining' : 'stable'
    : null

  const TrendIcon = trend === 'improving' ? TrendingUp : trend === 'declining' ? TrendingDown : Minus
  const trendColor = trend === 'improving' ? 'text-emerald-400' : trend === 'declining' ? 'text-violet-400' : 'text-cyan-400'
  const gradientClass = trend === 'improving'
    ? 'bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/10 border-emerald-500/20'
    : trend === 'declining'
      ? 'bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-slate-500/10 border-violet-500/20'
      : 'bg-gradient-to-br from-cyan-500/10 via-sky-500/5 to-slate-500/10 border-cyan-500/20'

  const deltaDisplay = delta !== null
    ? `${delta > 0 ? '+' : ''}${delta.toFixed(1)}`
    : null

  const trendLabel = trend === 'improving' ? 'Uppåt' : trend === 'declining' ? 'Nedåt' : 'Stabilt'

  return (
    <Card className={`h-full ${gradientClass}`}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 text-slate-400">
              {trend && <TrendIcon className={`w-4 h-4 ${trendColor}`} />}
              <h3 className="text-xs font-medium uppercase tracking-wider">Jämförelse</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Mot förra månaden</p>
          </div>
          {currentAverage !== null && (
            <MoodEmoji mood={Math.round(currentAverage)} size="sm" showLabel={false} />
          )}
        </div>

        {hasBothAverages ? (
          <div className="flex-1 space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">{currentAverage.toFixed(1)}</span>
              {deltaDisplay && (
                <span className={`text-sm font-semibold ${trendColor}`}>
                  {deltaDisplay}
                </span>
              )}
            </div>
            <div className="space-y-1">
              <p className={`text-sm font-medium ${trendColor}`}>{trendLabel}</p>
              <p className="text-xs text-slate-500">
                Jämfört med {previousMonthLabel} ({previousAverage.toFixed(1)})
              </p>
            </div>
          </div>
        ) : currentAverage !== null ? (
          <div className="flex-1 space-y-3">
            <span className="text-2xl font-bold text-white">{currentAverage.toFixed(1)}</span>
            <p className="text-xs text-slate-500">
              Ingen data från {previousMonthLabel} att jämföra med
            </p>
          </div>
        ) : (
          <div className="flex-1 flex items-center">
            <p className="text-sm text-slate-500">Inga reflektioner ännu denna månad</p>
          </div>
        )}
      </div>
    </Card>
  )
}
