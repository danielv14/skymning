import './card.css'

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
  const baseStyles = 'relative rounded-3xl p-5 sm:p-6 border border-slate-700/30 backdrop-blur-md'
  const bgStyle = gradient ? 'bg-slate-800/40' : 'bg-slate-800/50'
  const interactiveStyle = interactive ? 'cursor-pointer hover:border-slate-600/50 hover:bg-slate-800/60 transition-colors' : ''

  return (
    <div
      className={`${baseStyles} ${bgStyle} ${interactiveStyle} ${className}`}
      style={style}
    >
      {children}
    </div>
  )
}
