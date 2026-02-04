import { RotateCw } from 'lucide-react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { ExpandableText } from '../ui/ExpandableText'
import { MoodEmoji } from '../mood/MoodEmoji'

type WeeklySummarySectionProps = {
  summary: string | null
  hasEntries: boolean
  moodDescription: string | null
  entryCount: number
  averageMood: number | null
  onGenerate: () => void
  onOpenRegenerateModal: () => void
  isGenerating: boolean
  isRegenerating: boolean
}

export const WeeklySummarySection = ({
  summary,
  hasEntries,
  moodDescription,
  entryCount,
  averageMood,
  onGenerate,
  onOpenRegenerateModal,
  isGenerating,
  isRegenerating,
}: WeeklySummarySectionProps) => {
  const roundedMood = averageMood !== null ? Math.round(averageMood) : null
  const reflectionText = entryCount === 1 ? '1 reflektion' : `${entryCount} reflektioner`

  if (summary) {
    return (
      <Card>
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Veckans summering</h2>
            <button
              onClick={onOpenRegenerateModal}
              disabled={isRegenerating}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/50 active:bg-slate-700/70 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Regenerera summering"
            >
              <RotateCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
            </button>
          </div>
          {roundedMood !== null && (
            <div className="flex items-center gap-3 mt-2">
              <MoodEmoji mood={roundedMood} size="sm" showLabel={false} />
              <span className="text-sm text-slate-400">
                {moodDescription} · {reflectionText}
              </span>
            </div>
          )}
        </div>
        <ExpandableText lines={4} className="text-slate-300 leading-relaxed">
          {summary}
        </ExpandableText>
      </Card>
    )
  }

  if (hasEntries) {
    return (
      <Card>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white">Veckans summering</h2>
          {roundedMood !== null && (
            <div className="flex items-center gap-3 mt-2">
              <MoodEmoji mood={roundedMood} size="sm" showLabel={false} />
              <span className="text-sm text-slate-400">
                {moodDescription} · {reflectionText}
              </span>
            </div>
          )}
        </div>
        <p className="text-slate-400 mb-4">
          Ingen summering finns ännu för denna vecka.
        </p>
        <Button onClick={onGenerate} disabled={isGenerating}>
          {isGenerating ? 'Genererar...' : 'Generera summering'}
        </Button>
      </Card>
    )
  }

  return null
}
