import { toolDefinition } from '@tanstack/ai'
import { desc, gte } from 'drizzle-orm'
import { z } from 'zod'
import { getMoodLabel } from '../../constants'
import { subtractDays, getTodayDateString } from '../../utils/date'
import { getDb } from '../db'
import { entries } from '../db/schema'

const lookupEntryDefinition = toolDefinition({
  name: 'lookup_entry',
  description:
    'Look up a journal entry for a specific date. Use when the user references a particular day.',
  inputSchema: z.object({
    date: z.string().describe('ISO date YYYY-MM-DD'),
  }),
})

export const lookupEntry = lookupEntryDefinition.server(async ({ date }) => {
  const db = getDb()
  const entry = await db.query.entries.findFirst({
    where: (entries, { eq }) => eq(entries.date, date),
    columns: { date: true, mood: true, summary: true },
  })

  if (!entry) {
    return { found: false, date }
  }

  return {
    found: true,
    date: entry.date,
    mood: entry.mood,
    moodLabel: getMoodLabel(entry.mood),
    summary: entry.summary,
  }
})

const searchEntriesDefinition = toolDefinition({
  name: 'search_entries',
  description:
    'Search journal entries by keyword in the summary text. Limited to the last 90 days, max 5 results.',
  inputSchema: z.object({
    query: z.string().describe('Search keyword or phrase'),
  }),
})

export const searchEntries = searchEntriesDefinition.server(
  async ({ query }) => {
    const db = getDb()
    const today = getTodayDateString()
    const ninetyDaysAgo = subtractDays(today, 90)

    const results = await db
      .select({
        date: entries.date,
        mood: entries.mood,
        summary: entries.summary,
      })
      .from(entries)
      .where(gte(entries.date, ninetyDaysAgo))
      .orderBy(desc(entries.date))

    const filtered = results
      .filter((entry) =>
        entry.summary.toLowerCase().includes(query.toLowerCase()),
      )
      .slice(0, 5)

    return filtered.map((entry) => ({
      date: entry.date,
      mood: entry.mood,
      moodLabel: getMoodLabel(entry.mood),
      summaryExcerpt:
        entry.summary.length > 150
          ? `${entry.summary.slice(0, 150)}...`
          : entry.summary,
    }))
  },
)

const getMoodTrendDefinition = toolDefinition({
  name: 'get_mood_trend',
  description:
    'Get mood statistics for a time period. Returns average mood, distribution, and best/worst days.',
  inputSchema: z.object({
    days: z
      .number()
      .min(7)
      .max(90)
      .describe('Number of days to look back (7-90)'),
  }),
})

export const getMoodTrend = getMoodTrendDefinition.server(async ({ days }) => {
  const db = getDb()
  const today = getTodayDateString()
  const startDate = subtractDays(today, days)

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

export const chatTools = [lookupEntry, searchEntries, getMoodTrend]
