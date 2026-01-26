import { Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { AppHeader } from './AppHeader'

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
    <AppHeader>
      <div className="flex items-center gap-4">
        <Link to={backTo}>
          <button className="p-2.5 -ml-2 rounded-full hover:bg-white/10 active:bg-white/15 transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95">
            {backIcon || <ArrowLeft className="w-5 h-5 text-slate-300" />}
          </button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold text-white tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        {rightContent && <div className="shrink-0">{rightContent}</div>}
      </div>
    </AppHeader>
  )
}
