import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '../db'
import { entries } from '../db/schema'
import { eq, desc, and, gte, lt } from 'drizzle-orm'
import { startOfISOWeek, endOfISOWeek, format } from 'date-fns'
import { weekInputSchema } from '../../constants'

// Hämta dagens inlägg (om det finns)
export const getTodayEntry = createServerFn({ method: 'GET' }).handler(
  async () => {
    const today = new Date().toISOString().split('T')[0]
    const entry = await db.query.entries.findFirst({
      where: eq(entries.date, today),
    })
    return entry ?? null
  }
)

// Kolla om det finns några inlägg alls (för välkomstvy)
export const hasAnyEntries = createServerFn({ method: 'GET' }).handler(
  async () => {
    const entry = await db.query.entries.findFirst()
    return entry !== undefined
  }
)

// Hämta inlägg för en specifik vecka
export const getEntriesForWeek = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => weekInputSchema.parse(data))
  .handler(async ({ data }) => {
    // Räkna ut start- och slutdatum för veckan
    const { startDate, endDate } = getWeekDateRange(data.year, data.week)

    const weekEntries = await db.query.entries.findMany({
      where: and(gte(entries.date, startDate), lt(entries.date, endDate)),
      orderBy: [entries.date],
    })

    return weekEntries
  })

// Skapa nytt inlägg
const createEntrySchema = z.object({
  mood: z.number().min(1).max(5),
  summary: z.string().min(1),
})

export const createEntry = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => createEntrySchema.parse(data))
  .handler(async ({ data }) => {
    const today = new Date().toISOString().split('T')[0]

    const [entry] = await db
      .insert(entries)
      .values({
        date: today,
        mood: data.mood,
        summary: data.summary,
      })
      .returning()

    return entry
  })

// Hämta mood-trend (senaste X inlägg)
const trendInputSchema = z.object({
  limit: z.number().min(1).max(100).optional().default(50),
})

export const getMoodTrend = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => trendInputSchema.parse(data))
  .handler(async ({ data }) => {
    const trendEntries = await db.query.entries.findMany({
      columns: {
        date: true,
        mood: true,
      },
      orderBy: [desc(entries.date)],
      limit: data.limit,
    })

    // Returnera i kronologisk ordning (äldst först)
    return trendEntries.reverse()
  })

// Hjälpfunktion för att räkna ut veckonummer → datumintervall (ISO 8601, måndag först)
const getWeekDateRange = (year: number, week: number) => {
  // Skapa ett datum i den önskade veckan (torsdag i vecka X är alltid i vecka X)
  const jan4 = new Date(year, 0, 4)
  const thursdayOfWeek1 = startOfISOWeek(jan4)
  
  // Räkna ut måndagen i önskad vecka
  const mondayOfWeek = new Date(thursdayOfWeek1)
  mondayOfWeek.setDate(thursdayOfWeek1.getDate() + (week - 1) * 7)
  
  const startDate = startOfISOWeek(mondayOfWeek)
  const endDate = endOfISOWeek(mondayOfWeek)
  
  // Lägg till en dag på endDate för lt-jämförelse
  const endDatePlusOne = new Date(endDate)
  endDatePlusOne.setDate(endDate.getDate() + 1)

  return {
    startDate: format(startDate, 'yyyy-MM-dd'),
    endDate: format(endDatePlusOne, 'yyyy-MM-dd'),
  }
}

// Exportera hjälpfunktionen för användning i andra filer
export { getWeekDateRange }

// Hjälpfunktion för att subtrahera dagar från ett datumstring (YYYY-MM-DD)
const subtractDays = (dateStr: string, days: number): string => {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() - days)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const recentMoodSchema = z.object({
  days: z.number().min(1).max(30).optional().default(7),
})

export const getRecentMoodAverage = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => recentMoodSchema.parse(data))
  .handler(async ({ data }) => {
    const today = new Date().toISOString().split('T')[0]
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

// Räkna streak (antal dagar i rad med inlägg)
export const getStreak = createServerFn({ method: 'GET' }).handler(async () => {
  // Hämta alla entries sorterade på datum (nyast först)
  const allEntries = await db.query.entries.findMany({
    columns: { date: true },
    orderBy: [desc(entries.date)],
  })

  if (allEntries.length === 0) return 0

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const yesterdayStr = subtractDays(todayStr, 1)

  const latestEntryDate = allEntries[0]?.date

  // Streak är bruten om senaste entry varken är från idag eller igår
  if (latestEntryDate !== todayStr && latestEntryDate !== yesterdayStr) {
    return 0
  }

  // Skapa en Set för snabb lookup av vilka datum som har entries
  const entryDates = new Set(allEntries.map((e) => e.date))

  // Räkna streak bakåt från senaste entry
  let streak = 0
  let checkDateStr = latestEntryDate

  while (entryDates.has(checkDateStr)) {
    streak++
    checkDateStr = subtractDays(checkDateStr, 1)
  }

  return streak
})
