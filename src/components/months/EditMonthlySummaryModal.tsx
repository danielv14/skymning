import { useState, useEffect } from 'react'
import { useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Modal, ModalCloseButton } from '../ui/Modal'
import { Textarea } from '../ui/Textarea'
import { Button } from '../ui/Button'
import { updateMonthlySummary } from '../../server/functions/monthlySummaries'

type EditMonthlySummaryModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  year: number
  month: number
  summary: string
}

export const EditMonthlySummaryModal = ({
  open,
  onOpenChange,
  year,
  month,
  summary: initialSummary,
}: EditMonthlySummaryModalProps) => {
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
      const updated = await updateMonthlySummary({
        data: {
          year,
          month,
          summary: summary.trim(),
        },
      })
      if (updated) {
        onOpenChange(false)
        toast.success('Månadssummeringen har uppdaterats')
        router.invalidate()
      }
    } catch (error) {
      console.error('Failed to update monthly summary:', error)
      toast.error('Kunde inte uppdatera månadssummeringen')
    } finally {
      setIsSaving(false)
    }
  }

  const hasChanges = summary.trim() !== initialSummary

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Redigera månadssummering"
    >
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
