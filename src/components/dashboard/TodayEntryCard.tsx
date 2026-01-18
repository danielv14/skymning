import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Pencil } from 'lucide-react'
import type { Entry } from '../../server/db/schema'
import { MoodEmoji } from '../mood/MoodEmoji'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { EditReflectionModal } from '../reflection/EditReflectionModal'

type TodayEntryCardProps = {
  entry: Entry | null
  hasChatPreview: boolean
  onUpdated?: (entry: Entry) => void
}

export const TodayEntryCard = ({ entry, hasChatPreview, onUpdated }: TodayEntryCardProps) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  return (
    <>
      <Card>
        {entry ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Dagens reflektion</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
                  title="Redigera"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <MoodEmoji mood={entry.mood} size="lg" layout="horizontal" />
              </div>
            </div>
            <p className="text-slate-300">{entry.summary}</p>
            <p className="text-sm text-slate-500">
              Du har redan reflekterat idag
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Hur var din dag?</h2>
            <p className="text-slate-300">
              Ta en stund att reflektera över dagens händelser och känslor.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/reflect" className="flex-1">
                <Button className="w-full">
                  {hasChatPreview ? 'Fortsätt chatta' : 'Prata med AI'}
                </Button>
              </Link>
              <Link to="/quick" className="flex-1">
                <Button variant="secondary" className="w-full">Skriv själv</Button>
              </Link>
            </div>
          </div>
        )}
      </Card>

      {entry && (
        <EditReflectionModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          entry={entry}
          onUpdated={(updated) => onUpdated?.(updated)}
        />
      )}
    </>
  )
}
