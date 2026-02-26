import { StreakFlame } from '../mood/MoodIcons'
import { Card } from '../ui/Card'

type StreakCardProps = {
  streak: number
}

type Milestone = {
  threshold: number
  label: string
  gradient: string
  border: string
}

const MILESTONES: Milestone[] = [
  { threshold: 365, label: 'Ett helt år! Legendariskt!', gradient: 'bg-gradient-to-br from-amber-500/20 via-yellow-500/15 to-orange-500/20', border: 'border-amber-400/40' },
  { threshold: 200, label: '200 dagar! Fenomenalt!', gradient: 'bg-gradient-to-br from-amber-500/15 via-yellow-500/10 to-orange-500/15', border: 'border-amber-400/30' },
  { threshold: 100, label: '100 dagar! Imponerande!', gradient: 'bg-gradient-to-br from-rose-500/15 via-pink-500/10 to-fuchsia-500/15', border: 'border-rose-400/30' },
  { threshold: 90, label: 'Tre månader!', gradient: 'bg-gradient-to-br from-rose-500/12 via-pink-500/8 to-fuchsia-500/12', border: 'border-rose-400/25' },
  { threshold: 60, label: 'Två månader!', gradient: 'bg-gradient-to-br from-violet-500/15 via-purple-500/10 to-indigo-500/15', border: 'border-violet-400/30' },
  { threshold: 45, label: '45 dagar!', gradient: 'bg-gradient-to-br from-violet-500/12 via-purple-500/8 to-indigo-500/12', border: 'border-violet-400/25' },
  { threshold: 30, label: 'En hel månad!', gradient: 'bg-gradient-to-br from-blue-500/12 via-indigo-500/8 to-violet-500/12', border: 'border-blue-400/25' },
  { threshold: 21, label: 'Tre veckor!', gradient: 'bg-gradient-to-br from-cyan-500/12 via-sky-500/8 to-blue-500/12', border: 'border-cyan-400/25' },
  { threshold: 14, label: 'Två veckor!', gradient: 'bg-gradient-to-br from-teal-500/12 via-cyan-500/8 to-sky-500/12', border: 'border-teal-400/25' },
  { threshold: 7, label: 'En hel vecka!', gradient: 'bg-gradient-to-br from-emerald-500/12 via-teal-500/8 to-green-500/12', border: 'border-emerald-400/25' },
]

const getActiveMilestone = (streak: number): Milestone | null => {
  return MILESTONES.find((milestone) => streak >= milestone.threshold) ?? null
}

const getNextMilestone = (streak: number): Milestone | null => {
  // Walk backwards to find the smallest milestone above the current streak
  for (let i = MILESTONES.length - 1; i >= 0; i--) {
    if (MILESTONES[i].threshold > streak) {
      return MILESTONES[i]
    }
  }
  return null
}

export const StreakCard = ({ streak }: StreakCardProps) => {
  const hasStreak = streak > 0
  const activeMilestone = hasStreak ? getActiveMilestone(streak) : null
  const nextMilestone = hasStreak ? getNextMilestone(streak) : null

  const cardGradient = activeMilestone
    ? `${activeMilestone.gradient} ${activeMilestone.border}`
    : hasStreak
      ? 'bg-gradient-to-br from-orange-500/10 via-rose-500/10 to-pink-500/10 border-orange-500/20'
      : 'bg-gradient-to-br from-slate-500/10 to-slate-600/10 border-slate-500/20'

  const subtextContent = () => {
    if (!hasStreak) return null

    if (activeMilestone) {
      return <p className="text-slate-300 text-sm font-medium">{activeMilestone.label}</p>
    }

    if (nextMilestone) {
      const remaining = nextMilestone.threshold - streak
      return (
        <p className="text-slate-400 text-sm">
          {remaining} {remaining === 1 ? 'dag' : 'dagar'} till nästa milstolpe
        </p>
      )
    }

    return <p className="text-slate-400 text-sm">{streak === 1 ? 'Streak startad!' : 'i rad'}</p>
  }

  return (
    <Card className={`h-full ${cardGradient}`}>
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
              {subtextContent()}
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
