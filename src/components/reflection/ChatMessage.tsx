import { TypingIndicator } from '../ui/TypingIndicator'

type ChatMessageProps = {
  role: 'user' | 'assistant'
  text: string
  isStreaming?: boolean
  time?: string | null
}

export const ChatMessage = ({ role, text, isStreaming = false, time }: ChatMessageProps) => {
  const isUser = role === 'user'

  return (
    <div className={`chat-message flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
      <div
        className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-5 py-3.5 ${
          isUser
            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-md shadow-lg shadow-emerald-500/25'
            : 'bg-slate-800/80 border border-slate-700/50 text-slate-200 rounded-bl-md backdrop-blur-sm'
        }`}
      >
        <p className="whitespace-pre-wrap leading-relaxed">
          {text || (isStreaming ? <TypingIndicator /> : '')}
          {isStreaming && text && (
            <span className="inline-block w-2 h-4 ml-1 bg-emerald-400 animate-pulse rounded-sm align-middle" />
          )}
        </p>
      </div>
      {time && (
        <span className="text-xs text-slate-500 mt-1 px-1">
          {time}
        </span>
      )}
    </div>
  )
}
