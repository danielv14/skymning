import { format, parseISO } from 'date-fns'
import { sv } from 'date-fns/locale'
import type { Entry } from '../../server/db/schema'
import { Card } from '../ui/Card'
import { MoodEmoji } from '../mood/MoodEmoji'

type WeeklyEntryCardProps = {
  entry: Entry
}

export const WeeklyEntryCard = ({ entry }: WeeklyEntryCardProps) => {
  return (
    <Card>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-slate-500 capitalize">
          {format(parseISO(entry.date), 'EEEE d MMMM', { locale: sv })}
        </p>
        <MoodEmoji mood={entry.mood} size="md" layout="horizontal" />
      </div>
      <p className="text-slate-300">{entry.summary}</p>
    </Card>
  )
}
