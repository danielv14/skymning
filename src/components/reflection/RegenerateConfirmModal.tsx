import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'

type RegenerateConfirmModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  isLoading: boolean
}

export const RegenerateConfirmModal = ({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: RegenerateConfirmModalProps) => {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Skapa om veckosummering?"
      description="Är du säker på att du vill skapa en ny veckosummering? Den nuvarande texten kommer att ersättas."
    >
      <div className="flex gap-3 justify-end">
        <Button
          variant="secondary"
          onClick={() => onOpenChange(false)}
          disabled={isLoading}
        >
          Avbryt
        </Button>
        <Button onClick={onConfirm} disabled={isLoading}>
          {isLoading ? 'Gör om...' : 'Gör om'}
        </Button>
      </div>
    </Modal>
  )
}
