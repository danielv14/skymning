import { asc, desc, eq, gte } from 'drizzle-orm'
import { MAX_STREAK_ENTRIES, WEEKDAY_PATTERN_DAYS } from '@/constants'
import { buildMoodInsight, type MoodInsight } from '@/constants/moodInsight'
import { getDb } from '@/server/db'
import { entries } from '@/server/db/schema'
import { getTodayDateString, subtractDays } from '@/utils/date'
import { calculateStreak } from '@/utils/streak'
import { calculateWeekdayPatterns, type WeekdayPatternResult } from '@/utils/weekdayPatterns'

// Server-only query helpers. Kept out of the createServerFn modules so that client bundles,
// which import those modules for their RPC stubs, never pull in the database binding.

export const findEntryByDate = async (date: string) => {
  const entry = await getDb().query.entries.findFirst({
    where: eq(entries.date, date),
  })
  return entry ?? null
}

export const findMoodTrend = async () => {
  return getDb().query.entries.findMany({
    columns: { date: true, mood: true },
    orderBy: [asc(entries.date)],
  })
}

export const findStreak = async (): Promise<number> => {
  const recentEntries = await getDb().query.entries.findMany({
    columns: { date: true },
    orderBy: [desc(entries.date)],
    limit: MAX_STREAK_ENTRIES,
  })

  return calculateStreak(
    recentEntries.map((entry) => entry.date),
    getTodayDateString(),
  )
}

export const findMoodInsight = async (entryCount: number): Promise<MoodInsight | null> => {
  const recentEntries = await getDb().query.entries.findMany({
    columns: { mood: true },
    orderBy: [desc(entries.date)],
    limit: entryCount,
  })

  if (recentEntries.length < entryCount) return null

  return buildMoodInsight(recentEntries.map((entry) => entry.mood))
}

export const findWeekdayPatterns = async (): Promise<WeekdayPatternResult | null> => {
  const cutoffDate = subtractDays(getTodayDateString(), WEEKDAY_PATTERN_DAYS)

  const recentEntries = await getDb().query.entries.findMany({
    columns: { date: true, mood: true },
    where: gte(entries.date, cutoffDate),
  })

  return calculateWeekdayPatterns(recentEntries)
}

export const findRecentEntries = async (limit: number) => {
  return getDb().query.entries.findMany({
    columns: { date: true, mood: true, summary: true },
    orderBy: [desc(entries.date)],
    limit,
  })
}
