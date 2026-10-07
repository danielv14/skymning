import { getDay, parseISO } from 'date-fns'

export type WeekdayPattern = {
  dayIndex: number
  dayName: string
  average: number
  count: number
}

export type WeekdayPatternResult = {
  patterns: WeekdayPattern[]
  bestDay: WeekdayPattern
  worstDay: WeekdayPattern
  totalEntries: number
}

const WEEKDAY_NAMES = ['söndag', 'måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag']

const MIN_ENTRIES_FOR_PATTERNS = 14
const MIN_WEEKDAYS_FOR_PATTERNS = 3

export const calculateWeekdayPatterns = (
  entries: Array<{ date: string; mood: number }>,
): WeekdayPatternResult | null => {
  if (entries.length < MIN_ENTRIES_FOR_PATTERNS) return null

  const dayBuckets = Array.from({ length: 7 }, () => ({ total: 0, count: 0 }))

  for (const entry of entries) {
    const dayIndex = getDay(parseISO(entry.date))
    dayBuckets[dayIndex].total += entry.mood
    dayBuckets[dayIndex].count += 1
  }

  const patterns: WeekdayPattern[] = dayBuckets
    .map((bucket, dayIndex) => ({
      dayIndex,
      dayName: WEEKDAY_NAMES[dayIndex],
      average: bucket.count > 0 ? bucket.total / bucket.count : 0,
      count: bucket.count,
    }))
    .filter((pattern) => pattern.count > 0)

  if (patterns.length < MIN_WEEKDAYS_FOR_PATTERNS) return null

  const bestDay = patterns.reduce((best, current) =>
    current.average > best.average ? current : best,
  )
  const worstDay = patterns.reduce((worst, current) =>
    current.average < worst.average ? current : worst,
  )

  return { patterns, bestDay, worstDay, totalEntries: entries.length }
}
