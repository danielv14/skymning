import { differenceInCalendarDays, format, getDay, parseISO, subDays } from 'date-fns'
import { sv } from 'date-fns/locale'

// The Worker runs in UTC while the user lives in Sweden. "Today" and the time of day must
// always be resolved in Swedish time, on both server and client, so that SSR output matches
// hydration and late-evening reflections land on the right date.
export const APP_TIME_ZONE = 'Europe/Stockholm'

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: APP_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const hourFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: APP_TIME_ZONE,
  hour: '2-digit',
  hourCycle: 'h23',
})

export const getTodayDateString = (now: Date = new Date()): string => {
  const parts = dateFormatter.formatToParts(now)
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? ''
  return `${getPart('year')}-${getPart('month')}-${getPart('day')}`
}

// Midnight (in the runtime's local zone) of the current Swedish calendar day.
// Safe to feed into date-fns helpers like getISOWeek, getMonth or isSameDay.
export const getTodayDate = (now: Date = new Date()): Date => parseISO(getTodayDateString(now))

export const getCurrentHour = (now: Date = new Date()): number => Number(hourFormatter.format(now))

const PAST_DAY_NAMES: Record<number, string> = {
  0: 'i söndags',
  1: 'i måndags',
  2: 'i tisdags',
  3: 'i onsdags',
  4: 'i torsdags',
  5: 'i fredags',
  6: 'i lördags',
}

export const formatRelativeDay = (dateString: string, now: Date = new Date()): string => {
  const date = parseISO(dateString)
  const daysFromToday = differenceInCalendarDays(date, getTodayDate(now))

  if (daysFromToday === 0) return 'idag'
  if (daysFromToday === -1) return 'igår'
  if (daysFromToday === 1) return 'imorgon'
  if (daysFromToday > 1) return format(date, 'EEEE', { locale: sv })

  return PAST_DAY_NAMES[getDay(date)]
}

export const subtractDays = (dateString: string, days: number): string => {
  return format(subDays(parseISO(dateString), days), 'yyyy-MM-dd')
}

export const getTimeOfDayGreeting = (
  yesterdayMood?: number | null,
  now: Date = new Date(),
): string => {
  const hour = getCurrentHour(now)

  if (yesterdayMood && yesterdayMood <= 2) {
    if (hour < 5) return 'Vila gott'
    if (hour < 10) return 'Hoppas idag blir bättre'
    if (hour < 13) return 'En ny dag, en ny chans'
    if (hour < 17) return 'Hoppas dagen har varit snällare'
    if (hour < 22) return 'Ta hand om dig ikväll'
    return 'Vila gott'
  }

  if (hour < 5) return 'God natt'
  if (hour < 10) return 'God morgon'
  if (hour < 13) return 'God förmiddag'
  if (hour < 17) return 'God eftermiddag'
  if (hour < 22) return 'God kväll'
  return 'God natt'
}

export const formatTime = (date: Date | string | undefined | null): string | null => {
  if (!date) return null
  const parsedDate = typeof date === 'string' ? new Date(date) : date
  return parsedDate.toLocaleTimeString('sv-SE', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: APP_TIME_ZONE,
  })
}
