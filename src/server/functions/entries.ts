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

// Räkna streak (antal dagar i rad med inlägg)
export const getStreak = createServerFn({ method: 'GET' }).handler(async () => {
  // Hämta alla entries sorterade på datum (nyast först)
  const allEntries = await db.query.entries.findMany({
    columns: { date: true },
    orderBy: [desc(entries.date)],
  })

  if (allEntries.length === 0) return 0

  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Kolla om dagens entry finns, annars börja räkna från igår
  const todayStr = today.toISOString().split('T')[0]
  const hasToday = allEntries[0]?.date === todayStr

  let checkDate = new Date(today)
  if (!hasToday) {
    // Om inget inlägg idag, kolla om det finns ett från igår
    checkDate.setDate(checkDate.getDate() - 1)
  }

  for (const entry of allEntries) {
    const checkDateStr = checkDate.toISOString().split('T')[0]

    if (entry.date === checkDateStr) {
      streak++
      checkDate.setDate(checkDate.getDate() - 1)
    } else if (entry.date < checkDateStr) {
      // Streaken är bruten
      break
    }
  }

  return streak
})
