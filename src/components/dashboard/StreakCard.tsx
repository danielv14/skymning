import { StreakFlame } from '../mood/MoodIcons'
import { Card } from '../ui/Card'

type StreakCardProps = {
  streak: number
}

export const StreakCard = ({ streak }: StreakCardProps) => {
  const hasStreak = streak > 0

  return (
    <Card
      className={
        hasStreak
          ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20'
          : 'bg-gradient-to-r from-slate-500/10 to-slate-600/10 border-slate-500/20'
      }
    >
      <div className="flex items-center gap-4">
        <StreakFlame
          size={40}
          className={hasStreak ? 'text-amber-400' : 'text-slate-500'}
        />
        <div>
          {hasStreak ? (
            <>
              <p className="text-2xl font-bold text-white">
                {streak} {streak === 1 ? 'dag' : 'dagar'}
              </p>
              <p className="text-slate-400 text-sm">
                {streak === 1 ? 'Du har börjat en streak!' : 'i rad med reflektion'}
              </p>
            </>
          ) : (
            <>
              <p className="text-lg font-semibold text-white">Ingen aktiv streak</p>
              <p className="text-slate-400 text-sm">Skriv idag för att starta en ny!</p>
            </>
          )}
        </div>
      </div>
    </Card>
  )
}
