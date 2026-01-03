import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '../db'
import { weeklySummaries } from '../db/schema'
import { and, eq } from 'drizzle-orm'
import { getISOWeek, getISOWeekYear } from 'date-fns'
import { weekInputSchema } from '../../constants'

// Hämta veckosummering (om den finns)

export const getWeeklySummary = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => weekInputSchema.parse(data))
  .handler(async ({ data }) => {
    const summary = await db.query.weeklySummaries.findFirst({
      where: and(
        eq(weeklySummaries.year, data.year),
        eq(weeklySummaries.week, data.week)
      ),
    })
    return summary ?? null
  })

// Spara veckosummering
const createWeeklySummarySchema = z.object({
  year: z.number(),
  week: z.number().min(1).max(53),
  summary: z.string().min(1),
})

export const createWeeklySummary = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => createWeeklySummarySchema.parse(data))
  .handler(async ({ data }) => {
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

// Hjälpfunktion: hämta aktuell vecka (ISO 8601)
export const getCurrentWeek = (): { year: number; week: number } => {
  const now = new Date()
  return {
    year: getISOWeekYear(now),
    week: getISOWeek(now),
  }
}
