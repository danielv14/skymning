import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Pencil, Sparkles } from 'lucide-react'
import type { Entry } from '../../server/db/schema'
import { MOODS } from '../../constants'
import { MoodEmoji } from '../mood/MoodEmoji'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { EditReflectionModal } from '../reflection/EditReflectionModal'

type TodayEntryCardProps = {
  entry: Entry | null
  hasChatPreview: boolean
}

export const TodayEntryCard = ({ entry, hasChatPreview }: TodayEntryCardProps) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const getMoodColor = (mood: number) => {
    const moodConfig = MOODS.find((m) => m.value === mood)
    return moodConfig?.color || '#64748b'
  }

  return (
    <>
      {entry ? (
        <Card
          className="relative overflow-hidden"
          style={{
            borderColor: `color-mix(in srgb, ${getMoodColor(entry.mood)} 30%, transparent)`,
            background: `linear-gradient(135deg, color-mix(in srgb, ${getMoodColor(entry.mood)} 8%, transparent) 0%, rgba(30, 41, 59, 0.5) 100%)`,
          }}
        >
          {/* Mood-tinted glow overlay */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at top right, ${getMoodColor(entry.mood)} 0%, transparent 60%)`,
            }}
          />

          <div className="relative space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Idag</p>
                <h2 className="text-xl sm:text-2xl font-semibold text-white">Dagens reflektion</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="p-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/10 active:bg-white/15 transition-all duration-200 hover:scale-105 active:scale-95"
                  title="Redigera"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <div className="p-3 rounded-2xl" style={{
                  backgroundColor: `color-mix(in srgb, ${getMoodColor(entry.mood)} 15%, transparent)`,
                }}>
                  <MoodEmoji mood={entry.mood} size="lg" />
                </div>
              </div>
            </div>

            <p className="text-slate-200 text-base sm:text-lg leading-relaxed">{entry.summary}</p>

            <div className="flex items-center gap-2 pt-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-sm text-slate-400">
                Reflektion sparad
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="bg-gradient-to-br from-emerald-500/5 via-slate-800/50 to-cyan-500/5">
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-400">
                <Sparkles className="w-4 h-4" />
                <p className="text-xs font-medium uppercase tracking-wider">Ny dag</p>
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-white">Hur var din dag?</h2>
              <p className="text-slate-300 text-base leading-relaxed">
                Ta en stund att reflektera över dagens händelser och känslor.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/reflect" className="flex-1">
                <Button className="w-full" glow>
                  {hasChatPreview ? 'Fortsätt chatta' : 'Prata med AI'}
                </Button>
              </Link>
              <Link to="/quick" className="flex-1">
                <Button variant="secondary" className="w-full">Skriv själv</Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {entry && (
        <EditReflectionModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          entry={entry}
        />
      )}
    </>
  )
}
