import { useState } from 'react'
import { MoodTrendHeatmap } from './MoodTrendHeatmap'
import { MoodTrendScatter } from './MoodTrendScatter'

export type TrendData = {
  date: string
  mood: number
}

type MoodTrendProps = {
  data: TrendData[]
}

type ViewMode = 'heatmap' | 'scatter'

export const MOOD_COLORS: Record<number, string> = {
  1: '#64748b',  // Slate - tung, dålig
  2: '#3b82f6',  // Blue - kall, nere
  3: '#eab308',  // Yellow - okej, neutral
  4: '#22c55e',  // Green - bra
  5: '#f472b6',  // Pink - jättebra, glad
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
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setViewMode('heatmap')}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors cursor-pointer ${
            viewMode === 'heatmap'
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-700/50 text-slate-400 hover:text-slate-200'
          }`}
        >
          Kalender
        </button>
        <button
          onClick={() => setViewMode('scatter')}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors cursor-pointer ${
            viewMode === 'scatter'
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-700/50 text-slate-400 hover:text-slate-200'
          }`}
        >
          Punkter
        </button>
      </div>

      {viewMode === 'heatmap' ? (
        <MoodTrendHeatmap data={data} />
      ) : (
        <MoodTrendScatter data={data} />
      )}
    </div>
  )
}
