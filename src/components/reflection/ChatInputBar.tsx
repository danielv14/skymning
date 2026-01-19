import { useRef, useEffect } from 'react'
import { SendHorizontal } from 'lucide-react'
import { Textarea } from '../ui/Textarea'

type ChatInputBarProps = {
  input: string
  onInputChange: (value: string) => void
  onSend: () => void
  onComplete?: () => void
  isLoading: boolean
  canComplete: boolean
}

export const ChatInputBar = ({
  input,
  onInputChange,
  onSend,
  onComplete,
  isLoading,
  canComplete,
}: ChatInputBarProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!isLoading) {
      textareaRef.current?.focus()
    }
  }, [isLoading])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSend()
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  return (
    <div className="shrink-0 px-4 sm:px-6 py-4">
      <div className="max-w-2xl mx-auto bg-slate-800/60 border border-slate-700/50 backdrop-blur-sm rounded-2xl px-4 sm:px-5 py-4">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={onInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Dela dina tankar..."
            rows={2}
            disabled={isLoading}
            autoResize
            maxHeight={150}
            className="rounded-2xl !pr-16"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-4 bottom-4 w-9 h-9 flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-full text-white transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer hover:scale-110 active:scale-95 hover:shadow-lg hover:shadow-emerald-500/30"
          >
            <SendHorizontal className="w-4 h-4" />
          </button>
        </div>
        {canComplete && !isLoading && onComplete && (
          <div className="flex justify-end mt-2">
            <button
              onClick={onComplete}
              className="text-sm text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              Jag är klar – spara dagen
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
