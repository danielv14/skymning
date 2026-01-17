import { useEffect, useRef } from 'react'

type TextareaProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  disabled?: boolean
  autoResize?: boolean
  maxHeight?: number
  className?: string
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  ref?: React.Ref<HTMLTextAreaElement>
}

export const Textarea = ({
  value,
  onChange,
  placeholder,
  rows = 3,
  disabled = false,
  autoResize = false,
  maxHeight = 150,
  className = '',
  onKeyDown,
  ref,
}: TextareaProps) => {
  const internalRef = useRef<HTMLTextAreaElement>(null)
  const textareaRef = (ref as React.RefObject<HTMLTextAreaElement>) ?? internalRef

  useEffect(() => {
    if (autoResize && textareaRef.current) {
      const textarea = textareaRef.current
      textarea.style.height = 'auto'
      const newHeight = Math.min(textarea.scrollHeight, maxHeight)
      textarea.style.height = `${newHeight}px`
      textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden'
    }
  }, [value, autoResize, maxHeight, textareaRef])

  const baseStyles =
    'w-full px-4 py-3 rounded-xl border border-slate-600 bg-slate-700/50 text-slate-100 placeholder-slate-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors resize-none'

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      onKeyDown={onKeyDown}
      className={`${baseStyles} ${className}`}
    />
  )
}
