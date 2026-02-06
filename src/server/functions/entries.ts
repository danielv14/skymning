import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getDb } from '../db'
import { entries, chatMessages } from '../db/schema'
import { eq, desc, and, gte, lt, count } from 'drizzle-orm'
import { setISOWeek, setISOWeekYear, startOfISOWeek, addWeeks, format, getDay, parseISO } from 'date-fns'
import { dateString, weekInputSchema } from '../../constants'
import {
  calculateMoodLevel,
  calculateTrend,
  calculateStability,
  type MoodInsight,
} from '../../constants/moodInsight'
import { getTodayDateString, subtractDays } from '../../utils/date'
import { authMiddleware } from '../middleware/auth'

export const getTodayEntry = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async () => {
    const db = getDb()
    const today = getTodayDateString()
    const entry = await db.query.entries.findFirst({
      where: eq(entries.date, today),
    })
    return entry ?? null
  })

const getEntryForDateSchema = z.object({
  date: dateString,
})

export const getEntryForDate = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator((data: unknown) => getEntryForDateSchema.parse(data))
  .handler(async ({ data }) => {
    const db = getDb()
    const entry = await db.query.entries.findFirst({
      where: eq(entries.date, data.date),
    })
    return entry ?? null
  })

export const hasAnyEntries = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async () => {
    const db = getDb()
    const entry = await db.query.entries.findFirst()
    return entry !== undefined
  })

export const getEntriesForWeek = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator((data: unknown) => weekInputSchema.parse(data))
  .handler(async ({ data }) => {
    const db = getDb()
    const { startDate, endDate } = getWeekDateRange(data.year, data.week)

    const weekEntries = await db.query.entries.findMany({
      where: and(gte(entries.date, startDate), lt(entries.date, endDate)),
      orderBy: [entries.date],
    })

    return weekEntries
  })

const createEntrySchema = z.object({
  mood: z.number().min(1).max(5),
  summary: z.string().min(1),
  date: dateString.optional(),
})

export const createEntry = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: unknown) => createEntrySchema.parse(data))
  .handler(async ({ data }) => {
    const db = getDb()
    const entryDate = data.date ?? getTodayDateString()

    const existingEntry = await db.query.entries.findFirst({
      where: eq(entries.date, entryDate),
    })

    if (existingEntry) {
      return { error: 'Du har redan skapat en reflektion för det datumet' }
    }

    const [entry] = await db
      .insert(entries)
      .values({
        date: entryDate,
        mood: data.mood,
        summary: data.summary,
      })
      .returning()

    await db.delete(chatMessages).where(eq(chatMessages.date, entryDate))

    return entry
  })

const trendInputSchema = z.object({
  limit: z.number().min(1).max(100).optional().default(50),
})

export const getMoodTrend = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator((data: unknown) => trendInputSchema.parse(data))
  .handler(async ({ data }) => {
    const db = getDb()
    const trendEntries = await db.query.entries.findMany({
      columns: {
        date: true,
        mood: true,
      },
      orderBy: [desc(entries.date)],
      limit: data.limit,
    })

    return trendEntries.reverse()
  })

const getWeekDateRange = (year: number, week: number) => {
  const dateInWeek = setISOWeek(setISOWeekYear(new Date(), year), week)
  const weekStart = startOfISOWeek(dateInWeek)
  const weekEnd = addWeeks(weekStart, 1)

  return {
    startDate: format(weekStart, 'yyyy-MM-dd'),
    endDate: format(weekEnd, 'yyyy-MM-dd'),
  }
}


const recentMoodSchema = z.object({
  days: z.number().min(1).max(30).optional().default(7),
})

export const getRecentMoodAverage = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator((data: unknown) => recentMoodSchema.parse(data))
  .handler(async ({ data }) => {
    const db = getDb()
    const today = getTodayDateString()
    const startDate = subtractDays(today, data.days)

    const recentEntries = await db.query.entries.findMany({
      columns: { mood: true },
      where: gte(entries.date, startDate),
    })

    if (recentEntries.length === 0) return null

    const average =
      recentEntries.reduce((sum, entry) => sum + entry.mood, 0) /
      recentEntries.length

    return {
      average,
      count: recentEntries.length,
    }
  })

