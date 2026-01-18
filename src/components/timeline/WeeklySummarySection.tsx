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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-4">
          <h2 className="text-lg font-semibold text-white">Veckans summering</h2>
          <div className="flex items-center gap-4">
            {moodDescription && (
              <span className="text-sm text-slate-400">{moodDescription}</span>
            )}
            <button
              onClick={onOpenRegenerateModal}
              disabled={isRegenerating}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/50 active:bg-slate-700/70 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              aria-label="Regenerera summering"
            >
              <RotateCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        <p className="text-slate-300 leading-relaxed">{summary}</p>
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
