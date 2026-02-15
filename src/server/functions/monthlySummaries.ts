import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getDb } from '../db'
import { monthlySummaries, entries, weeklySummaries } from '../db/schema'
import { and, eq, gte, lt } from 'drizzle-orm'
import {
  startOfMonth,
  endOfMonth,
  addDays,
  format,
  getISOWeek,
  getISOWeekYear,
  eachWeekOfInterval,
  startOfISOWeek,
  addWeeks,
} from 'date-fns'
import { monthInputSchema } from '../../constants'
import { authMiddleware } from '../middleware/auth'
import { getDateFromISOWeek } from '../../utils/isoWeek'
import type { Entry, WeeklySummary, MonthlySummary } from '../db/schema'

export const getMonthlySummary = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator((data: unknown) => monthInputSchema.parse(data))
  .handler(async ({ data }) => {
    const db = getDb()
    const summary = await db.query.monthlySummaries.findFirst({
      where: and(
        eq(monthlySummaries.year, data.year),
        eq(monthlySummaries.month, data.month)
      ),
    })
    return summary ?? null
  })

const createMonthlySummarySchema = z.object({
  year: z.number(),
  month: z.number().min(1).max(12),
  summary: z.string().min(1),
})

export const createMonthlySummary = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: unknown) => createMonthlySummarySchema.parse(data))
  .handler(async ({ data }) => {
    const db = getDb()
    const [summary] = await db
      .insert(monthlySummaries)
      .values({
        year: data.year,
        month: data.month,
        summary: data.summary,
      })
      .returning()

    return summary
  })

export const updateMonthlySummary = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: unknown) => createMonthlySummarySchema.parse(data))
  .handler(async ({ data }) => {
    const db = getDb()
    const [updated] = await db
      .update(monthlySummaries)
      .set({
        summary: data.summary,
      })
      .where(
        and(
          eq(monthlySummaries.year, data.year),
          eq(monthlySummaries.month, data.month)
        )
      )
      .returning()

    return updated
  })

export const getEntriesForMonth = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator((data: unknown) => monthInputSchema.parse(data))
  .handler(async ({ data }) => {
    const db = getDb()
    const { startDate, endDate } = getMonthDateRange(data.year, data.month)

    const monthEntries = await db.query.entries.findMany({
      where: and(gte(entries.date, startDate), lt(entries.date, endDate)),
      orderBy: [entries.date],
    })

    return monthEntries
  })

export const getWeeklySummariesForMonth = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator((data: unknown) => monthInputSchema.parse(data))
  .handler(async ({ data }) => {
    const db = getDb()
    const isoWeeks = getISOWeeksInMonth(data.year, data.month)

    const summaries: WeeklySummary[] = []
    for (const isoWeek of isoWeeks) {
      const summary = await db.query.weeklySummaries.findFirst({
        where: and(
          eq(weeklySummaries.year, isoWeek.year),
          eq(weeklySummaries.week, isoWeek.week)
        ),
      })
      if (summary) {
        summaries.push(summary)
      }
    }

    return summaries
  })

export type WeekOverview = {
  year: number
  week: number
  entries: Entry[]
  averageMood: number | null
  weeklySummary: WeeklySummary | null
}

export type MonthlyOverviewResult = {
  weeks: WeekOverview[]
  overallAverage: number | null
  totalEntries: number
  monthlySummary: MonthlySummary | null
  previousMonthAverage: number | null
}

export const getMonthlyOverview = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator((data: unknown) => monthInputSchema.parse(data))
  .handler(async ({ data }): Promise<MonthlyOverviewResult> => {
    const db = getDb()
    const { startDate, endDate } = getMonthDateRange(data.year, data.month)

    const monthEntries = await db.query.entries.findMany({
      where: and(gte(entries.date, startDate), lt(entries.date, endDate)),
      orderBy: [entries.date],
    })

    const isoWeeks = getISOWeeksInMonth(data.year, data.month)

    const weeks: WeekOverview[] = []
    for (const isoWeek of isoWeeks) {
      const weekStart = startOfISOWeek(getDateFromISOWeek(isoWeek.year, isoWeek.week))
      const weekStartDate = format(weekStart, 'yyyy-MM-dd')
      const weekEndDate = format(addWeeks(weekStart, 1), 'yyyy-MM-dd')

      const weekEntries = monthEntries.filter(
        (entry) => entry.date >= weekStartDate && entry.date < weekEndDate
      )

      const averageMood = weekEntries.length > 0
        ? weekEntries.reduce((sum, entry) => sum + entry.mood, 0) / weekEntries.length
        : null

      const summary = await db.query.weeklySummaries.findFirst({
        where: and(
          eq(weeklySummaries.year, isoWeek.year),
          eq(weeklySummaries.week, isoWeek.week)
        ),
      })

      weeks.push({
        year: isoWeek.year,
        week: isoWeek.week,
        entries: weekEntries,
        averageMood,
        weeklySummary: summary ?? null,
      })
    }

    const overallAverage = monthEntries.length > 0
      ? monthEntries.reduce((sum, entry) => sum + entry.mood, 0) / monthEntries.length
      : null

    const monthlySummary = await db.query.monthlySummaries.findFirst({
      where: and(
        eq(monthlySummaries.year, data.year),
        eq(monthlySummaries.month, data.month)
      ),
    })

    const prevMonthDate = new Date(data.year, data.month - 2, 1)
    const { startDate: prevStartDate, endDate: prevEndDate } = getMonthDateRange(
      prevMonthDate.getFullYear(),
      prevMonthDate.getMonth() + 1
    )

    const prevMonthEntries = await db.query.entries.findMany({
      where: and(gte(entries.date, prevStartDate), lt(entries.date, prevEndDate)),
    })

    const previousMonthAverage = prevMonthEntries.length > 0
      ? prevMonthEntries.reduce((sum, entry) => sum + entry.mood, 0) / prevMonthEntries.length
      : null

    return {
      weeks,
      overallAverage,
      totalEntries: monthEntries.length,
      monthlySummary: monthlySummary ?? null,
      previousMonthAverage,
    }
  })

const getMonthDateRange = (year: number, month: number) => {
  const date = new Date(year, month - 1, 1)
  return {
    startDate: format(startOfMonth(date), 'yyyy-MM-dd'),
    // One day past end of month for exclusive lt comparison
    endDate: format(addDays(endOfMonth(date), 1), 'yyyy-MM-dd'),
  }
}

const getISOWeeksInMonth = (year: number, month: number): Array<{ year: number; week: number }> => {
  const monthStart = new Date(year, month - 1, 1)
  const monthEnd = endOfMonth(monthStart)

  const weekStarts = eachWeekOfInterval(
    { start: monthStart, end: monthEnd },
    { weekStartsOn: 1 }
  )

  const seen = new Set<string>()
  const isoWeeks: Array<{ year: number; week: number }> = []

  for (const weekStart of weekStarts) {
    const isoYear = getISOWeekYear(weekStart)
    const isoWeek = getISOWeek(weekStart)
    const key = `${isoYear}-${isoWeek}`
    if (!seen.has(key)) {
      seen.add(key)
      isoWeeks.push({ year: isoYear, week: isoWeek })
    }
  }

  return isoWeeks
}