export const getStreak = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async () => {
    const db = getDb()
    // Limit to 400 entries - more than enough for any realistic streak
    const allEntries = await db.query.entries.findMany({
      columns: { date: true },
      orderBy: [desc(entries.date)],
      limit: 400,
    })

    if (allEntries.length === 0) return 0

    const todayStr = getTodayDateString()
    const yesterdayStr = subtractDays(todayStr, 1)

    const latestEntryDate = allEntries[0]?.date

    // Streak is broken if latest entry is neither from today nor yesterday
    if (latestEntryDate !== todayStr && latestEntryDate !== yesterdayStr) {
      return 0
    }

    const entryDates = new Set(allEntries.map((e) => e.date))

    let streak = 0
    let checkDateStr = latestEntryDate

    while (entryDates.has(checkDateStr)) {
      streak++
      checkDateStr = subtractDays(checkDateStr, 1)
    }

    return streak
  })

const updateEntrySchema = z.object({
  id: z.number(),
  mood: z.number().min(1).max(5),
  summary: z.string().min(1),
})

export const updateEntry = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: unknown) => updateEntrySchema.parse(data))
  .handler(async ({ data }) => {
    const db = getDb()

    const [updated] = await db
      .update(entries)
      .set({
        mood: data.mood,
        summary: data.summary,
      })
      .where(eq(entries.id, data.id))
      .returning()

    return updated ?? null
  })

const moodInsightSchema = z.object({
  entryCount: z.number().min(4).max(30).optional().default(14),
})

export const getMoodInsight = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator((data: unknown) => moodInsightSchema.parse(data))
  .handler(async ({ data }): Promise<MoodInsight | null> => {
    const db = getDb()

    const totalEntries = await db
      .select({ count: count() })
      .from(entries)
      .then((result) => result[0]?.count ?? 0)

    if (totalEntries < data.entryCount) return null

    const recentEntries = await db.query.entries.findMany({
      columns: { mood: true },
      orderBy: [desc(entries.date)],
      limit: data.entryCount,
    })

    const moods = recentEntries.map((e) => e.mood)
    const halfIndex = Math.floor(moods.length / 2)

    const recentHalf = moods.slice(0, halfIndex)
    const olderHalf = moods.slice(halfIndex)

    const recentAverage =
      recentHalf.reduce((sum, m) => sum + m, 0) / recentHalf.length
    const olderAverage =
      olderHalf.reduce((sum, m) => sum + m, 0) / olderHalf.length
    const totalAverage = moods.reduce((sum, m) => sum + m, 0) / moods.length

    return {
      trend: calculateTrend(recentAverage, olderAverage),
      stability: calculateStability(moods),
      average: totalAverage,
      level: calculateMoodLevel(totalAverage),
      entryCount: moods.length,
    }
  })

export type WeekdayPattern = {
  dayIndex: number
  dayName: string
  average: number
  count: number
}

export type WeekdayPatternResult = {
  patterns: WeekdayPattern[]
  bestDay: WeekdayPattern
  worstDay: WeekdayPattern
  totalEntries: number
}

const WEEKDAY_NAMES = ['söndag', 'måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag']

export const getWeekdayPatterns = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async (): Promise<WeekdayPatternResult | null> => {
    const db = getDb()

    const cutoffDate = subtractDays(getTodayDateString(), 90)

    const allEntries = await db.query.entries.findMany({
      columns: { date: true, mood: true },
      where: gte(entries.date, cutoffDate),
    })

    // Need at least 14 entries for meaningful patterns
    if (allEntries.length < 14) return null

    const dayBuckets: { total: number; count: number }[] = Array.from(
      { length: 7 },
      () => ({ total: 0, count: 0 })
    )

    for (const entry of allEntries) {
      const dayIndex = getDay(parseISO(entry.date))
      dayBuckets[dayIndex].total += entry.mood
      dayBuckets[dayIndex].count += 1
    }

    const patterns: WeekdayPattern[] = dayBuckets
      .map((bucket, dayIndex) => ({
        dayIndex,
        dayName: WEEKDAY_NAMES[dayIndex],
        average: bucket.count > 0 ? bucket.total / bucket.count : 0,
        count: bucket.count,
      }))
      .filter((pattern) => pattern.count > 0)

    if (patterns.length < 3) return null

    const bestDay = patterns.reduce((best, current) =>
      current.average > best.average ? current : best
    )
    const worstDay = patterns.reduce((worst, current) =>
      current.average < worst.average ? current : worst
    )

    return {
      patterns,
      bestDay,
      worstDay,
      totalEntries: allEntries.length,
    }
  })
