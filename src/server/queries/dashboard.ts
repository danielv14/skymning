import { and, eq } from 'drizzle-orm'
import { getISOWeek, getISOWeekYear, subDays, subWeeks } from 'date-fns'
import { getDb } from '@/server/db'
import { weeklySummaries } from '@/server/db/schema'
import { getTodayDate } from '@/utils/date'

const CONTEXT_STALENESS_DAYS = 30

export const findLastWeekSummary = async () => {
  const oneWeekAgo = subWeeks(getTodayDate(), 1)
  const lastWeek = {
    year: getISOWeekYear(oneWeekAgo),
    week: getISOWeek(oneWeekAgo),
  }

  const summary = await getDb().query.weeklySummaries.findFirst({
    where: and(eq(weeklySummaries.year, lastWeek.year), eq(weeklySummaries.week, lastWeek.week)),
  })

  return summary ? { ...summary, ...lastWeek } : null
}

export const findUserContextStaleness = async () => {
  const context = await getDb().query.userContext.findFirst()

  if (!context || !context.content) {
    return { isStale: false, updatedAt: null }
  }

  const threshold = subDays(new Date(), CONTEXT_STALENESS_DAYS)
  const isOld = new Date(context.updatedAt) < threshold
  const isDismissed = context.dismissedAt !== null && new Date(context.dismissedAt) > threshold

  return {
    isStale: isOld && !isDismissed,
    updatedAt: context.updatedAt,
  }
}
