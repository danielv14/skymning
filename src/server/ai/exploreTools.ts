import { toolDefinition } from '@tanstack/ai'
import { and, asc, desc, eq, gte, like, lt, sql } from 'drizzle-orm'
import { z } from 'zod'
import { getMoodLabel } from '../../constants'
import { getTodayDateString, subtractDays } from '../../utils/date'
import { truncateText } from '../../utils/string'
import { getDb } from '../db'
import { entries, monthlySummaries, weeklySummaries } from '../db/schema'
import { lookupEntry } from './tools'

const searchEntriesDefinition = toolDefinition({
  name: 'search_entries',
  description:
    'Search journal entries by keyword in the summary text. Returns up to 10 results across the full history.',
  inputSchema: z.object({
    query: z.string().describe('Search keyword or phrase'),
  }),
})

export const searchEntries = searchEntriesDefinition.server(
  async ({ query }) => {
    const db = getDb()

    const results = await db
      .select({
        date: entries.date,
        mood: entries.mood,
        summary: entries.summary,
      })
      .from(entries)
      .where(like(entries.summary, `%${query}%`))
      .orderBy(desc(entries.date))
      .limit(10)

    return results.map((entry) => ({
      date: entry.date,
      mood: entry.mood,
      moodLabel: getMoodLabel(entry.mood),
      summaryExcerpt: truncateText(entry.summary, 200),
    }))
  },
)

const getEntriesByPeriodDefinition = toolDefinition({
  name: 'get_entries_by_period',
  description:
    'Get all journal entries within a date range. Useful for reviewing a specific week, month, or custom period.',
  inputSchema: z.object({
    startDate: z.string().describe('Start date YYYY-MM-DD (inclusive)'),
    endDate: z.string().describe('End date YYYY-MM-DD (exclusive)'),
  }),
})

const MAX_PERIOD_ENTRIES = 31

export const getEntriesByPeriod = getEntriesByPeriodDefinition.server(
  async ({ startDate, endDate }) => {
    const db = getDb()

    const results = await db
      .select({
        date: entries.date,
        mood: entries.mood,
        summary: entries.summary,
      })
      .from(entries)
      .where(and(gte(entries.date, startDate), lt(entries.date, endDate)))
      .orderBy(asc(entries.date))
      .limit(MAX_PERIOD_ENTRIES)

    const mappedEntries = results.map((entry) => ({
      date: entry.date,
      mood: entry.mood,
      moodLabel: getMoodLabel(entry.mood),
      summary: entry.summary,
    }))

    if (results.length === MAX_PERIOD_ENTRIES) {
      return {
        entries: mappedEntries,
        note: `Returnerar max ${MAX_PERIOD_ENTRIES} inlägg. Använd ett kortare datumintervall för fler resultat.`,
      }
    }

    return { entries: mappedEntries }
  },
)

const getMoodTrendDefinition = toolDefinition({
  name: 'get_mood_trend',
  description:
    'Get mood statistics for a time period. Returns average mood, distribution, and best/worst days. Supports up to 365 days.',
  inputSchema: z.object({
    days: z
      .number()
      .min(7)
      .max(365)
      .describe('Number of days to look back (7-365)'),
  }),
})

export const getMoodTrend = getMoodTrendDefinition.server(async ({ days }) => {
  const db = getDb()
  const startDate = subtractDays(getTodayDateString(), days)

  const results = await db
    .select({
      date: entries.date,
      mood: entries.mood,
    })
    .from(entries)
    .where(gte(entries.date, startDate))
    .orderBy(desc(entries.date))

  if (results.length === 0) {
    return { entryCount: 0, message: 'Inga inlägg hittades under perioden.' }
  }

  const moods = results.map((r) => r.mood)
  const averageMood = moods.reduce((sum, m) => sum + m, 0) / moods.length

  const moodDistribution: Record<number, number> = {}
  for (const mood of moods) {
    moodDistribution[mood] = (moodDistribution[mood] ?? 0) + 1
  }

  const bestDay = results.reduce((best, current) =>
    current.mood > best.mood ? current : best,
  )
  const worstDay = results.reduce((worst, current) =>
    current.mood < worst.mood ? current : worst,
  )

  return {
    averageMood: Math.round(averageMood * 10) / 10,
    entryCount: results.length,
    days,
    moodDistribution,
    bestDay: {
      date: bestDay.date,
      mood: bestDay.mood,
      moodLabel: getMoodLabel(bestDay.mood),
    },
    worstDay: {
      date: worstDay.date,
      mood: worstDay.mood,
      moodLabel: getMoodLabel(worstDay.mood),
    },
  }
})

