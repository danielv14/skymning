import { useState } from 'react'
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

type EditSummaryFormProps = Pick<EditSummaryModalProps, 'onSave' | 'errorMessage'> & {
  initialSummary: string
  onSaved: () => void
}

// Mounted only while the modal is open, so the form starts from the saved summary every time
const EditSummaryForm = ({
  initialSummary,
  onSave,
  onSaved,
  errorMessage,
}: EditSummaryFormProps) => {
  const [summary, setSummary] = useState(initialSummary)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!summary.trim()) return

    setIsSaving(true)
    try {
      const updated = await onSave(summary.trim())
      if (updated) {
        onSaved()
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
    <>
      <div className="mb-6">
        <Textarea value={summary} onChange={setSummary} rows={6} autoResize maxHeight={300} />
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
    </>
  )
}

export const EditSummaryModal = ({
  open,
  onOpenChange,
  title,
  summary,
  onSave,
  successMessage,
  errorMessage,
}: EditSummaryModalProps) => {
  const router = useRouter()

  const handleSaved = () => {
    onOpenChange(false)
    toast.success(successMessage)
    router.invalidate()
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={title}>
      <EditSummaryForm
        initialSummary={summary}
        onSave={onSave}
        onSaved={handleSaved}
        errorMessage={errorMessage}
      />
    </Modal>
  )
}
