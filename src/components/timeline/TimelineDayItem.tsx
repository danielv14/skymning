import { useState } from 'react'
import { format, parseISO, isFuture, differenceInDays, startOfDay } from 'date-fns'
import { sv } from 'date-fns/locale'
import { Link } from '@tanstack/react-router'
import { Pencil } from 'lucide-react'
import type { Entry } from '../../server/db/schema'
import { MOODS } from '../../constants'
import { Card } from '../ui/Card'
import { MoodEmoji } from '../mood/MoodEmoji'
import { EditReflectionModal } from '../reflection/EditReflectionModal'
import { ExpandableText } from '../ui/ExpandableText'
import { formatRelativeDay } from '../../utils/date'

type TimelineDayItemProps = {
  date: string
  entry: Entry | null
  useRelativeDates?: boolean
}

const getMoodCardClass = (mood: number): string => {
  const name = MOODS.find(m => m.value === mood)?.name || 'okay'
  return `card-mood-${name}`
}

const getMoodColor = (mood: number): string => {
  return MOODS.find(m => m.value === mood)?.color || '#64748b'
}

const MAX_DAYS_TO_FILL_IN = 5

export const TimelineDayItem = ({ date, entry, useRelativeDates }: TimelineDayItemProps) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const parsedDate = parseISO(date)
  const isFutureDay = isFuture(parsedDate)
  const daysAgo = differenceInDays(startOfDay(new Date()), startOfDay(parsedDate))
  const canFillIn = !isFutureDay && daysAgo <= MAX_DAYS_TO_FILL_IN
  const dayAbbrev = format(parsedDate, 'EEEEE', { locale: sv }).toUpperCase()

  const formattedDate = useRelativeDates
    ? formatRelativeDay(date)
    : format(parsedDate, 'EEE d MMM', { locale: sv })

  if (entry) {
    return (
      <>
        <div className="timeline-item">
          <div
            className="timeline-dot has-entry"
            style={{ '--dot-color': getMoodColor(entry.mood) } as React.CSSProperties}
          >
            <span className="text-xs font-bold text-slate-300">{dayAbbrev}</span>
          </div>
          <Card className={getMoodCardClass(entry.mood)}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-500 capitalize">{formattedDate}</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 active:bg-slate-700/70 transition-all duration-200"
                  title="Redigera"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <MoodEmoji mood={entry.mood} size="md" layout="horizontal" />
              </div>
            </div>
            <ExpandableText lines={3} className="text-slate-300 leading-relaxed">
              {entry.summary}
            </ExpandableText>
          </Card>
        </div>

        <EditReflectionModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          entry={entry}
        />
      </>
    )
  }

  return (
    <div className="timeline-item">
      <div className="timeline-dot empty">
        <span className="text-xs font-medium text-slate-500">{dayAbbrev}</span>
      </div>
      <div className="py-3 px-4 rounded-2xl border border-dashed border-slate-700/50 bg-slate-800/20">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600 capitalize">{formattedDate}</p>
          {isFutureDay ? (
            <span className="text-xs text-slate-600">Kommande</span>
          ) : canFillIn ? (
            <Link
              to="/quick"
              search={{ date }}
              className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors"
            >
              Fyll i
            </Link>
          ) : (
            <span className="text-xs text-slate-500">Ingen reflektion</span>
          )}
        </div>
      </div>
    </div>
  )
}
