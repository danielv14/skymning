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
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
      <div
        className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-br-md shadow-lg shadow-indigo-500/20'
            : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-bl-md'
        }`}
      >
        <p className="whitespace-pre-wrap leading-relaxed">
          {text || (isStreaming ? <TypingIndicator /> : '')}
          {isStreaming && text && (
            <span className="inline-block w-2 h-4 ml-1 bg-indigo-400 animate-pulse rounded-sm align-middle" />
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
