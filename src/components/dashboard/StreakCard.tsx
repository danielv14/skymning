import { StreakFlame } from '../mood/MoodIcons'
import { Card } from '../ui/Card'

type StreakCardProps = {
  streak: number
}

export const StreakCard = ({ streak }: StreakCardProps) => {
  const hasStreak = streak > 0

  return (
    <Card
      className={`h-full ${
        hasStreak
          ? 'bg-gradient-to-br from-orange-500/10 via-rose-500/10 to-pink-500/10 border-orange-500/20'
          : 'bg-gradient-to-br from-slate-500/10 to-slate-600/10 border-slate-500/20'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className={`relative ${hasStreak ? 'flame-animate' : ''}`}>
          <StreakFlame
            size={44}
            className={hasStreak ? 'text-orange-400' : 'text-slate-500'}
          />
          {hasStreak && (
            <div
              className="absolute inset-0 blur-lg opacity-50"
              style={{
                background: 'radial-gradient(circle, rgba(251, 146, 60, 0.6) 0%, transparent 70%)',
              }}
            />
          )}
        </div>
        <div>
          {hasStreak ? (
            <>
              <p className="text-3xl font-bold text-white tabular-nums">
                {streak}
                <span className="text-lg font-medium text-slate-300 ml-1.5">
                  {streak === 1 ? 'dag' : 'dagar'}
                </span>
              </p>
              <p className="text-slate-400 text-sm">
                {streak === 1 ? 'Streak startad!' : 'i rad'}
              </p>
            </>
          ) : (
            <>
              <p className="text-lg font-semibold text-white">Ingen streak</p>
              <p className="text-slate-400 text-sm">Börja en ny idag</p>
            </>
          )}
        </div>
      </div>
    </Card>
  )
}
