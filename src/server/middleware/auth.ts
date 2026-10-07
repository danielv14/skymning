import { createMiddleware } from '@tanstack/react-start'
import { setResponseStatus } from '@tanstack/react-start/server'
import { useAppSession } from '@/server/auth/session'

export const authMiddleware = createMiddleware({ type: 'function' }).server(async ({ next }) => {
  const session = await useAppSession()
  if (session.data.authenticated !== true) {
    setResponseStatus(401)
    throw new Error('Unauthorized')
  }

  return next({ context: { session } })
})

export const requestAuthMiddleware = createMiddleware().server(async ({ next }) => {
  const session = await useAppSession()
  if (session.data.authenticated !== true) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return next({ context: { session } })
})
