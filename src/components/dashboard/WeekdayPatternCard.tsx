import { CalendarDays } from 'lucide-react'
import type { WeekdayPatternResult } from '../../server/functions/entries'
import { MOOD_COLORS } from '../../constants'
import { Card } from '../ui/Card'

type WeekdayPatternCardProps = {
  data: WeekdayPatternResult
}

// Reorder from date-fns getDay (0=Sunday) to Monday-first display
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0]
const SHORT_NAMES: Record<number, string> = {
  0: 'Sön',
  1: 'Mån',
  2: 'Tis',
  3: 'Ons',
  4: 'Tor',
  5: 'Fre',
  6: 'Lör',
}

const getMoodColor = (average: number): string => {
  const rounded = Math.round(average)
  const clamped = Math.max(1, Math.min(5, rounded))
  return MOOD_COLORS[clamped]
}

const capitalizeFirst = (str: string): string =>
  str.charAt(0).toUpperCase() + str.slice(1)

export const WeekdayPatternCard = ({ data }: WeekdayPatternCardProps) => {
  const { patterns, bestDay, worstDay } = data

  const patternsByDay = new Map(patterns.map((pattern) => [pattern.dayIndex, pattern]))

  const averages = patterns.map((pattern) => pattern.average)
  const minAverage = Math.min(...averages)
  const maxAverage = Math.max(...averages)
  const spread = maxAverage - minAverage

  return (
    <Card className="bg-gradient-to-br from-indigo-500/8 via-slate-800/50 to-cyan-500/8 border-indigo-500/15">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400">
            <CalendarDays className="w-4 h-4" />
            <h3 className="text-xs font-medium uppercase tracking-wider">Veckodagsmönster</h3>
          </div>
          <span className="text-xs text-slate-600">Senaste 90 dagarna</span>
        </div>

        {/* Bar chart */}
        <div className="flex items-end gap-1.5 sm:gap-2 h-20">
          {DISPLAY_ORDER.map((dayIndex) => {
            const pattern = patternsByDay.get(dayIndex)
            if (!pattern) {
              return (
                <div key={dayIndex} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t-md bg-slate-700/20 h-2" />
                  <span className="text-[10px] text-slate-600">{SHORT_NAMES[dayIndex]}</span>
                </div>
              )
            }

            // Relative scaling: worst day ~25%, best day 100%
            const MIN_HEIGHT = 25
            const normalized = spread > 0
              ? (pattern.average - minAverage) / spread
              : 0.5
            const heightPercent = MIN_HEIGHT + normalized * (100 - MIN_HEIGHT)
            const color = getMoodColor(pattern.average)
            const isBest = pattern.dayIndex === bestDay.dayIndex
            const isWorst = pattern.dayIndex === worstDay.dayIndex

            return (
              <div key={dayIndex} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div
                  className="w-full rounded-t-lg transition-all duration-300 group-hover:opacity-80"
                  style={{
                    height: `${heightPercent}%`,
                    backgroundColor: color,
                    boxShadow: isBest ? `0 0 12px ${color}40` : 'none',
                    minHeight: '4px',
                  }}
                />
                <span className={`text-[10px] sm:text-xs ${isBest || isWorst ? 'font-semibold text-slate-200' : 'text-slate-500'}`}>
                  {SHORT_NAMES[dayIndex]}
                </span>

                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-slate-900/95 backdrop-blur-sm rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-20 border border-slate-700/50 shadow-xl scale-95 group-hover:scale-100">
                  <p className="text-white font-medium">{pattern.average.toFixed(1)}</p>
                  <p className="text-slate-400">{pattern.count} {pattern.count === 1 ? 'dag' : 'dagar'}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Best/worst summary */}
        <div className="flex items-center justify-between text-sm pt-1 border-t border-slate-700/30">
          <span className="text-slate-400">
            Bäst på <span className="text-white font-medium">{capitalizeFirst(bestDay.dayName)}ar</span>
          </span>
          {bestDay.dayIndex !== worstDay.dayIndex && (
            <span className="text-slate-500 text-xs">
              Tuffast: {capitalizeFirst(worstDay.dayName)}ar
            </span>
          )}
        </div>
      </div>
    </Card>
  )
}
