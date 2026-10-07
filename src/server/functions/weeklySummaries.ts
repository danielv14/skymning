import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getDb } from '@/server/db'
import { weeklySummaries } from '@/server/db/schema'
import { and, eq } from 'drizzle-orm'
import { getISOWeek, getISOWeekYear } from 'date-fns'
import { getTodayDate } from '@/utils/date'
import { weekInputSchema } from '@/constants'
import { authMiddleware } from '@/server/middleware/auth'

export const getWeeklySummary = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator((data: unknown) => weekInputSchema.parse(data))
  .handler(async ({ data }) => {
    const db = getDb()
    const summary = await db.query.weeklySummaries.findFirst({
      where: and(eq(weeklySummaries.year, data.year), eq(weeklySummaries.week, data.week)),
    })
    return summary ?? null
  })

const createWeeklySummarySchema = z.object({
  year: z.number(),
  week: z.number().min(1).max(53),
  summary: z.string().min(1),
})

export const createWeeklySummary = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: unknown) => createWeeklySummarySchema.parse(data))
  .handler(async ({ data }) => {
    const db = getDb()
    const [summary] = await db
      .insert(weeklySummaries)
      .values({
        year: data.year,
        week: data.week,
        summary: data.summary,
      })
      .returning()

    return summary
  })

export const getCurrentWeek = (): { year: number; week: number } => {
  const now = getTodayDate()
  return {
    year: getISOWeekYear(now),
    week: getISOWeek(now),
  }
}

export const updateWeeklySummary = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: unknown) => createWeeklySummarySchema.parse(data))
  .handler(async ({ data }) => {
    const db = getDb()
    const [updated] = await db
      .update(weeklySummaries)
      .set({
        summary: data.summary,
      })
      .where(and(eq(weeklySummaries.year, data.year), eq(weeklySummaries.week, data.week)))
      .returning()

    return updated
  })
