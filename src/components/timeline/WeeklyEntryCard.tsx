import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { sv } from 'date-fns/locale'
import { Pencil } from 'lucide-react'
import type { Entry } from '../../server/db/schema'
import { MOODS } from '../../constants'
import { Card } from '../ui/Card'
import { MoodEmoji } from '../mood/MoodEmoji'
import { EditReflectionModal } from '../reflection/EditReflectionModal'
import { formatRelativeDay } from '../../utils/date'

type WeeklyEntryCardProps = {
  entry: Entry
  useRelativeDates?: boolean
  onUpdated?: (entry: Entry) => void
}

const getMoodCardClass = (mood: number): string => {
  const name = MOODS.find(m => m.value === mood)?.name || 'okay'
  return `card-mood-${name}`
}

export const WeeklyEntryCard = ({ entry, useRelativeDates, onUpdated }: WeeklyEntryCardProps) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const formattedDate = useRelativeDates
    ? formatRelativeDay(entry.date)
    : format(parseISO(entry.date), 'EEEE d MMMM', { locale: sv })

  return (
    <>
      <Card className={getMoodCardClass(entry.mood)}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-slate-500">
            {formattedDate}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 active:bg-slate-700/70 transition-all duration-200 hover:scale-105 active:scale-95"
              title="Redigera"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <MoodEmoji mood={entry.mood} size="md" layout="horizontal" />
          </div>
        </div>
        <p className="text-slate-300 leading-relaxed">{entry.summary}</p>
      </Card>

      <EditReflectionModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        entry={entry}
        onUpdated={(updated) => onUpdated?.(updated)}
      />
    </>
  )
}
