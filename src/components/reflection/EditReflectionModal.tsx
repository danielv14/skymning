import { useState, useEffect } from 'react'
import { useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { Modal, ModalCloseButton } from '../ui/Modal'
import { AlertDialog } from '../ui/AlertDialog'
import { MoodSelector } from './MoodSelector'
import { Textarea } from '../ui/Textarea'
import { Button } from '../ui/Button'
import type { Entry } from '../../server/db/schema'
import { updateEntry, deleteEntry } from '../../server/functions/entries'

type EditReflectionModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry: Entry
}

export const EditReflectionModal = ({
  open,
  onOpenChange,
  entry,
}: EditReflectionModalProps) => {
  const router = useRouter()
  const [selectedMood, setSelectedMood] = useState<number>(entry.mood)
  const [summary, setSummary] = useState(entry.summary)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

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
        onOpenChange(false)
        toast.success('Reflektionen har uppdaterats')
        router.invalidate()
      }
    } catch (error) {
      console.error('Failed to update entry:', error)
      toast.error('Kunde inte uppdatera reflektionen')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteEntry({ data: { id: entry.id } })
      setIsDeleteDialogOpen(false)
      onOpenChange(false)
      toast.success('Reflektionen har tagits bort')
      router.invalidate()
    } catch (error) {
      console.error('Failed to delete entry:', error)
      toast.error('Kunde inte ta bort reflektionen')
    }
  }

  const hasChanges = selectedMood !== entry.mood || summary.trim() !== entry.summary

  return (
    <>
      <Modal
        open={open}
        onOpenChange={onOpenChange}
        title="Redigera reflektion"
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

        <div className="mt-4 pt-4 border-t border-slate-700/50 flex justify-center">
          <button
            onClick={() => setIsDeleteDialogOpen(true)}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-400 transition-colors duration-200"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Ta bort reflektion
          </button>
        </div>
      </Modal>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Ta bort reflektion?"
        description="Reflektionen och tillhörande chatthistorik tas bort permanent. Det går inte att ångra."
        confirmText="Ta bort"
        onConfirm={handleDelete}
        variant="danger"
      />
    </>
  )
}
