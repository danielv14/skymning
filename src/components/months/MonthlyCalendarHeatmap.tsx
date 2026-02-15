import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isToday,
  isFuture,
} from 'date-fns'
import { sv } from 'date-fns/locale'
import { CalendarDays } from 'lucide-react'
import { MOOD_COLORS, MOODS, getMoodLabel, getPeriodMoodDescription } from '../../constants'
import { MoodEmoji } from '../mood/MoodEmoji'
import { Card } from '../ui/Card'
import type { Entry } from '../../server/db/schema'

type MonthlyCalendarHeatmapProps = {
  year: number
  month: number
  entries: Entry[]
}

export const MonthlyCalendarHeatmap = ({ year, month, entries }: MonthlyCalendarHeatmapProps) => {
  const monthDate = new Date(year, month - 1, 1)
  const entryByDate = new Map(entries.map((entry) => [entry.date, entry.mood]))

  const monthStart = startOfMonth(monthDate)
  const monthEnd = endOfMonth(monthDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const weeks: Date[][] = []
  let currentDate = calendarStart

  while (currentDate <= calendarEnd) {
    const week: Date[] = []
    for (let i = 0; i < 7; i++) {
      week.push(currentDate)
      currentDate = addDays(currentDate, 1)
    }
    weeks.push(week)
  }

  const dayLabels = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön']

  const moods = entries.map((entry) => entry.mood)
  const average = moods.length > 0 ? moods.reduce((sum, m) => sum + m, 0) / moods.length : null
  const goodDays = moods.filter((m) => m >= 4).length
  const toughDays = moods.filter((m) => m <= 2).length

  return (
    <Card className="bg-gradient-to-br from-emerald-500/8 via-slate-800/50 to-cyan-500/8 border-emerald-500/15">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400">
            <CalendarDays className="w-4 h-4" />
            <h3 className="text-xs font-medium uppercase tracking-wider">Kalender</h3>
          </div>
          {average !== null && (
            <div className="flex items-center gap-2">
              <MoodEmoji mood={Math.round(average)} size="sm" showLabel={false} />
              <span className="text-xs text-slate-400">{getPeriodMoodDescription(average)}</span>
            </div>
          )}
        </div>

        {/* Day labels */}
        <div>
          <div className="grid grid-cols-7 mb-2">
            {dayLabels.map((day) => (
              <div key={day} className="text-xs text-slate-500 text-center font-medium py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Weeks */}
          <div className="grid gap-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 gap-1">
                {week.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd')
                  const mood = entryByDate.get(dateStr)
                  const isInCurrentMonth = isSameMonth(day, monthDate)
                  const isDayToday = isToday(day)
                  const isDayFuture = isFuture(day)

                  return (
                    <div
                      key={dateStr}
                      className={`aspect-square rounded-lg flex items-center justify-center relative group cursor-default transition-all duration-200 ${
                        mood && isInCurrentMonth ? 'hover:scale-105 hover:z-10' : ''
                      }`}
                      style={{
                        backgroundColor:
                          mood && isInCurrentMonth
                            ? MOOD_COLORS[mood]
                            : isInCurrentMonth && !isDayFuture
                              ? 'rgba(51, 65, 85, 0.3)'
                              : 'transparent',
                        boxShadow:
                          mood && isInCurrentMonth
                            ? `0 2px 8px -2px ${MOOD_COLORS[mood]}40`
                            : 'none',
                      }}
                    >
                      <span
                        className={`text-sm font-medium ${
                          !isInCurrentMonth
                            ? 'text-slate-700'
                            : isDayFuture
                              ? 'text-slate-600'
                              : mood
                                ? 'text-white/90'
                                : 'text-slate-400'
                        } ${isDayToday ? 'underline underline-offset-2' : ''}`}
                      >
                        {format(day, 'd')}
                      </span>

                      {/* Tooltip */}
                      {mood && isInCurrentMonth && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900/95 backdrop-blur-sm rounded-xl text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-20 border border-slate-700/50 shadow-xl scale-95 group-hover:scale-100">
                          <p className="text-slate-400 mb-0.5">
                            {format(day, 'd MMMM', { locale: sv })}
                          </p>
                          <p className="text-white font-medium">
                            {getMoodLabel(mood)}
                          </p>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                            <div className="w-2 h-2 bg-slate-900/95 border-r border-b border-slate-700/50 rotate-45" />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Footer stats + legend */}
        {(goodDays > 0 || toughDays > 0) && (
          <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-700/50">
            <div className="flex items-center gap-4">
              {goodDays > 0 && (
                <span className="text-slate-400">
                  <span className="text-emerald-400 font-medium">{goodDays}</span> bra {goodDays === 1 ? 'dag' : 'dagar'}
                </span>
              )}
              {toughDays > 0 && (
                <span className="text-slate-400">
                  <span className="text-violet-400 font-medium">{toughDays}</span> {toughDays === 1 ? 'tuff dag' : 'tuffa dagar'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
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
        )}
      </div>
    </Card>
  )
}
