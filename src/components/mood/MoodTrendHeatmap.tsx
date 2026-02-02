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
import { MOOD_COLORS, getMoodLabel } from '../../constants'
import type { TrendData } from './MoodTrend'

type MoodTrendHeatmapProps = {
  data: TrendData[]
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
                const isCurrentMonth = isSameMonth(day, currentMonth)
                const isDayToday = isToday(day)
                const isDayFuture = isFuture(day)

                return (
                  <div
                    key={dateStr}
                    className={`aspect-square rounded-lg flex items-center justify-center relative group cursor-default transition-all duration-200 ${
                      mood && isCurrentMonth ? 'hover:scale-105 hover:z-10' : ''
                    }`}
                    style={{
                      backgroundColor:
                        mood && isCurrentMonth
                          ? MOOD_COLORS[mood]
                          : isCurrentMonth && !isDayFuture
                            ? 'rgba(51, 65, 85, 0.3)'
                            : 'transparent',
                      boxShadow:
                        mood && isCurrentMonth
                          ? `0 2px 8px -2px ${MOOD_COLORS[mood]}40`
                          : 'none',
                    }}
                  >
                    <span
                      className={`text-sm font-medium ${
                        !isCurrentMonth
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
                    {mood && isCurrentMonth && (
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
    </div>
  )
}
