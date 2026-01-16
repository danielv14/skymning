import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { sv } from 'date-fns/locale'
import { Pencil } from 'lucide-react'
import type { Entry } from '../../server/db/schema'
import { Card } from '../ui/Card'
import { MoodEmoji } from '../mood/MoodEmoji'
import { EditReflectionModal } from '../reflection/EditReflectionModal'

type WeeklyEntryCardProps = {
  entry: Entry
  onUpdated?: (entry: Entry) => void
}

export const WeeklyEntryCard = ({ entry, onUpdated }: WeeklyEntryCardProps) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  return (
    <>
      <Card>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-slate-500 capitalize">
            {format(parseISO(entry.date), 'EEEE d MMMM', { locale: sv })}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
              title="Redigera"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <MoodEmoji mood={entry.mood} size="md" layout="horizontal" />
          </div>
        </div>
        <p className="text-slate-300">{entry.summary}</p>
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
