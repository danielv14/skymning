import { useState, useRef, useEffect } from 'react'

type ExpandableTextProps = {
  children: string
  lines?: number
  className?: string
}

export const ExpandableText = ({
  children,
  lines = 3,
  className = '',
}: ExpandableTextProps) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [needsTruncation, setNeedsTruncation] = useState(false)
  const textRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const element = textRef.current
    if (!element) return

    const checkTruncation = () => {
      setNeedsTruncation(element.scrollHeight > element.clientHeight)
    }

    checkTruncation()

    const resizeObserver = new ResizeObserver(checkTruncation)
    resizeObserver.observe(element)

    return () => resizeObserver.disconnect()
  }, [children])

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
      <p
        ref={textRef}
        className={className}
        style={lineClampStyle}
      >
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
