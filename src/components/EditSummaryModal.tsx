import { useState, useEffect } from 'react'
import { useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Modal, ModalCloseButton } from './ui/Modal'
import { Textarea } from './ui/Textarea'
import { Button } from './ui/Button'

type EditSummaryModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  summary: string
  onSave: (summary: string) => Promise<unknown>
  successMessage: string
  errorMessage: string
}

export const EditSummaryModal = ({
  open,
  onOpenChange,
  title,
  summary: initialSummary,
  onSave,
  successMessage,
  errorMessage,
}: EditSummaryModalProps) => {
  const router = useRouter()
  const [summary, setSummary] = useState(initialSummary)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setSummary(initialSummary)
    }
  }, [open, initialSummary])

  const handleSave = async () => {
    if (!summary.trim()) return

    setIsSaving(true)
    try {
      const updated = await onSave(summary.trim())
      if (updated) {
        onOpenChange(false)
        toast.success(successMessage)
        router.invalidate()
      }
    } catch (error) {
      console.error('Failed to update summary:', error)
      toast.error(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const hasChanges = summary.trim() !== initialSummary

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={title}>
      <div className="mb-6">
        <Textarea
          value={summary}
          onChange={setSummary}
          rows={6}
          autoResize
          maxHeight={300}
        />
      </div>

      <div className="flex flex-row gap-3">
        <ModalCloseButton variant="secondary" className="flex-1">
          Avbryt
        </ModalCloseButton>
        <Button
          onClick={handleSave}
          disabled={!summary.trim() || isSaving || !hasChanges}
          className="flex-1"
        >
          {isSaving ? 'Sparar...' : 'Uppdatera'}
        </Button>
      </div>
    </Modal>
  )
}
