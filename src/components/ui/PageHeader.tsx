import { Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { StarField } from '../StarField'

type PageHeaderProps = {
  title: string
  subtitle?: string
  backTo?: string
  backIcon?: React.ReactNode
  rightContent?: React.ReactNode
}

export const PageHeader = ({
  title,
  subtitle,
  backTo = '/',
  backIcon,
  rightContent,
}: PageHeaderProps) => {
  return (
    <header className="px-6 sm:px-8 py-5 sm:py-6 bg-horizon relative overflow-hidden border-b border-slate-700/50">
      <StarField starCount={15} />
      <div className="max-w-2xl mx-auto flex items-center gap-3 relative z-10">
        <Link to={backTo}>
          <button className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer">
            {backIcon || <ArrowLeft className="w-5 h-5 text-slate-300" />}
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-white">{title}</h1>
          {subtitle && (
            <p className="text-sm text-slate-400">{subtitle}</p>
          )}
        </div>
        {rightContent && <div>{rightContent}</div>}
      </div>
    </header>
  )
}
