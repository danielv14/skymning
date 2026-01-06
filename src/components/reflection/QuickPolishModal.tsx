import { useState, useEffect, useRef } from 'react'
import { Dialog } from '@base-ui-components/react/dialog'
import { SummaryEditor } from './SummaryEditor'
import { Button } from '../ui/Button'
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
  const [polishedText, setPolishedText] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const hasGeneratedRef = useRef(false)

  useEffect(() => {
    if (open && originalText.length >= 10 && !hasGeneratedRef.current) {
      hasGeneratedRef.current = true
      generatePolished()
    }
    if (!open) {
      hasGeneratedRef.current = false
    }
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [open, originalText])

  const generatePolished = async (isRegenerate = false) => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = new AbortController()

    if (isRegenerate) {
      setIsRegenerating(true)
    } else {
      setIsGenerating(true)
    }

    try {
      const result = await polishQuickEntry({ data: { text: originalText } })
      if (abortControllerRef.current?.signal.aborted) return

      setPolishedText(typeof result === 'string' ? result : String(result))
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Failed to polish text:', error)
        setPolishedText(originalText)
      }
    } finally {
      setIsGenerating(false)
      setIsRegenerating(false)
    }
  }

  const handleRegenerate = () => {
    generatePolished(true)
  }

  const handleUse = () => {
    onUse(polishedText)
    onOpenChange(false)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      abortControllerRef.current?.abort()
      setPolishedText('')
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
            Förbättrad text
          </Dialog.Title>
          <Dialog.Description className="text-slate-400 mb-6">
            AI har rättat stavfel och gjort texten tydligare
          </Dialog.Description>

          <div className="mb-6">
            <SummaryEditor
              value={polishedText}
              onChange={setPolishedText}
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
              onClick={handleUse}
              disabled={!polishedText.trim() || isGenerating}
              className="flex-1"
              glow
            >
              Använd denna
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
