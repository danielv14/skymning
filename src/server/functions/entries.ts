import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getDb } from '../db'
import { entries, chatMessages } from '../db/schema'
import { eq, desc, and, gte, lt } from 'drizzle-orm'
import { startOfISOWeek, endOfISOWeek, format } from 'date-fns'
import { weekInputSchema } from '../../constants'
import { getTodayDateString, subtractDays } from '../../utils/date'
import { requireAuth } from '../auth/session'

export const getTodayEntry = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireAuth()
    const db = getDb()
    const today = getTodayDateString()
    const entry = await db.query.entries.findFirst({
      where: eq(entries.date, today),
    })
    return entry ?? null
  }
)

export const hasAnyEntries = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireAuth()
    const db = getDb()
    const entry = await db.query.entries.findFirst()
    return entry !== undefined
  }
)

export const getEntriesForWeek = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => weekInputSchema.parse(data))
  .handler(async ({ data }) => {
    await requireAuth()
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
})

export const createEntry = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => createEntrySchema.parse(data))
  .handler(async ({ data }) => {
    await requireAuth()
    const db = getDb()
    const today = getTodayDateString()

    const [entry] = await db
      .insert(entries)
      .values({
        date: today,
        mood: data.mood,
        summary: data.summary,
      })
      .returning()

    // Clear today's chat after saving the reflection
    await db.delete(chatMessages).where(eq(chatMessages.date, today))

    return entry
  })

const trendInputSchema = z.object({
  limit: z.number().min(1).max(100).optional().default(50),
})

export const getMoodTrend = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => trendInputSchema.parse(data))
  .handler(async ({ data }) => {
    await requireAuth()
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
  // Create a date in the desired week (Thursday of week X is always in week X)
  const jan4 = new Date(year, 0, 4)
  const thursdayOfWeek1 = startOfISOWeek(jan4)
  
  const mondayOfWeek = new Date(thursdayOfWeek1)
  mondayOfWeek.setDate(thursdayOfWeek1.getDate() + (week - 1) * 7)
  
  const startDate = startOfISOWeek(mondayOfWeek)
  const endDate = endOfISOWeek(mondayOfWeek)
  
  // Add one day to endDate for lt comparison
  const endDatePlusOne = new Date(endDate)
  endDatePlusOne.setDate(endDate.getDate() + 1)

  return {
    startDate: format(startDate, 'yyyy-MM-dd'),
    endDate: format(endDatePlusOne, 'yyyy-MM-dd'),
  }
}


const recentMoodSchema = z.object({
  days: z.number().min(1).max(30).optional().default(7),
})

export const getRecentMoodAverage = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => recentMoodSchema.parse(data))
  .handler(async ({ data }) => {
    await requireAuth()
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

export const getStreak = createServerFn({ method: 'GET' }).handler(async () => {
  await requireAuth()
  const db = getDb()
  const allEntries = await db.query.entries.findMany({
    columns: { date: true },
    orderBy: [desc(entries.date)],
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
  .inputValidator((data: unknown) => updateEntrySchema.parse(data))
  .handler(async ({ data }) => {
    await requireAuth()
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