const getWeeklySummaryDefinition = toolDefinition({
  name: 'get_weekly_summary',
  description:
    'Get the AI-generated weekly summary for a specific ISO week. Returns the summary text if it exists.',
  inputSchema: z.object({
    year: z.number().describe('Year (e.g. 2025)'),
    week: z.number().min(1).max(53).describe('ISO week number (1-53)'),
  }),
})

export const getWeeklySummary = getWeeklySummaryDefinition.server(
  async ({ year, week }) => {
    const db = getDb()

    const result = await db.query.weeklySummaries.findFirst({
      where: and(
        eq(weeklySummaries.year, year),
        eq(weeklySummaries.week, week),
      ),
    })

    if (!result) {
      return { found: false, year, week }
    }

    return {
      found: true,
      year: result.year,
      week: result.week,
      summary: result.summary,
    }
  },
)

const getMonthlySummaryDefinition = toolDefinition({
  name: 'get_monthly_summary',
  description:
    'Get the AI-generated monthly summary for a specific month. Returns the summary text if it exists.',
  inputSchema: z.object({
    year: z.number().describe('Year (e.g. 2025)'),
    month: z.number().min(1).max(12).describe('Month number (1-12)'),
  }),
})

export const getMonthlySummary = getMonthlySummaryDefinition.server(
  async ({ year, month }) => {
    const db = getDb()

    const result = await db.query.monthlySummaries.findFirst({
      where: and(
        eq(monthlySummaries.year, year),
        eq(monthlySummaries.month, month),
      ),
    })

    if (!result) {
      return { found: false, year, month }
    }

    return {
      found: true,
      year: result.year,
      month: result.month,
      summary: result.summary,
    }
  },
)

const getMoodByWeekdayDefinition = toolDefinition({
  name: 'get_mood_by_weekday',
  description:
    'Get average mood per weekday (Monday-Sunday) over a period. Useful for finding day-of-week patterns.',
  inputSchema: z.object({
    days: z
      .number()
      .min(14)
      .max(365)
      .describe('Number of days to look back (14-365)'),
  }),
})

export const getMoodByWeekday = getMoodByWeekdayDefinition.server(
  async ({ days }) => {
    const db = getDb()
    const startDate = subtractDays(getTodayDateString(), days)

    const results = await db
      .select({
        date: entries.date,
        mood: entries.mood,
      })
      .from(entries)
      .where(gte(entries.date, startDate))

    const weekdayNames = [
      'Söndag',
      'Måndag',
      'Tisdag',
      'Onsdag',
      'Torsdag',
      'Fredag',
      'Lördag',
    ]
    const weekdayData: Record<string, { total: number; count: number }> = {}

    for (const entry of results) {
      const dayOfWeek = new Date(entry.date).getDay()
      const dayName = weekdayNames[dayOfWeek]
      if (!weekdayData[dayName]) {
        weekdayData[dayName] = { total: 0, count: 0 }
      }
      weekdayData[dayName].total += entry.mood
      weekdayData[dayName].count += 1
    }

    const averages = Object.entries(weekdayData).map(
      ([day, { total, count }]) => ({
        day,
        averageMood: Math.round((total / count) * 10) / 10,
        entryCount: count,
      }),
    )

    // Sort Monday-Sunday
    const order = [
      'Måndag',
      'Tisdag',
      'Onsdag',
      'Torsdag',
      'Fredag',
      'Lördag',
      'Söndag',
    ]
    averages.sort((a, b) => order.indexOf(a.day) - order.indexOf(b.day))

    return { days, averages }
  },
)

const getEntryStatsDefinition = toolDefinition({
  name: 'get_entry_stats',
  description:
    'Get overall statistics about the journal: total entries, first and last entry dates, total days covered.',
  inputSchema: z.object({}),
})

export const getEntryStats = getEntryStatsDefinition.server(async () => {
  const db = getDb()

  const [result] = await db
    .select({
      totalEntries: sql<number>`count(*)`,
      firstEntryDate: sql<string>`min(date)`,
      lastEntryDate: sql<string>`max(date)`,
    })
    .from(entries)

  if (result.totalEntries === 0) {
    return { totalEntries: 0, message: 'Inga inlägg finns ännu.' }
  }

  const daysCovered =
    Math.ceil(
      (new Date(result.lastEntryDate).getTime() -
        new Date(result.firstEntryDate).getTime()) /
        86400000,
    ) + 1

  return {
    totalEntries: result.totalEntries,
    firstEntryDate: result.firstEntryDate,
    lastEntryDate: result.lastEntryDate,
    daysCovered,
  }
})

export const exploreTools = [
  searchEntries,
  lookupEntry,
  getEntriesByPeriod,
  getMoodTrend,
  getWeeklySummary,
  getMonthlySummary,
  getMoodByWeekday,
  getEntryStats,
]
