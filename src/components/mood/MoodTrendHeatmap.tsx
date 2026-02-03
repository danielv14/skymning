import { useState } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isToday,
  isFuture,
} from 'date-fns'
import { sv } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { MOOD_COLORS, MOODS, getMoodLabel, getPeriodMoodDescription } from '../../constants'
import { MoodEmoji } from './MoodEmoji'
import type { TrendData } from './MoodTrend'

type MoodTrendHeatmapProps = {
  data: TrendData[]
}

const calculateMonthStats = (data: TrendData[], month: Date) => {
  const monthEntries = data.filter((d) => {
    const entryDate = new Date(d.date)
    return isSameMonth(entryDate, month)
  })

  if (monthEntries.length === 0) return null

  const moods = monthEntries.map((d) => d.mood)
  const average = moods.reduce((sum, m) => sum + m, 0) / moods.length
  const goodDays = moods.filter((m) => m >= 4).length
  const toughDays = moods.filter((m) => m <= 2).length

  return {
    average,
    goodDays,
    toughDays,
    totalDays: moods.length,
  }
}

export const MoodTrendHeatmap = ({ data }: MoodTrendHeatmapProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const dataByDate = new Map(data.map((d) => [d.date, d.mood]))

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
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

  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const goToToday = () => setCurrentMonth(new Date())

  const canGoNext = !isSameMonth(currentMonth, new Date())

  const dayLabels = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön']

  const stats = calculateMonthStats(data, currentMonth)

  return (
    <div className="space-y-4">
      {/* Month header with navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={goToPreviousMonth}
          className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
          aria-label="Föregående månad"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={goToToday}
          className="text-lg font-semibold text-white capitalize hover:text-emerald-400 transition-colors"
        >
          {format(currentMonth, 'MMMM yyyy', { locale: sv })}
        </button>

        <button
          onClick={goToNextMonth}
          disabled={!canGoNext}
          className={`p-1.5 rounded-lg transition-colors ${
            canGoNext
              ? 'hover:bg-slate-700/50 text-slate-400 hover:text-white'
              : 'text-slate-700 cursor-not-allowed'
          }`}
          aria-label="Nästa månad"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Month stats */}
      {stats && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MoodEmoji mood={Math.round(stats.average)} size="md" showLabel={false} />
            <div>
              <p className="text-white font-medium text-sm">{getPeriodMoodDescription(stats.average)}</p>
              <p className="text-slate-500 text-xs">{stats.totalDays} {stats.totalDays === 1 ? 'dag loggad' : 'dagar loggade'}</p>
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
      )}

      {/* Calendar grid */}
      <div>
        {/* Day labels */}
        <div className="grid grid-cols-7 mb-2">
          {dayLabels.map((day) => (
            <div
              key={day}
              className="text-xs text-slate-500 text-center font-medium py-1"
            >
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
                const mood = dataByDate.get(dateStr)
                const isInCurrentMonth = isSameMonth(day, currentMonth)
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

      {/* Footer stats */}
      {stats && (stats.goodDays > 0 || stats.toughDays > 0) && (
        <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-700/50">
          <div className="flex items-center gap-4">
            {stats.goodDays > 0 && (
              <span className="text-slate-400">
                <span className="text-emerald-400 font-medium">{stats.goodDays}</span> bra {stats.goodDays === 1 ? 'dag' : 'dagar'}
              </span>
            )}
            {stats.toughDays > 0 && (
              <span className="text-slate-400">
                <span className="text-violet-400 font-medium">{stats.toughDays}</span> {stats.toughDays === 1 ? 'tuff dag' : 'tuffa dagar'}
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
      )}
    </div>
  )
}
