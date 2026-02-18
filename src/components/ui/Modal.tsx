import { Dialog } from '@base-ui-components/react/dialog'
import { Button, type ButtonProps } from './Button'

type ModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export const Modal = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
}: ModalProps) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="modal-glass fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] max-w-lg max-h-[85vh] rounded-3xl p-7 sm:p-8 flex flex-col overflow-hidden transition-all duration-300 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
          <div className="shrink-0">
            <Dialog.Title className="text-xl font-semibold text-stone-100 mb-3">
              {title}
            </Dialog.Title>
            {description && (
              <Dialog.Description className="text-slate-400 mb-6 leading-relaxed">
                {description}
              </Dialog.Description>
            )}
          </div>
          <div className="overflow-y-auto min-h-0">{children}</div>
          {footer && <div className="shrink-0">{footer}</div>}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

type ModalCloseButtonProps = Omit<ButtonProps, 'onClick'>

export const ModalCloseButton = ({
  children,
  ...props
}: ModalCloseButtonProps) => {
  return <Dialog.Close render={<Button {...props}>{children}</Button>} />
}
