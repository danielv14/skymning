import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Modal, ModalClose } from '../ui/Modal'
import { MoodSelector } from './MoodSelector'
import { SummaryEditor } from './SummaryEditor'
import { Button } from '../ui/Button'
import { useAsyncGeneration } from '../../hooks/useAsyncGeneration'
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
  const [isSaving, setIsSaving] = useState(false)
  const prevOpenRef = useRef(false)

  const {
    result: summary,
    isGenerating,
    isRegenerating,
    regenerate,
    reset,
    setResult: setSummary,
  } = useAsyncGeneration({
    generateFn: async () => {
      const result = await generateDaySummary({ data: { messages } })
      return typeof result === 'string' ? result : String(result)
    },
    fallbackValue: 'Kunde inte generera sammanfattning. Skriv din egen!',
    errorMessage: 'Kunde inte generera sammanfattning',
    autoGenerate: false,
  })

  useEffect(() => {
    const wasOpen = prevOpenRef.current
    prevOpenRef.current = open

    if (open && !wasOpen && messages.length > 0) {
      reset()
      regenerate()
    }
  }, [open, messages.length, reset, regenerate])

  const handleSave = async () => {
    if (!selectedMood || !summary?.trim()) return

    setIsSaving(true)
    try {
      await onSave(selectedMood, summary)
      setSelectedMood(null)
      reset()
    } catch (error) {
      console.error('Failed to save:', error)
      toast.error('Kunde inte spara dagens reflektion')
    } finally {
      setIsSaving(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedMood(null)
      reset()
    }
    onOpenChange(newOpen)
  }

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title="Sammanfatta din dag"
      description="Välj hur dagen kändes och redigera sammanfattningen om du vill"
    >
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
          value={summary ?? ''}
          onChange={setSummary}
          isLoading={isGenerating || (isRegenerating && !summary)}
          onRegenerate={regenerate}
          isRegenerating={isRegenerating && !!summary}
        />
      </div>

      <div className="flex gap-3">
        <ModalClose className="flex-1">
          <Button variant="secondary" className="w-full">
            Avbryt
          </Button>
        </ModalClose>
        <Button
          onClick={handleSave}
          disabled={!selectedMood || !summary?.trim() || isSaving || isGenerating}
          className="flex-1"
        >
          {isSaving ? 'Sparar...' : 'Spara dagen'}
        </Button>
      </div>
    </Modal>
  )
}
