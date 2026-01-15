import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Modal, ModalCloseButton } from '../ui/Modal'
import { MoodSelector } from './MoodSelector'
import { Textarea } from '../ui/Textarea'
import { Button } from '../ui/Button'
import type { Entry } from '../../server/db/schema'
import { updateEntry } from '../../server/functions/entries'

type EditReflectionModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry: Entry
  onUpdated: (entry: Entry) => void
}

export const EditReflectionModal = ({
  open,
  onOpenChange,
  entry,
  onUpdated,
}: EditReflectionModalProps) => {
  const [selectedMood, setSelectedMood] = useState<number>(entry.mood)
  const [summary, setSummary] = useState(entry.summary)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setSelectedMood(entry.mood)
      setSummary(entry.summary)
    }
  }, [open, entry])

  const handleSave = async () => {
    if (!summary.trim()) return

    setIsSaving(true)
    try {
      const updated = await updateEntry({
        data: {
          id: entry.id,
          mood: selectedMood,
          summary: summary.trim(),
        },
      })
      if (updated) {
        onUpdated(updated)
        onOpenChange(false)
        toast.success('Reflektionen har uppdaterats')
      }
    } catch (error) {
      console.error('Failed to update entry:', error)
      toast.error('Kunde inte uppdatera reflektionen')
    } finally {
      setIsSaving(false)
    }
  }

  const hasChanges = selectedMood !== entry.mood || summary.trim() !== entry.summary

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Redigera reflektion"
      description="Ändra humör eller sammanfattning för denna dag"
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
        <Textarea
          value={summary}
          onChange={setSummary}
          rows={4}
          autoResize
          maxHeight={200}
        />
      </div>

      <div className="flex gap-3">
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
