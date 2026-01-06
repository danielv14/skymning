import { useState, useEffect, useRef } from 'react'
import { Dialog } from '@base-ui-components/react/dialog'
import { MoodSelector } from './MoodSelector'
import { SummaryEditor } from './SummaryEditor'
import { Button } from '../ui/Button'
import { generateDaySummary } from '../../server/ai'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

type CompletionModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  messages: ChatMessage[]
  onSave: (mood: number, summary: string) => Promise<void>
}

export const CompletionModal = ({
  open,
  onOpenChange,
  messages,
  onSave,
}: CompletionModalProps) => {
  const [selectedMood, setSelectedMood] = useState<number | null>(null)
  const [summary, setSummary] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const hasGeneratedRef = useRef(false)

  useEffect(() => {
    if (open && messages.length > 0 && !hasGeneratedRef.current) {
      hasGeneratedRef.current = true
      generateSummary()
    }
    if (!open) {
      hasGeneratedRef.current = false
    }
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [open, messages.length])

  const generateSummary = async (isRegenerate = false) => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = new AbortController()

    if (isRegenerate) {
      setIsRegenerating(true)
    } else {
      setIsGenerating(true)
    }

    try {
      const result = await generateDaySummary({ data: { messages } })
      if (abortControllerRef.current?.signal.aborted) return

      setSummary(typeof result === 'string' ? result : String(result))
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Failed to generate summary:', error)
        setSummary('Kunde inte generera sammanfattning. Skriv din egen!')
      }
    } finally {
      setIsGenerating(false)
      setIsRegenerating(false)
    }
  }

  const handleRegenerate = () => {
    generateSummary(true)
  }

  const handleSave = async () => {
    if (!selectedMood || !summary.trim()) return

    setIsSaving(true)
    try {
      await onSave(selectedMood, summary)
      setSelectedMood(null)
      setSummary('')
    } catch (error) {
      console.error('Failed to save:', error)
      setIsSaving(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      abortControllerRef.current?.abort()
      setSelectedMood(null)
      setSummary('')
      setIsGenerating(false)
      setIsRegenerating(false)
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-800 border border-slate-700 p-6 shadow-xl transition-all duration-200 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
          <Dialog.Title className="text-xl font-semibold text-stone-100 mb-2">
            Sammanfatta din dag
          </Dialog.Title>
          <Dialog.Description className="text-slate-400 mb-6">
            Välj hur dagen kändes och redigera sammanfattningen om du vill
          </Dialog.Description>

          <div className="mb-6">
            <h3 className="text-sm font-medium text-slate-300 mb-3">
              Hur kändes dagen?
            </h3>
            <MoodSelector value={selectedMood} onChange={setSelectedMood} />
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-medium text-slate-300 mb-3">
              Sammanfattning
            </h3>
            <SummaryEditor
              value={summary}
              onChange={setSummary}
              isLoading={isGenerating}
              onRegenerate={handleRegenerate}
              isRegenerating={isRegenerating}
            />
          </div>

          <div className="flex gap-3">
            <Dialog.Close className="flex-1">
              <Button variant="secondary" className="w-full">
                Avbryt
              </Button>
            </Dialog.Close>
            <Button
              onClick={handleSave}
              disabled={!selectedMood || !summary.trim() || isSaving || isGenerating}
              className="flex-1"
              glow
            >
              {isSaving ? 'Sparar...' : 'Spara dagen'}
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
