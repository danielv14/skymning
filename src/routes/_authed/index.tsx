import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Calendar, User, MessageCircle } from 'lucide-react'
import {
  getTodayEntry,
  getMoodTrend,
  getStreak,
  getRecentMoodAverage,
  hasAnyEntries,
} from '../../server/functions/entries'
import { getLastWeekSummary } from '../../server/functions/weeklySummaries'
import { getChatPreview } from '../../server/functions/chat'
import { MoodTrend } from '../../components/mood/MoodTrend'
import { Welcome } from '../../components/Welcome'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { AppHeader } from '../../components/ui/AppHeader'
import { StreakCard } from '../../components/dashboard/StreakCard'
import { RecentMoodCard } from '../../components/dashboard/RecentMoodCard'
import { TodayEntryCard } from '../../components/dashboard/TodayEntryCard'
import { formatTime } from '../../utils/date'
import type { Entry } from '../../server/db/schema'

const HomePage = () => {
  const loaderData = Route.useLoaderData()
  const [todayEntry, setTodayEntry] = useState<Entry | null>(loaderData.todayEntry)
  const { hasEntries, moodTrend, streak, recentMood, lastWeekSummary, chatPreview } = loaderData

  if (!hasEntries) {
    return <Welcome />
  }

  const truncateMessage = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength).trim() + '...'
  }

  return (
    <div className="min-h-screen">
      <AppHeader>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Skymning</h1>
            <p className="text-slate-300 mt-1">Din dagliga reflektion</p>
          </div>
          <nav className="flex gap-2 sm:gap-3">
            <Link
              to="/timeline"
              className="nav-link flex items-center gap-2 p-2.5 sm:px-4 sm:py-2 rounded-full hover:bg-white/10 active:bg-white/15 transition-all duration-200 text-slate-300 hover:text-white"
              title="Tidslinje"
            >
              <Calendar className="w-5 h-5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline text-sm font-medium">Tidslinje</span>
            </Link>
            <Link
              to="/about-me"
              className="nav-link flex items-center gap-2 p-2.5 sm:px-4 sm:py-2 rounded-full hover:bg-white/10 active:bg-white/15 transition-all duration-200 text-slate-300 hover:text-white"
              title="Om mig"
            >
              <User className="w-5 h-5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline text-sm font-medium">Om mig</span>
            </Link>
          </nav>
        </div>
      </AppHeader>

      <main className="max-w-2xl mx-auto p-6 sm:p-8 space-y-6 sm:space-y-8 stagger-children">
        {chatPreview && !todayEntry && (
          <Card className="bg-gradient-to-r from-cyan-500/10 to-teal-500/10 border-cyan-500/30">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="shrink-0 p-2 rounded-full bg-cyan-500/20">
                <MessageCircle className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 mb-2">
                  <h3 className="font-semibold text-white">Pågående reflektion</h3>
                  <span className="text-xs text-slate-400">
                    {chatPreview.messageCount} {chatPreview.messageCount === 1 ? 'meddelande' : 'meddelanden'}
                    {chatPreview.lastMessage && ` · ${formatTime(chatPreview.lastMessage.createdAt)}`}
                  </span>
                </div>
                {chatPreview.lastMessage && (
                  <p className="text-sm text-slate-300 mb-3 line-clamp-2">
                    {truncateMessage(chatPreview.lastMessage.content, 120)}
                  </p>
                )}
                <Link to="/reflect">
                  <Button size="sm" className="w-full sm:w-auto">
                    Fortsätt chatta
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        <TodayEntryCard entry={todayEntry} hasChatPreview={!!chatPreview} onUpdated={setTodayEntry} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StreakCard streak={streak} />
          {recentMood && <RecentMoodCard average={recentMood.average} />}
        </div>

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
                className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Se hela veckan →
              </Link>
            </div>
            <p className="text-slate-300 line-clamp-3">{lastWeekSummary.summary}</p>
          </Card>
        )}

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

export const Route = createFileRoute('/_authed/')({
  head: () => ({
    meta: [{ title: 'Skymning' }],
  }),
  loader: async () => {
    const [hasEntries, todayEntry, moodTrend, streak, recentMood, lastWeekSummary, chatPreview] =
      await Promise.all([
        hasAnyEntries(),
        getTodayEntry(),
        getMoodTrend({ data: { limit: 30 } }),
        getStreak(),
        getRecentMoodAverage({ data: { days: 7 } }),
        getLastWeekSummary(),
        getChatPreview(),
      ])

    return {
      hasEntries,
      todayEntry,
      moodTrend,
      streak,
      recentMood,
      lastWeekSummary,
      chatPreview,
    }
  },
  component: HomePage,
})
