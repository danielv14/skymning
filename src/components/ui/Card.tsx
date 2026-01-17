type CardProps = {
  children: React.ReactNode
  className?: string
  gradient?: boolean
  style?: React.CSSProperties
}

export const Card = ({ children, className = '', gradient = false, style }: CardProps) => {
  const baseStyles = 'rounded-3xl p-6 sm:p-7 border border-slate-700/40 backdrop-blur-md'
  const bgStyle = gradient
    ? 'bg-night-subtle'
    : 'bg-slate-800/60'

  return (
    <div className={`${baseStyles} ${bgStyle} ${className}`} style={style}>
      {children}
    </div>
  )
}
