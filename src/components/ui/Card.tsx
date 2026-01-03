type CardProps = {
  children: React.ReactNode
  className?: string
  gradient?: boolean
}

export const Card = ({ children, className = '', gradient = false }: CardProps) => {
  const baseStyles = 'rounded-3xl p-6 sm:p-7 border border-slate-700/50'
  const bgStyle = gradient 
    ? 'bg-night-subtle backdrop-blur-sm' 
    : 'bg-slate-800/80 backdrop-blur-sm'

  return (
    <div className={`${baseStyles} ${bgStyle} ${className}`}>
      {children}
    </div>
  )
}
