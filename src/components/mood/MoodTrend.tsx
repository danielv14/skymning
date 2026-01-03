import { useState } from 'react'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { MOOD_ICONS } from './MoodIcons'
import { getMoodLabel } from '../../constants'
import { format, parseISO, startOfISOWeek, getISOWeek } from 'date-fns'
import { sv } from 'date-fns/locale'

type TrendData = {
  date: string
  mood: number
}

type MoodTrendProps = {
  data: TrendData[]
}

type ViewMode = 'heatmap' | 'scatter'

const MOOD_COLORS: Record<number, string> = {
  1: '#6366f1', // indigo - kass
  2: '#818cf8', // indigo lighter
  3: '#a5b4fc', // indigo lightest
  4: '#c4b5fd', // violet light
  5: '#e879f9', // fuchsia - jättebra
}

const MoodIcon = ({ mood, size = 14 }: { mood: number; size?: number }) => {
  const IconComponent = MOOD_ICONS[mood as keyof typeof MOOD_ICONS] || MOOD_ICONS[3]
  return <IconComponent size={size} />
}

export const MoodTrend = ({ data }: MoodTrendProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>('heatmap')

  if (data.length === 0) {
    return (
      <p className="text-slate-500 text-center py-8">
        Ingen data att visa ännu
      </p>
    )
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setViewMode('heatmap')}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors cursor-pointer ${
            viewMode === 'heatmap'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-700/50 text-slate-400 hover:text-slate-200'
          }`}
        >
          Kalender
        </button>
        <button
          onClick={() => setViewMode('scatter')}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors cursor-pointer ${
            viewMode === 'scatter'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-700/50 text-slate-400 hover:text-slate-200'
          }`}
        >
          Punkter
        </button>
      </div>

      {viewMode === 'heatmap' ? (
        <HeatmapView data={data} />
      ) : (
        <ScatterView data={data} />
      )}
    </div>
  )
}

const HeatmapView = ({ data }: { data: TrendData[] }) => {
  // Gruppera data per vecka (ISO-veckor, måndag först)
  const dataByDate = new Map(data.map((d) => [d.date, d.mood]))
  
  // Hitta min och max datum
  const dates = data.map((d) => parseISO(d.date))
  const minDate = new Date(Math.min(...dates.map((d) => d.getTime())))
  const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())))
  
  // Bygg upp veckor från första till sista datum
  const weeks: { weekNum: number; year: number; days: (TrendData | null)[] }[] = []
  
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
          <div
            key={i}
            className="w-8 h-4 text-xs text-slate-500 text-center"
          >
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
                  backgroundColor: day ? MOOD_COLORS[day.mood] : 'rgba(51, 65, 85, 0.3)',
                }}
              >
                {/* Tooltip */}
                {day && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-slate-700">
                    <p className="text-slate-400">
                      {format(parseISO(day.date), 'd MMM', { locale: sv })}
                    </p>
                    <p className="text-white">
                      {getMoodLabel(day.mood)}
                    </p>
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

const ScatterView = ({ data }: { data: TrendData[] }) => {
  const formattedData = data.map((d, index) => ({
    ...d,
    index,
    displayDate: format(parseISO(d.date), 'd MMM', { locale: sv }),
  }))

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean
    payload?: Array<{ payload: TrendData & { displayDate: string } }>
  }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload
      return (
        <div className="bg-slate-800 rounded-xl p-3 shadow-lg border border-slate-700">
          <p className="text-sm text-slate-400">{item.displayDate}</p>
          <p className="text-lg text-white flex items-center gap-2">
            <MoodIcon mood={item.mood} size={20} />
            {getMoodLabel(item.mood)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="index"
            type="number"
            domain={[0, data.length - 1]}
            tick={{ fontSize: 12, fill: '#64748b' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(index: number) => formattedData[index]?.displayDate || ''}
            interval="preserveStartEnd"
          />
          <YAxis
            dataKey="mood"
            type="number"
            domain={[0.5, 5.5]}
            ticks={[1, 2, 3, 4, 5]}
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickLine={false}
            axisLine={false}
            width={65}
            tickFormatter={(value: number) => getMoodLabel(value)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Scatter data={formattedData} fill="#6366f1">
            {formattedData.map((entry, index) => (
              <Cell
                key={index}
                fill={MOOD_COLORS[entry.mood]}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
