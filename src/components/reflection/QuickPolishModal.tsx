import { Modal, ModalClose } from '../ui/Modal'
import { SummaryEditor } from './SummaryEditor'
import { Button } from '../ui/Button'
import { useAsyncGeneration } from '../../hooks/useAsyncGeneration'
import { useModalGeneration } from '../../hooks/useModalGeneration'
import { polishQuickEntry } from '../../server/ai'

type QuickPolishModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  originalText: string
  onUse: (polishedText: string) => void
}

export const QuickPolishModal = ({
  open,
  onOpenChange,
  originalText,
  onUse,
}: QuickPolishModalProps) => {
  const {
    result: polishedText,
    isGenerating,
    isRegenerating,
    regenerate,
    reset,
    setResult: setPolishedText,
  } = useAsyncGeneration({
    generateFn: async () => {
      const result = await polishQuickEntry({ data: { text: originalText } })
      return typeof result === 'string' ? result : String(result)
    },
    fallbackValue: originalText,
    errorMessage: 'Kunde inte förbättra texten',
    autoGenerate: false,
  })

  useModalGeneration({
    open,
    shouldGenerate: originalText.length >= 10,
    reset,
    regenerate,
  })

  const handleUse = () => {
    if (polishedText) {
      onUse(polishedText)
      onOpenChange(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset()
    }
    onOpenChange(newOpen)
  }

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title="Förbättrad text"
      description="AI har rättat stavfel och gjort texten tydligare"
    >
      <div className="mb-6">
        <SummaryEditor
          value={polishedText ?? ''}
          onChange={setPolishedText}
          isLoading={isGenerating || (isRegenerating && !polishedText)}
          onRegenerate={regenerate}
          isRegenerating={isRegenerating && !!polishedText}
        />
      </div>

      <div className="flex gap-3">
        <ModalClose className="flex-1">
          <Button variant="secondary" className="w-full">
            Avbryt
          </Button>
        </ModalClose>
        <Button
          onClick={handleUse}
          disabled={!polishedText?.trim() || isGenerating}
          className="flex-1"
        >
          Använd denna
        </Button>
      </div>
    </Modal>
  )
}
