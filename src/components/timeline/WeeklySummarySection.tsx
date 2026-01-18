import { RotateCw } from 'lucide-react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

type WeeklySummarySectionProps = {
  summary: string | null
  hasEntries: boolean
  moodDescription: string | null
  onGenerate: () => void
  onOpenRegenerateModal: () => void
  isGenerating: boolean
  isRegenerating: boolean
}

export const WeeklySummarySection = ({
  summary,
  hasEntries,
  moodDescription,
  onGenerate,
  onOpenRegenerateModal,
  isGenerating,
  isRegenerating,
}: WeeklySummarySectionProps) => {
  if (summary) {
    return (
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3 mb-3">
          <h2 className="text-lg font-semibold text-white">Veckans summering</h2>
          <div className="flex items-center gap-3">
            {moodDescription && (
              <span className="text-sm text-slate-400">{moodDescription}</span>
            )}
            <button
              onClick={onOpenRegenerateModal}
              disabled={isRegenerating}
              className="text-slate-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Regenerera summering"
            >
              <RotateCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        <p className="text-slate-300">{summary}</p>
      </Card>
    )
  }

  if (hasEntries) {
    return (
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">Veckans summering</h2>
          {moodDescription && (
            <span className="text-sm text-slate-400">{moodDescription}</span>
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
