import { StarField } from '../StarField'

type AppHeaderProps = {
  children: React.ReactNode
  starCount?: number
}

export const AppHeader = ({ children, starCount = 20 }: AppHeaderProps) => {
  return (
    <header className="bg-horizon relative overflow-hidden py-6 sm:py-8 px-6 sm:px-8 border-b border-slate-700/50">
      <StarField starCount={starCount} />
      <div className="max-w-2xl mx-auto relative z-10">{children}</div>
    </header>
  )
}
