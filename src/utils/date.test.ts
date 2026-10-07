import { describe, expect, it } from 'vitest'
import {
  formatRelativeDay,
  formatTime,
  getCurrentHour,
  getTimeOfDayGreeting,
  getTodayDateString,
  subtractDays,
} from './date'

describe('getTodayDateString', () => {
  it('uses Swedish summer time (UTC+2) for the date boundary', () => {
    expect(getTodayDateString(new Date('2026-07-15T21:59:00Z'))).toBe('2026-07-15')
    expect(getTodayDateString(new Date('2026-07-15T22:30:00Z'))).toBe('2026-07-16')
  })

  it('uses Swedish winter time (UTC+1) for the date boundary', () => {
    expect(getTodayDateString(new Date('2026-01-15T22:59:00Z'))).toBe('2026-01-15')
    expect(getTodayDateString(new Date('2026-01-15T23:30:00Z'))).toBe('2026-01-16')
  })

  it('rolls over to a new year', () => {
    expect(getTodayDateString(new Date('2026-12-31T23:30:00Z'))).toBe('2027-01-01')
  })
})

describe('getCurrentHour', () => {
  it('returns the hour in Swedish time', () => {
    expect(getCurrentHour(new Date('2026-07-15T15:30:00Z'))).toBe(17)
    expect(getCurrentHour(new Date('2026-01-15T15:30:00Z'))).toBe(16)
    expect(getCurrentHour(new Date('2026-07-15T22:10:00Z'))).toBe(0)
  })
})

describe('getTimeOfDayGreeting', () => {
  it('greets based on Swedish time, not UTC', () => {
    // 20:30 UTC is 22:30 in Stockholm during summer
    expect(getTimeOfDayGreeting(null, new Date('2026-07-15T20:30:00Z'))).toBe('God natt')
    expect(getTimeOfDayGreeting(null, new Date('2026-07-15T06:00:00Z'))).toBe('God morgon')
  })

  it('uses gentler greetings after a bad day', () => {
    expect(getTimeOfDayGreeting(1, new Date('2026-07-15T06:00:00Z'))).toBe(
      'Hoppas idag blir bättre',
    )
  })
})

describe('formatRelativeDay', () => {
  const now = new Date('2026-10-07T22:30:00Z') // Thursday 2026-10-08 00:30 in Stockholm

  it('resolves today and yesterday in Swedish time', () => {
    expect(formatRelativeDay('2026-10-08', now)).toBe('idag')
    expect(formatRelativeDay('2026-10-07', now)).toBe('igår')
    expect(formatRelativeDay('2026-10-09', now)).toBe('imorgon')
  })

  it('names older days by weekday', () => {
    expect(formatRelativeDay('2026-10-05', now)).toBe('i måndags')
  })
})

describe('subtractDays', () => {
  it('handles month boundaries and DST changes', () => {
    expect(subtractDays('2026-03-01', 1)).toBe('2026-02-28')
    expect(subtractDays('2026-03-30', 1)).toBe('2026-03-29')
    expect(subtractDays('2026-10-26', 1)).toBe('2026-10-25')
  })
})

describe('formatTime', () => {
  it('formats timestamps in Swedish time', () => {
    expect(formatTime('2026-07-15T20:05:00Z')).toBe('22:05')
    expect(formatTime(null)).toBeNull()
  })
})
