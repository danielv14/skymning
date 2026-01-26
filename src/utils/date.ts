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

const FUTURE_DAY_NAMES: Record<number, string> = {
  0: 'söndag',
  1: 'måndag',
  2: 'tisdag',
  3: 'onsdag',
  4: 'torsdag',
  5: 'fredag',
  6: 'lördag',
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

  const dayOfWeek = getDay(date)

  if (isFuture(date)) {
    return FUTURE_DAY_NAMES[dayOfWeek]
  }

  return PAST_DAY_NAMES[dayOfWeek]
}

export const subtractDays = (dateStr: string, days: number): string => {
  return format(subDays(new Date(dateStr), days), 'yyyy-MM-dd')
}

export const formatTime = (date: Date | string | undefined | null): string | null => {
  if (!date) return null
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
}
