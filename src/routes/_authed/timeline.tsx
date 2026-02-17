import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { getCurrentWeek } from '../../server/functions/weeklySummaries'

const TimelineLayout = () => {
  return <Outlet />
}

export const Route = createFileRoute('/_authed/timeline')({
  head: () => ({
    meta: [{ title: 'Tidslinje - Skymning' }],
  }),
  loader: ({ location }) => {
    const { year, week } = getCurrentWeek()

    if (location.pathname === '/timeline') {
      throw redirect({
        to: '/timeline/$year/$week',
        params: { year: String(year), week: String(week) },
      })
    }

    return { year, week }
  },
  component: TimelineLayout,
})
