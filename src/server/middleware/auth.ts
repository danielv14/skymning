import { createMiddleware } from '@tanstack/react-start'
import { useAppSession } from '../auth/session'

type AuthContext = {
  skipAuth?: boolean
}

export const authMiddleware = createMiddleware({ type: 'function' }).server(
  async ({ next, context }) => {
    // Skip auth if explicitly marked as public
    const ctx = context as unknown as AuthContext | undefined
    if (ctx?.skipAuth) {
      return next()
    }

    const session = await useAppSession()
    if (session.data.authenticated !== true) {
      throw new Error('Unauthorized')
    }

    return next()
  }
)

export const publicMiddleware = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    return next({
      context: {
        skipAuth: true,
      },
    })
  }
)

export const requestAuthMiddleware = createMiddleware().server(async ({ next }) => {
  const session = await useAppSession()
  if (session.data.authenticated !== true) {
    throw new Error('Unauthorized')
  }

  return next()
})
