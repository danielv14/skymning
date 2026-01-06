import { createFileRoute, Link } from '@tanstack/react-router'
import { Calendar, User } from 'lucide-react'
import {
  getTodayEntry,
  getMoodTrend,
  getStreak,
  getRecentMoodAverage,
} from '../server/functions/entries'
import { hasAnyEntries } from '../server/functions/entries'
import { getLastWeekSummary } from '../server/functions/weeklySummaries'
import { MoodTrend } from '../components/mood/MoodTrend'
import { MoodEmoji } from '../components/mood/MoodEmoji'
import { StreakFlame } from '../components/mood/MoodIcons'
import { Welcome } from '../components/Welcome'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { getPeriodMoodDescription } from '../constants/mood'

const HomePage = () => {
  const { hasEntries, todayEntry, moodTrend, streak, recentMood, lastWeekSummary } =
    Route.useLoaderData()

  // Visa välkomstvy om inga inlägg finns
  if (!hasEntries) {
    return <Welcome />
  }

  return (
    <div className="min-h-screen">
      {/* Header med gradient */}
      <header className="bg-horizon stars-header py-6 sm:py-8 px-6 sm:px-8 view-transition-header">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Skymning</h1>
            <p className="text-slate-300 mt-1">Din dagliga reflektion</p>
          </div>
          <nav className="flex gap-2 sm:gap-4">
            <Link
              to="/timeline"
              className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-full hover:bg-white/10 transition-colors text-slate-300 hover:text-white"
              title="Tidslinje"
            >
              <Calendar className="w-5 h-5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline text-sm">Tidslinje</span>
            </Link>
            <Link
              to="/about-me"
              className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-full hover:bg-white/10 transition-colors text-slate-300 hover:text-white"
              title="Om mig"
            >
              <User className="w-5 h-5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline text-sm">Om mig</span>
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-6 sm:p-8 space-y-6 sm:space-y-8 -mt-4">
        {/* Dagens status */}
        <Card gradient>
          {todayEntry ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Dagens reflektion</h2>
                <MoodEmoji mood={todayEntry.mood} size="lg" layout="horizontal" />
              </div>
              <p className="text-slate-300">{todayEntry.summary}</p>
              <p className="text-sm text-slate-500">
                Du har redan reflekterat idag
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Hur var din dag?</h2>
              <p className="text-slate-300">
                Ta en stund att reflektera över dagens händelser och känslor.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/reflect" className="flex-1">
                  <Button className="w-full">Prata med AI</Button>
                </Link>
                <Link to="/quick" className="flex-1">
                  <Button variant="secondary" className="w-full">Skriv själv</Button>
                </Link>
              </div>
            </div>
          )}
        </Card>

        {/* Streak och snitthumör */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Streak */}
          <Card
            className={
              streak > 0
                ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20'
                : 'bg-gradient-to-r from-slate-500/10 to-slate-600/10 border-slate-500/20'
            }
          >
            <div className="flex items-center gap-4">
              <StreakFlame
                size={40}
                className={streak > 0 ? 'text-amber-400' : 'text-slate-500'}
              />
              <div>
                {streak > 0 ? (
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

          {/* Snitthumör senaste 7 dagarna */}
          {recentMood && (
            <Card className="bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border-indigo-500/20">
              <div className="flex items-center gap-4">
                <MoodEmoji mood={Math.round(recentMood.average)} size="lg" showLabel={false} />
                <div>
                  <p className="text-lg font-semibold text-white">
                    {getPeriodMoodDescription(recentMood.average)}
                  </p>
                  <p className="text-slate-400 text-sm">Senaste 7 dagarna</p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Förra veckans summering */}
        {lastWeekSummary && (
          <Card>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-400">Förra veckan</h3>
              <Link
                to="/timeline/$year/$week"
                params={{
                  year: String(lastWeekSummary.year),
                  week: String(lastWeekSummary.week),
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Se hela veckan →
              </Link>
            </div>
            <p className="text-slate-300 line-clamp-3">{lastWeekSummary.summary}</p>
          </Card>
        )}

        {/* Moodtrend */}
        {moodTrend.length > 0 && (
          <Card>
            <h2 className="text-lg font-semibold text-white mb-4">Hur du har mått</h2>
            <MoodTrend data={moodTrend} />
          </Card>
        )}
      </main>
    </div>
  )
}

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [{ title: 'Skymning' }],
  }),
  loader: async () => {
    const [hasEntries, todayEntry, moodTrend, streak, recentMood, lastWeekSummary] =
      await Promise.all([
        hasAnyEntries(),
        getTodayEntry(),
        getMoodTrend({ data: { limit: 30 } }),
        getStreak(),
        getRecentMoodAverage({ data: { days: 7 } }),
        getLastWeekSummary(),
      ])

    return {
      hasEntries,
      todayEntry,
      moodTrend,
      streak,
      recentMood,
      lastWeekSummary,
    }
  },
  component: HomePage,
})
