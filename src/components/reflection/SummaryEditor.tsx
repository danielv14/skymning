import { Button } from '../ui/Button'
import { Textarea } from '../ui/Textarea'

type SummaryEditorProps = {
  value: string
  onChange: (value: string) => void
  isLoading: boolean
  onRegenerate: () => void
  isRegenerating?: boolean
}

export const SummaryEditor = ({
  value,
  onChange,
  isLoading,
  onRegenerate,
  isRegenerating = false,
}: SummaryEditorProps) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-32 rounded-xl bg-slate-700/50 animate-pulse" />
        <div className="h-4 w-48 rounded bg-slate-700/50 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Textarea
        value={value}
        onChange={onChange}
        rows={3}
        placeholder="Din sammanfattning..."
        autoResize
      />
      <div className="flex justify-end">
        <Button
          variant="secondary"
          size="sm"
          onClick={onRegenerate}
          disabled={isRegenerating}
        >
          {isRegenerating ? 'Genererar...' : 'Generera om'}
        </Button>
      </div>
    </div>
  )
}
