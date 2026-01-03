import { createFileRoute, Link } from '@tanstack/react-router'
import { getTodayEntry, getMoodTrend, getStreak } from '../server/functions/entries'
import { hasAnyEntries } from '../server/functions/entries'
import { MoodTrend } from '../components/mood/MoodTrend'
import { MoodEmoji } from '../components/mood/MoodEmoji'
import { StreakFlame } from '../components/mood/MoodIcons'
import { Welcome } from '../components/Welcome'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'

const HomePage = () => {
  const { hasEntries, todayEntry, moodTrend, streak } = Route.useLoaderData()

  // Visa välkomstvy om inga inlägg finns
  if (!hasEntries) {
    return <Welcome />
  }

  return (
    <div className="min-h-screen">
      {/* Header med gradient */}
      <header className="bg-horizon stars-header py-6 sm:py-8 px-6 sm:px-8 view-transition-header">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Skymning</h1>
          <p className="text-slate-300 mt-1">Din dagliga reflektion</p>
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
              <div className="flex gap-3">
                <Link to="/reflect" className="flex-1">
                  <Button className="w-full">Prata med AI</Button>
                </Link>
                <Link to="/quick" className="flex-1">
                  <Button variant="secondary" className="w-full">Snabb logg</Button>
                </Link>
              </div>
            </div>
          )}
        </Card>

        {/* Streak */}
        {streak > 0 && (
          <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20">
            <div className="flex items-center gap-4">
              <StreakFlame size={40} className="text-amber-400" />
              <div>
                <p className="text-2xl font-bold text-white">{streak} {streak === 1 ? 'dag' : 'dagar'}</p>
                <p className="text-slate-400 text-sm">
                  {streak === 1 ? 'Du har börjat en streak!' : 'i rad med reflektion'}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Moodtrend */}
        {moodTrend.length > 0 && (
          <Card>
            <h2 className="text-lg font-semibold text-white mb-4">Hur du har mått</h2>
            <MoodTrend data={moodTrend} />
          </Card>
        )}

        {/* Navigation */}
        <div className="flex gap-3">
          <Link to="/timeline" className="flex-1">
            <Button variant="secondary" className="w-full">
              Se tidslinje
            </Button>
          </Link>
          <Link to="/about-me" className="flex-1">
            <Button variant="secondary" className="w-full">
              Om mig
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [{ title: 'Skymning' }],
  }),
  loader: async () => {
    const [hasEntries, todayEntry, moodTrend, streak] = await Promise.all([
      hasAnyEntries(),
      getTodayEntry(),
      getMoodTrend({ data: { limit: 30 } }),
      getStreak(),
    ])

    return {
      hasEntries,
      todayEntry,
      moodTrend,
      streak,
    }
  },
  component: HomePage,
})
