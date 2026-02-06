import { createMiddleware } from '@tanstack/react-start'
import { useAppSession } from '../auth/session'

export const authMiddleware = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const session = await useAppSession()
    if (session.data.authenticated !== true) {
      throw new Error('Unauthorized')
    }

    return next({ context: { session } })
  }
)

export const requestAuthMiddleware = createMiddleware().server(async ({ next }) => {
  const session = await useAppSession()
  if (session.data.authenticated !== true) {
    throw new Error('Unauthorized')
  }

  return next({ context: { session } })
})
