import { useState } from 'react'
import { AlertDialog as BaseAlertDialog } from '@base-ui-components/react/alert-dialog'

type AlertDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  cancelText?: string
  confirmText: string
  onConfirm: () => void | Promise<void>
  variant?: 'danger' | 'default'
}

export const AlertDialog = ({
  open,
  onOpenChange,
  title,
  description,
  cancelText = 'Avbryt',
  confirmText,
  onConfirm,
  variant = 'default',
}: AlertDialogProps) => {
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      await onConfirm()
    } finally {
      setIsLoading(false)
    }
  }

  const confirmButtonStyles =
    variant === 'danger'
      ? 'bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 text-red-400 border border-red-500/30'
      : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white'

  return (
    <BaseAlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <BaseAlertDialog.Portal>
        <BaseAlertDialog.Backdrop className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <BaseAlertDialog.Popup className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md rounded-2xl bg-slate-800 border border-slate-700 p-6 shadow-xl transition-all duration-200 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
          <BaseAlertDialog.Title className="text-xl font-semibold text-stone-100 mb-2">
            {title}
          </BaseAlertDialog.Title>
          <BaseAlertDialog.Description className="text-slate-400 mb-6">
            {description}
          </BaseAlertDialog.Description>
          <div className="flex gap-3 justify-end">
            <BaseAlertDialog.Close className="px-4 py-2 rounded-xl font-medium bg-slate-700/50 hover:bg-slate-600/50 active:bg-slate-700/70 text-slate-200 border border-slate-600 transition-all duration-200 cursor-pointer">
              {cancelText}
            </BaseAlertDialog.Close>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${confirmButtonStyles}`}
            >
              {isLoading ? '...' : confirmText}
            </button>
          </div>
        </BaseAlertDialog.Popup>
      </BaseAlertDialog.Portal>
    </BaseAlertDialog.Root>
  )
}
