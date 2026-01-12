import { format, subDays } from 'date-fns'

export const getTodayDateString = (): string => {
  return format(new Date(), 'yyyy-MM-dd')
}

export const subtractDays = (dateStr: string, days: number): string => {
  return format(subDays(new Date(dateStr), days), 'yyyy-MM-dd')
}

export const formatTime = (date: Date | string | undefined | null): string | null => {
  if (!date) return null
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
}
