import { MoodTrendHeatmap } from './MoodTrendHeatmap'

export type TrendData = {
  date: string
  mood: number
}

type MoodTrendProps = {
  data: TrendData[]
}

export const MoodTrend = ({ data }: MoodTrendProps) => {
  if (data.length === 0) {
    return (
      <p className="text-slate-500 text-center py-8">
        Ingen data att visa ännu
      </p>
    )
  }

  return <MoodTrendHeatmap data={data} />
}
