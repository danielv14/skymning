import { useEffect, useRef } from 'react'
import { Button } from '../ui/Button'

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
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [value])

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
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full px-4 py-3 rounded-xl border border-slate-600 bg-slate-700/50 text-slate-100 placeholder-slate-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors resize-none overflow-hidden"
        placeholder="Din sammanfattning..."
      />
      <div className="flex justify-end">
        <Button
          variant="secondary"
          onClick={onRegenerate}
          disabled={isRegenerating}
          className="!px-3 !py-1.5 text-sm"
        >
          {isRegenerating ? 'Genererar...' : 'Generera om'}
        </Button>
      </div>
    </div>
  )
}
