export const TypingIndicator = () => {
  return (
    <span className="inline-flex items-center gap-1.5 py-1">
      <span className="w-2 h-2 bg-gradient-to-br from-cyan-400 to-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
      <span className="w-2 h-2 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
      <span className="w-2 h-2 bg-gradient-to-br from-teal-400 to-cyan-400 rounded-full animate-bounce" />
    </span>
  )
}
