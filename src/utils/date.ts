import {
  format,
  subDays,
  parseISO,
  isToday,
  isYesterday,
  isTomorrow,
  isFuture,
  getDay,
} from 'date-fns'
import { sv } from 'date-fns/locale'

export const getTodayDateString = (): string => {
  return format(new Date(), 'yyyy-MM-dd')
}

const PAST_DAY_NAMES: Record<number, string> = {
  0: 'i söndags',
  1: 'i måndags',
  2: 'i tisdags',
  3: 'i onsdags',
  4: 'i torsdags',
  5: 'i fredags',
  6: 'i lördags',
}

export const formatRelativeDay = (dateString: string): string => {
  const date = parseISO(dateString)

  if (isToday(date)) {
    return 'idag'
  }

  if (isYesterday(date)) {
    return 'igår'
  }

  if (isTomorrow(date)) {
    return 'imorgon'
  }

  if (isFuture(date)) {
    return format(date, 'EEEE', { locale: sv })
  }

  const dayOfWeek = getDay(date)
  return PAST_DAY_NAMES[dayOfWeek]
}

export const subtractDays = (dateStr: string, days: number): string => {
  return format(subDays(new Date(dateStr), days), 'yyyy-MM-dd')
}

export const getTimeOfDayGreeting = (yesterdayMood?: number | null): string => {
  const hour = new Date().getHours()

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
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
}
