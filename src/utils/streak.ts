import { subtractDays } from '@/utils/date'

// A streak is still alive if the latest entry is from yesterday, so the user
// doesn't see it reset to zero before they've had a chance to reflect today.
export const calculateStreak = (entryDates: Iterable<string>, today: string): number => {
  const dates = new Set(entryDates)
  const yesterday = subtractDays(today, 1)

  let checkDate: string
  if (dates.has(today)) {
    checkDate = today
  } else if (dates.has(yesterday)) {
    checkDate = yesterday
  } else {
    return 0
  }

  let streak = 0
  while (dates.has(checkDate)) {
    streak++
    checkDate = subtractDays(checkDate, 1)
  }
  return streak
}
