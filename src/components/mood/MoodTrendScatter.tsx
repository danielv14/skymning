import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { sv } from 'date-fns/locale'
import { getMoodIcon } from './MoodIcons'
import { MOOD_COLORS, getMoodLabel } from '../../constants'
import type { TrendData } from './MoodTrend'

type MoodTrendScatterProps = {
  data: TrendData[]
}

const MoodIcon = ({ mood, size = 14 }: { mood: number; size?: number }) => {
  const IconComponent = getMoodIcon(mood)
  return <IconComponent size={size} />
}

export const MoodTrendScatter = ({ data }: MoodTrendScatterProps) => {
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
            tickFormatter={(index: number) =>
              formattedData[index]?.displayDate || ''
            }
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
              <Cell key={index} fill={MOOD_COLORS[entry.mood]} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
