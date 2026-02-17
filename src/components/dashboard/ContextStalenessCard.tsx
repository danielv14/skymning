import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { UserPen } from 'lucide-react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { dismissContextReminder } from '../../server/functions/userContext'

export const ContextStalenessCard = () => {
  const [dismissed, setDismissed] = useState(false)

  const handleDismiss = async () => {
    setDismissed(true)
    await dismissContextReminder()
  }

  if (dismissed) return null

  return (
    <Card className="bg-gradient-to-r from-amber-500/8 to-yellow-500/8 border-amber-500/20">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="shrink-0 p-2 rounded-xl bg-amber-500/15">
          <UserPen className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-300">
            Det var ett tag sedan du uppdaterade din beskrivning — stämmer den fortfarande?
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDismiss}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Avfärda
          </button>
          <Link to="/about-me" viewTransition>
            <Button variant="ghost" size="sm" className="text-amber-300 hover:text-amber-200 hover:bg-amber-500/15">
              Uppdatera →
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  )
}
