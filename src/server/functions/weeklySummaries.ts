import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getDb } from '../db'
import { weeklySummaries } from '../db/schema'
import { and, eq } from 'drizzle-orm'
import { getISOWeek, getISOWeekYear, subWeeks } from 'date-fns'
import { weekInputSchema } from '../../constants'

export const getWeeklySummary = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => weekInputSchema.parse(data))
  .handler(async ({ data }) => {
    const db = getDb()
    const summary = await db.query.weeklySummaries.findFirst({
      where: and(
        eq(weeklySummaries.year, data.year),
        eq(weeklySummaries.week, data.week)
      ),
    })
    return summary ?? null
  })

const createWeeklySummarySchema = z.object({
  year: z.number(),
  week: z.number().min(1).max(53),
  summary: z.string().min(1),
})

export const createWeeklySummary = createServerFn({ method: 'POST' })
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
  const now = new Date()
  return {
    year: getISOWeekYear(now),
    week: getISOWeek(now),
  }
}

export const getLastWeekSummary = createServerFn({ method: 'GET' }).handler(
  async () => {
    const db = getDb()
    const oneWeekAgo = subWeeks(new Date(), 1)
    const lastWeek = {
      year: getISOWeekYear(oneWeekAgo),
      week: getISOWeek(oneWeekAgo),
    }

    const summary = await db.query.weeklySummaries.findFirst({
      where: and(
        eq(weeklySummaries.year, lastWeek.year),
        eq(weeklySummaries.week, lastWeek.week)
      ),
    })

    return summary ? { ...summary, ...lastWeek } : null
  }
)

const updateWeeklySummarySchema = z.object({
  year: z.number(),
  week: z.number().min(1).max(53),
  summary: z.string().min(1),
})

export const updateWeeklySummary = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => updateWeeklySummarySchema.parse(data))
  .handler(async ({ data }) => {
    const db = getDb()
    const [updated] = await db
      .update(weeklySummaries)
      .set({
        summary: data.summary,
        createdAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(weeklySummaries.year, data.year),
          eq(weeklySummaries.week, data.week)
        )
      )
      .returning()

    return updated
  })
