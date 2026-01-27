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
    <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-6 py-4 bg-slate-950/70 backdrop-blur-xl border-t border-slate-800/50">
      <div className="max-w-2xl mx-auto bg-slate-800/60 border border-slate-700/40 rounded-2xl px-4 sm:px-5 py-4 shadow-lg">
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
            className="absolute right-4 bottom-4 w-10 h-10 flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:from-emerald-600 active:to-teal-700 rounded-full text-white transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer hover:scale-110 active:scale-95 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
          >
            <SendHorizontal className="w-4 h-4" />
          </button>
        </div>
        {canComplete && !isLoading && onComplete && (
          <div className="flex justify-end mt-3">
            <button
              onClick={onComplete}
              className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer font-medium"
            >
              Jag är klar – spara dagen
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
