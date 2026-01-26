export type ButtonProps = {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  disabled?: boolean
  onClick?: () => void
  type?: 'button' | 'submit'
  glow?: boolean
}

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  glow = false,
}: ButtonProps) => {
  const baseStyles =
    'rounded-2xl font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-ring transition-all duration-200'

  const sizeStyles = {
    sm: 'px-4 py-2.5 text-sm',
    md: 'px-6 py-3',
    lg: 'px-8 py-4 text-lg',
  }

  const variantStyles = {
    primary:
      'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:from-emerald-700 active:to-teal-700 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30',
    secondary:
      'bg-slate-700/40 hover:bg-slate-600/50 active:bg-slate-700/60 text-slate-200 border border-slate-600/40 hover:border-slate-500/50',
    ghost:
      'bg-transparent hover:bg-slate-700/40 active:bg-slate-700/60 text-slate-300 hover:text-white',
  }

  const glowStyle = glow ? 'glow-pulse' : ''

  return (
    <button
      type={type}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${glowStyle} ${className}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
