import { MoodEmoji } from '../mood/MoodEmoji'
import { Card } from '../ui/Card'
import { getPeriodMoodDescription } from '../../constants/mood'

type RecentMoodCardProps = {
  average: number
}

export const RecentMoodCard = ({ average }: RecentMoodCardProps) => {
  return (
    <Card className="bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border-indigo-500/20">
      <div className="flex items-center gap-4">
        <MoodEmoji mood={Math.round(average)} size="lg" showLabel={false} />
        <div>
          <p className="text-lg font-semibold text-white">
            {getPeriodMoodDescription(average)}
          </p>
          <p className="text-slate-400 text-sm">Senaste 7 dagarna</p>
        </div>
      </div>
    </Card>
  )
}
