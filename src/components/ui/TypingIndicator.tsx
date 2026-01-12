export const TypingIndicator = () => {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
    </span>
  )
}
