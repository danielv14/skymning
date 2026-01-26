import { useState } from 'react'
import { Clock, MessageCircle, Trash2, ArrowRight, PenLine } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { formatRelativeDay } from '../../utils/date'

type PastChatRecoveryModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  pastChat: {
    date: string
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
    messageCount: number
  }
  onContinue: () => Promise<void>
  onWriteManually: () => void
  onDiscard: () => Promise<void>
}

export const PastChatRecoveryModal = ({
  open,
  onOpenChange,
  pastChat,
  onContinue,
  onWriteManually,
  onDiscard,
}: PastChatRecoveryModalProps) => {
  const [loadingAction, setLoadingAction] = useState<'continue' | 'discard' | null>(null)

  const relativeDateLabel = formatRelativeDay(pastChat.date)
  const firstUserMessage = pastChat.messages.find((m) => m.role === 'user')
  const lastAssistantMessage = [...pastChat.messages].reverse().find((m) => m.role === 'assistant')

  const handleContinue = async () => {
    setLoadingAction('continue')
    try {
      await onContinue()
    } finally {
      setLoadingAction(null)
    }
  }

  const handleDiscard = async () => {
    setLoadingAction('discard')
    try {
      await onDiscard()
    } finally {
      setLoadingAction(null)
    }
  }

  const truncate = (text: string, max: number) =>
    text.length <= max ? text : text.slice(0, max).trim() + '...'

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Ofullständig reflektion"
      description={`Du har en påbörjad reflektion från ${relativeDateLabel} som aldrig sparades.`}
    >
      <div className="flex justify-center mb-6">
        <div className="relative">
          <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl scale-150" />
          <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center">
            <Clock className="w-7 h-7 text-amber-400" />
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="bg-slate-800/60 rounded-2xl p-4 space-y-3 border border-slate-700/30">
          {firstUserMessage && (
            <div className="flex gap-3">
              <div className="shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500 mb-1">Du skrev</p>
                <p className="text-sm text-slate-300 line-clamp-2">
                  {truncate(firstUserMessage.content, 100)}
                </p>
              </div>
            </div>
          )}
          {lastAssistantMessage && firstUserMessage && (
            <div className="border-t border-slate-700/30 pt-3">
              <div className="flex gap-3">
                <div className="shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <span className="text-xs">✨</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500 mb-1">AI svarade</p>
                  <p className="text-sm text-slate-400 line-clamp-2">
                    {truncate(lastAssistantMessage.content, 100)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        <p className="text-xs text-slate-500 text-center mt-2">
          {pastChat.messageCount} {pastChat.messageCount === 1 ? 'meddelande' : 'meddelanden'} totalt
        </p>
      </div>

      <div className="space-y-3">
        <Button
          onClick={handleContinue}
          disabled={loadingAction !== null}
          className="w-full flex items-center justify-center gap-2"
        >
          {loadingAction === 'continue' ? (
            'Laddar...'
          ) : (
            <>
              <ArrowRight className="w-4 h-4" />
              Fortsätt chatten
            </>
          )}
        </Button>

        <Button
          variant="secondary"
          onClick={onWriteManually}
          disabled={loadingAction !== null}
          className="w-full flex items-center justify-center gap-2"
        >
          <PenLine className="w-4 h-4" />
          Skriv manuellt
        </Button>

        <Button
          variant="ghost"
          onClick={handleDiscard}
          disabled={loadingAction !== null}
          className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
        >
          {loadingAction === 'discard' ? (
            'Raderar...'
          ) : (
            <>
              <Trash2 className="w-4 h-4" />
              Radera och börja om
            </>
          )}
        </Button>
      </div>
    </Modal>
  )
}
