import { Pencil, RotateCw } from 'lucide-react'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { ExpandableText } from './ui/ExpandableText'
import { MoodEmoji } from './mood/MoodEmoji'

type SummarySectionProps = {
  title: string
  emptyText: string
  summary: string | null
  hasEntries: boolean
  moodDescription: string | null
  entryCount: number
  averageMood: number | null
  onGenerate: () => void
  onOpenRegenerateModal: () => void
  onEdit: () => void
  isGenerating: boolean
  isRegenerating: boolean
}

export const SummarySection = ({
  title,
  emptyText,
  summary,
  hasEntries,
  moodDescription,
  entryCount,
  averageMood,
  onGenerate,
  onOpenRegenerateModal,
  onEdit,
  isGenerating,
  isRegenerating,
}: SummarySectionProps) => {
  const roundedMood = averageMood !== null ? Math.round(averageMood) : null
  const reflectionText = entryCount === 1 ? '1 reflektion' : `${entryCount} reflektioner`

  if (summary) {
    return (
      <Card>
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <div className="flex items-center gap-1">
              <button
                onClick={onEdit}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/50 active:bg-slate-700/70 transition-all duration-200"
                aria-label="Redigera summering"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={onOpenRegenerateModal}
                disabled={isRegenerating}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/50 active:bg-slate-700/70 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Regenerera summering"
              >
                <RotateCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
              </button>
            </div>
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
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {roundedMood !== null && (
            <div className="flex items-center gap-3 mt-2">
              <MoodEmoji mood={roundedMood} size="sm" showLabel={false} />
              <span className="text-sm text-slate-400">
                {moodDescription} · {reflectionText}
              </span>
            </div>
          )}
        </div>
        <p className="text-slate-400 mb-4">{emptyText}</p>
        <Button onClick={onGenerate} disabled={isGenerating}>
          {isGenerating ? 'Genererar...' : 'Generera summering'}
        </Button>
      </Card>
    )
  }

  return null
}
