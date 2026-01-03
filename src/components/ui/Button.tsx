type ButtonProps = {
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
  className?: string
  disabled?: boolean
  onClick?: () => void
  type?: 'button' | 'submit'
  glow?: boolean
}

export const Button = ({
  children,
  variant = 'primary',
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  glow = false,
}: ButtonProps) => {
  const baseStyles =
    'px-6 py-3 rounded-2xl font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'

  const variantStyles = {
    primary: 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white',
    secondary: 'bg-slate-700/50 hover:bg-slate-600/50 active:bg-slate-700/70 text-slate-200 border border-slate-600',
  }

  const glowStyle = glow ? 'shadow-lg shadow-indigo-500/25' : ''

  return (
    <button
      type={type}
      className={`${baseStyles} ${variantStyles[variant]} ${glowStyle} ${className}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
