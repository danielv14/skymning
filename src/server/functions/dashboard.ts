import { createServerFn } from '@tanstack/react-start'
import { MOOD_INSIGHT_DAYS } from '@/constants'
import { authMiddleware } from '@/server/middleware/auth'
import {
  findExploreChatPreview,
  findIncompletePastChat,
  findTodayChatPreview,
} from '@/server/queries/chat'
import { findLastWeekSummary, findUserContextStaleness } from '@/server/queries/dashboard'
import {
  findEntryByDate,
  findMoodInsight,
  findMoodTrend,
  findStreak,
  findWeekdayPatterns,
} from '@/server/queries/entries'
import { getTodayDateString, subtractDays } from '@/utils/date'

// One round-trip for the whole dashboard instead of one HTTP request (and one session
// decryption) per card on client-side navigation.
export const getDashboardData = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async () => {
    const today = getTodayDateString()
    const yesterdayDate = subtractDays(today, 1)

    const [
      todayEntry,
      moodTrend,
      streak,
      moodInsight,
      lastWeekSummary,
      chatPreview,
      incompletePastChat,
      weekdayPatterns,
      yesterdayEntry,
      contextStaleness,
      exploreChatPreview,
    ] = await Promise.all([
      findEntryByDate(today),
      findMoodTrend(),
      findStreak(),
      findMoodInsight(MOOD_INSIGHT_DAYS),
      findLastWeekSummary(),
      findTodayChatPreview(),
      findIncompletePastChat(),
      findWeekdayPatterns(),
      findEntryByDate(yesterdayDate),
      findUserContextStaleness(),
      findExploreChatPreview(),
    ])

    return {
      hasEntries: moodTrend.length > 0,
      todayEntry,
      moodTrend,
      streak,
      moodInsight,
      lastWeekSummary,
      chatPreview,
      incompletePastChat,
      weekdayPatterns,
      yesterdayDate,
      yesterdayEntry,
      contextStaleness,
      exploreChatPreview,
    }
  })
