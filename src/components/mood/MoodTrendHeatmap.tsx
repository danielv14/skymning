import { format, parseISO, startOfISOWeek, getISOWeek } from 'date-fns'
import { sv } from 'date-fns/locale'
import { getMoodLabel } from '../../constants'
import { MOOD_COLORS, type TrendData } from './MoodTrend'

type MoodTrendHeatmapProps = {
  data: TrendData[]
}

export const MoodTrendHeatmap = ({ data }: MoodTrendHeatmapProps) => {
  // Gruppera data per vecka (ISO-veckor, måndag först)
  const dataByDate = new Map(data.map((d) => [d.date, d.mood]))

  // Hitta min och max datum
  const dates = data.map((d) => parseISO(d.date))
  const minDate = new Date(Math.min(...dates.map((d) => d.getTime())))
  const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())))

  // Bygg upp veckor från första till sista datum
  const weeks: { weekNum: number; year: number; days: (TrendData | null)[] }[] =
    []

  const currentDate = startOfISOWeek(minDate)
  const endDate = new Date(maxDate)
  endDate.setDate(endDate.getDate() + 7) // Inkludera sista veckan

  while (currentDate <= endDate) {
    const weekNum = getISOWeek(currentDate)
    const year = currentDate.getFullYear()
    const days: (TrendData | null)[] = []

    // 7 dagar i veckan (mån-sön)
    for (let i = 0; i < 7; i++) {
      const dateStr = format(currentDate, 'yyyy-MM-dd')
      const mood = dataByDate.get(dateStr)

      if (mood !== undefined) {
        days.push({ date: dateStr, mood })
      } else {
        days.push(null)
      }

      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Lägg bara till veckan om den har minst en dag med data
    if (days.some((d) => d !== null)) {
      weeks.push({ weekNum, year, days })
    }
  }

  const dayLabels = ['M', 'T', 'O', 'T', 'F', 'L', 'S']

  return (
    <div className="space-y-2">
      {/* Dagnamn */}
      <div className="flex gap-1 ml-12">
        {dayLabels.map((day, i) => (
          <div key={i} className="w-8 h-4 text-xs text-slate-500 text-center">
            {day}
          </div>
        ))}
      </div>

      {/* Veckor */}
      <div className="space-y-1">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex items-center gap-1">
            <span className="w-10 text-xs text-slate-500 text-right pr-2">
              v{week.weekNum}
            </span>
            {week.days.map((day, dayIndex) => (
              <div
                key={dayIndex}
                className="w-8 h-8 rounded-md flex items-center justify-center relative group cursor-default"
                style={{
                  backgroundColor: day
                    ? MOOD_COLORS[day.mood]
                    : 'rgba(51, 65, 85, 0.3)',
                }}
              >
                {/* Tooltip */}
                {day && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-slate-700">
                    <p className="text-slate-400">
                      {format(parseISO(day.date), 'd MMM', { locale: sv })}
                    </p>
                    <p className="text-white">{getMoodLabel(day.mood)}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-2 pt-2">
        <span className="text-xs text-slate-500">Kass</span>
        {[1, 2, 3, 4, 5].map((mood) => (
          <div
            key={mood}
            className="w-4 h-4 rounded-sm"
            style={{ backgroundColor: MOOD_COLORS[mood] }}
          />
        ))}
        <span className="text-xs text-slate-500">Jättebra</span>
      </div>
    </div>
  )
}
