import { createFileRoute, Outlet, useRouter } from '@tanstack/react-router'
import { getCurrentWeek } from '../server/functions/weeklySummaries'
import { useEffect } from 'react'

const TimelineLayout = () => {
  const router = useRouter()
  const { year, week, shouldRedirect } = Route.useLoaderData()

  // Redirect till aktuell vecka om vi är på /timeline utan params
  useEffect(() => {
    if (shouldRedirect) {
      router.navigate({
        to: '/timeline/$year/$week',
        params: { year: String(year), week: String(week) },
      })
    }
  }, [router, year, week, shouldRedirect])

  // Rendera child routes
  return <Outlet />
}

export const Route = createFileRoute('/timeline')({
  head: () => ({
    meta: [{ title: 'Tidslinje - Skymning' }],
  }),
  loader: ({ location }) => {
    const { year, week } = getCurrentWeek()
    // Kolla om vi är på exakt /timeline (ska redirecta) eller en child route
    const shouldRedirect = location.pathname === '/timeline'
    return { year, week, shouldRedirect }
  },
  component: TimelineLayout,
})
