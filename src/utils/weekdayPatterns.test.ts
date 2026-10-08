import { describe, expect, it } from 'vitest'
import { calculateWeekdayPatterns } from './weekdayPatterns'

const buildEntries = (count: number, moodForDay: (dayIndex: number) => number) =>
  Array.from({ length: count }, (_, index) => {
    // 2026-10-05 is a Monday
    const date = new Date(Date.UTC(2026, 9, 5 + index))
    return { date: date.toISOString().slice(0, 10), mood: moodForDay(date.getUTCDay()) }
  })

describe('calculateWeekdayPatterns', () => {
  it('requires at least 14 entries', () => {
    expect(calculateWeekdayPatterns(buildEntries(13, () => 3))).toBeNull()
  })

  it('finds the best and worst weekday', () => {
    const result = calculateWeekdayPatterns(
      buildEntries(21, (dayIndex) => (dayIndex === 5 ? 5 : dayIndex === 1 ? 1 : 3)),
    )

    expect(result?.bestDay.dayName).toBe('fredag')
    expect(result?.worstDay.dayName).toBe('måndag')
    expect(result?.patterns).toHaveLength(7)
    expect(result?.totalEntries).toBe(21)
  })

  it('requires entries on at least three weekdays', () => {
    const mondaysAndTuesdays = buildEntries(70, () => 3).filter((entry) => {
      const dayIndex = new Date(entry.date).getUTCDay()
      return dayIndex === 1 || dayIndex === 2
    })
    expect(mondaysAndTuesdays.length).toBeGreaterThanOrEqual(14)
    expect(calculateWeekdayPatterns(mondaysAndTuesdays)).toBeNull()
  })
})
