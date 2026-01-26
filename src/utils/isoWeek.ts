import {
  getISOWeek,
  getISOWeekYear,
  setISOWeek,
  setISOWeekYear,
  addWeeks,
  subWeeks,
  startOfISOWeek,
  addDays,
  format,
} from 'date-fns'

export const getDateFromISOWeek = (year: number, week: number): Date => {
  return setISOWeek(setISOWeekYear(new Date(), year), week)
}

export const getAdjacentWeek = (
  year: number,
  week: number,
  direction: 'prev' | 'next'
): { year: number; week: number } => {
  const date = getDateFromISOWeek(year, week)
  const adjacentDate = direction === 'prev' ? subWeeks(date, 1) : addWeeks(date, 1)
  return { year: getISOWeekYear(adjacentDate), week: getISOWeek(adjacentDate) }
}

export const getWeekDays = (year: number, week: number): string[] => {
  const weekStart = startOfISOWeek(getDateFromISOWeek(year, week))
  return Array.from({ length: 7 }, (_, i) =>
    format(addDays(weekStart, i), 'yyyy-MM-dd')
  )
}
