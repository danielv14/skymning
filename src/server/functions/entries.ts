import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { and, eq, gte, lt } from 'drizzle-orm'
import { addWeeks, format, startOfISOWeek } from 'date-fns'
import { dateString, weekInputSchema } from '@/constants'
import { getDb } from '@/server/db'
import { chatMessages, entries } from '@/server/db/schema'
import { authMiddleware } from '@/server/middleware/auth'
import { findEntryByDate } from '@/server/queries/entries'
import { getTodayDateString } from '@/utils/date'
import { getDateFromISOWeek } from '@/utils/isoWeek'

const MAX_SUMMARY_LENGTH = 20_000

export const getTodayEntry = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(() => findEntryByDate(getTodayDateString()))

const getEntryForDateSchema = z.object({
  date: dateString,
})

export const getEntryForDate = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator((data: unknown) => getEntryForDateSchema.parse(data))
  .handler(({ data }) => findEntryByDate(data.date))

const getWeekDateRange = (year: number, week: number) => {
  const weekStart = startOfISOWeek(getDateFromISOWeek(year, week))
  const weekEnd = addWeeks(weekStart, 1)

  return {
    startDate: format(weekStart, 'yyyy-MM-dd'),
    endDate: format(weekEnd, 'yyyy-MM-dd'),
  }
}

export const getEntriesForWeek = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator((data: unknown) => weekInputSchema.parse(data))
  .handler(async ({ data }) => {
    const { startDate, endDate } = getWeekDateRange(data.year, data.week)

    return getDb().query.entries.findMany({
      where: and(gte(entries.date, startDate), lt(entries.date, endDate)),
      orderBy: [entries.date],
    })
  })

const createEntrySchema = z.object({
  mood: z.number().int().min(1).max(5),
  summary: z.string().min(1).max(MAX_SUMMARY_LENGTH),
  date: dateString.optional(),
})

export const createEntry = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: unknown) => createEntrySchema.parse(data))
  .handler(async ({ data }) => {
    const db = getDb()
    const entryDate = data.date ?? getTodayDateString()

    // Batched so the insert and chat cleanup are atomic. onConflictDoNothing turns a
    // concurrent double-submit into the friendly error below instead of a constraint crash.
    const [[entry]] = await db.batch([
      db
        .insert(entries)
        .values({ date: entryDate, mood: data.mood, summary: data.summary })
        .onConflictDoNothing({ target: entries.date })
        .returning(),
      db.delete(chatMessages).where(eq(chatMessages.date, entryDate)),
    ])

    if (!entry) {
      return { error: 'Du har redan skapat en reflektion för det datumet' }
    }

    return entry
  })

const updateEntrySchema = z.object({
  id: z.number(),
  mood: z.number().int().min(1).max(5),
  summary: z.string().min(1).max(MAX_SUMMARY_LENGTH),
})

export const updateEntry = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: unknown) => updateEntrySchema.parse(data))
  .handler(async ({ data }) => {
    const [updated] = await getDb()
      .update(entries)
      .set({ mood: data.mood, summary: data.summary })
      .where(eq(entries.id, data.id))
      .returning()

    return updated ?? null
  })

const deleteEntrySchema = z.object({
  id: z.number(),
})

export const deleteEntry = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: unknown) => deleteEntrySchema.parse(data))
  .handler(async ({ data }) => {
    const db = getDb()

    const entry = await db.query.entries.findFirst({
      columns: { date: true },
      where: eq(entries.id, data.id),
    })

    if (!entry) return null

    await db.batch([
      db.delete(chatMessages).where(eq(chatMessages.date, entry.date)),
      db.delete(entries).where(eq(entries.id, data.id)),
    ])

    return { success: true }
  })
