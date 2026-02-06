import { createFileRoute, Link } from '@tanstack/react-router'
import { Calendar, User, MessageCircle, Clock } from 'lucide-react'
import {
  getTodayEntry,
  getMoodTrend,
  getStreak,
  getMoodInsight,
  hasAnyEntries,
  getEntryForDate,
  getWeekdayPatterns,
} from '../../server/functions/entries'
import { getLastWeekSummary } from '../../server/functions/weeklySummaries'
import { getChatPreview, getIncompletePastChat, clearPastChats } from '../../server/functions/chat'
import { MoodTrend } from '../../components/mood/MoodTrend'
import { Welcome } from '../../components/Welcome'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { AppHeader } from '../../components/ui/AppHeader'
import { StreakCard } from '../../components/dashboard/StreakCard'
import { MoodInsightCard } from '../../components/dashboard/MoodInsightCard'
import { TodayEntryCard } from '../../components/dashboard/TodayEntryCard'
import { WeekdayPatternCard } from '../../components/dashboard/WeekdayPatternCard'
import { formatTime, formatRelativeDay, getTimeOfDayGreeting } from '../../utils/date'

const HomePage = () => {
  const { hasEntries, todayEntry, moodTrend, streak, moodInsight, lastWeekSummary, chatPreview, incompletePastChat, weekdayPatterns } = Route.useLoaderData()

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
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Skymning</h1>
            <p className="text-slate-400 mt-1 text-sm sm:text-base">{getTimeOfDayGreeting()}</p>
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

      <main className="max-w-2xl mx-auto p-4 sm:p-8 space-y-4 sm:space-y-5 stagger-children">
        {chatPreview && !todayEntry && (
          <Card className="bg-gradient-to-r from-cyan-500/10 to-teal-500/10 border-cyan-500/30">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="shrink-0 p-2.5 rounded-2xl bg-cyan-500/20">
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

        {incompletePastChat && !todayEntry && (
          <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="shrink-0 p-2.5 rounded-2xl bg-amber-500/20">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 mb-2">
                  <h3 className="font-semibold text-white">Osparad reflektion</h3>
                  <span className="text-xs text-slate-400">
                    från {formatRelativeDay(incompletePastChat.date)}
                  </span>
                </div>
                <p className="text-sm text-slate-300 mb-3">
                  Du har en ofullständig reflektion som aldrig sparades.
                </p>
                <Link to="/reflect">
                  <Button variant="ghost" size="sm" className="w-full sm:w-auto bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30">
                    Hantera
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        <TodayEntryCard entry={todayEntry} hasChatPreview={!!chatPreview} />

        <div className="bento-grid">
          <div className="bento-half">
            <StreakCard streak={streak} />
          </div>

          {moodInsight && (
            <div className="bento-half">
              <MoodInsightCard insight={moodInsight} />
            </div>
          )}

          {lastWeekSummary && (
            <div className="bento-full">
              <Card>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Förra veckan</h3>
                  <Link
                    to="/timeline/$year/$week"
                    params={{
                      year: String(lastWeekSummary.year),
                      week: String(lastWeekSummary.week),
                    }}
                    className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors link-animated"
                  >
                    Se hela veckan →
                  </Link>
                </div>
                <p className="text-slate-300 leading-relaxed line-clamp-3">{lastWeekSummary.summary}</p>
              </Card>
            </div>
          )}

          {weekdayPatterns && (
            <div className="bento-full">
              <WeekdayPatternCard data={weekdayPatterns} />
            </div>
          )}
        </div>

        {moodTrend.length > 0 && (
          <div className="sm:max-w-sm">
            <Card>
              <MoodTrend data={moodTrend} />
            </Card>
          </div>
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
    const [hasEntries, todayEntry, moodTrend, streak, moodInsight, lastWeekSummary, chatPreview, incompletePastChat, weekdayPatterns] =
      await Promise.all([
        hasAnyEntries(),
        getTodayEntry(),
        getMoodTrend({ data: { limit: 30 } }),
        getStreak(),
        getMoodInsight({ data: { entryCount: 14 } }),
        getLastWeekSummary(),
        getChatPreview(),
        getIncompletePastChat(),
        getWeekdayPatterns(),
      ])

    let validPastChat = incompletePastChat
    if (incompletePastChat) {
      const pastDateEntry = await getEntryForDate({ data: { date: incompletePastChat.date } })
      if (pastDateEntry || todayEntry) {
        await clearPastChats()
        validPastChat = null
      }
    }

    return {
      hasEntries,
      todayEntry,
      moodTrend,
      streak,
      moodInsight,
      lastWeekSummary,
      chatPreview,
      incompletePastChat: validPastChat,
      weekdayPatterns,
    }
  },
  component: HomePage,
})
