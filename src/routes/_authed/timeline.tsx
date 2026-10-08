import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { getCurrentWeek } from '@/server/functions/weeklySummaries'

const TimelineLayout = () => {
  return <Outlet />
}

export const Route = createFileRoute('/_authed/timeline')({
  head: () => ({
    meta: [{ title: 'Tidslinje - Skymning' }],
  }),
  // Redirect in beforeLoad rather than the loader: beforeLoad runs before the route's
  // code-split chunks start loading, so the redirect response never leaves an unfinished
  // module import behind. In the workerd dev server such an import is tied to the finished
  // request, and the next request that needs the same module would wait on it forever.
  beforeLoad: ({ location }) => {
    if (location.pathname === '/timeline') {
      const { year, week } = getCurrentWeek()
      throw redirect({
        to: '/timeline/$year/$week',
        params: { year: String(year), week: String(week) },
      })
    }
  },
  component: TimelineLayout,
})
