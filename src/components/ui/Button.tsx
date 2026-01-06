type ButtonProps = {
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  disabled?: boolean
  onClick?: () => void
  type?: 'button' | 'submit'
}

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  onClick,
  type = 'button',
}: ButtonProps) => {
  const baseStyles =
    'rounded-2xl font-medium transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-6 py-3',
    lg: 'px-8 py-4 text-lg',
  }

  const variantStyles = {
    primary: 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white',
    secondary: 'bg-slate-700/50 hover:bg-slate-600/50 active:bg-slate-700/70 text-slate-200 border border-slate-600',
  }

  return (
    <button
      type={type}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
