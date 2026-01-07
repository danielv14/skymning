import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import { isAuthenticatedFn } from '../server/functions/auth'

export const Route = createFileRoute('/_authed')({
  beforeLoad: async () => {
    const isAuthenticated = await isAuthenticatedFn()

    if (!isAuthenticated) {
      throw redirect({ to: '/login' })
    }
  },
  component: () => <Outlet />,
})
