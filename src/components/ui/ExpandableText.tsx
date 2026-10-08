import { useCallback, useState } from 'react'

type ExpandableTextProps = {
  children: string
  lines?: number
  className?: string
}

export const ExpandableText = ({ children, lines = 3, className = '' }: ExpandableTextProps) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [needsTruncation, setNeedsTruncation] = useState(false)
  // ResizeObserver reports the initial size as soon as observation starts, so it covers
  // both the first measurement and later layout changes.
  const observeTruncation = useCallback((element: HTMLParagraphElement | null) => {
    if (!element) return

    const resizeObserver = new ResizeObserver(() => {
      setNeedsTruncation(element.scrollHeight > element.clientHeight)
    })
    resizeObserver.observe(element)

    return () => resizeObserver.disconnect()
  }, [])

  const lineClampStyle = !isExpanded
    ? {
        display: '-webkit-box',
        WebkitLineClamp: lines,
        WebkitBoxOrient: 'vertical' as const,
        overflow: 'hidden',
      }
    : {}

  return (
    <div>
      {/* Keyed on the text so new content gets a fresh element and a new measurement */}
      <p key={children} ref={observeTruncation} className={className} style={lineClampStyle}>
        {children}
      </p>
      {needsTruncation && !isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="mt-2 text-sm text-slate-500 hover:text-slate-300 transition-colors"
        >
          Visa mer
        </button>
      )}
    </div>
  )
}
