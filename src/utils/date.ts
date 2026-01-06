import { format, subDays, addDays as dateFnsAddDays } from 'date-fns'

export const getTodayDateString = (): string => {
  return format(new Date(), 'yyyy-MM-dd')
}

export const subtractDays = (dateStr: string, days: number): string => {
  return format(subDays(new Date(dateStr), days), 'yyyy-MM-dd')
}

export const addDays = (dateStr: string, days: number): string => {
  return format(dateFnsAddDays(new Date(dateStr), days), 'yyyy-MM-dd')
}
