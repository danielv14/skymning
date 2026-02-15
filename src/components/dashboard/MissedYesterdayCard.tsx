import { Link } from '@tanstack/react-router'
import { CalendarX } from 'lucide-react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'

type MissedYesterdayCardProps = {
  yesterdayDate: string
}

export const MissedYesterdayCard = ({ yesterdayDate }: MissedYesterdayCardProps) => {
  return (
    <Card className="bg-gradient-to-r from-violet-500/8 to-fuchsia-500/8 border-violet-500/20">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="shrink-0 p-2 rounded-xl bg-violet-500/15">
          <CalendarX className="w-4 h-4 text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-300">
            Du glömde logga igår
          </p>
        </div>
        <Link to="/quick" search={{ date: yesterdayDate }} className="shrink-0">
          <Button variant="ghost" size="sm" className="text-violet-300 hover:text-violet-200 hover:bg-violet-500/15">
            Fyll i →
          </Button>
        </Link>
      </div>
    </Card>
  )
}
