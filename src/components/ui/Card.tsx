type CardProps = {
  children: React.ReactNode
  className?: string
  gradient?: boolean
  interactive?: boolean
  style?: React.CSSProperties
}

export const Card = ({
  children,
  className = '',
  gradient = false,
  interactive = false,
  style,
}: CardProps) => {
  const baseStyles = 'rounded-3xl p-6 sm:p-8 border border-slate-700/40 backdrop-blur-md'
  const bgStyle = gradient ? 'bg-night-subtle' : 'bg-slate-800/60'
  const interactiveStyle = interactive ? 'card-interactive cursor-pointer' : ''

  return (
    <div
      className={`${baseStyles} ${bgStyle} ${interactiveStyle} ${className}`}
      style={style}
    >
      {children}
    </div>
  )
}
