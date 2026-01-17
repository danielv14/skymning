import { createServerFn } from '@tanstack/react-start'
import { getRequestHeader } from '@tanstack/react-start/server'
import { z } from 'zod'
import { useAppSession } from '../auth/session'
import {
  isRateLimited,
  recordFailedAttempt,
  clearFailedAttempts,
} from '../auth/rateLimit'
import { publicMiddleware } from '../middleware/auth'

const loginSchema = z.object({
  secret: z.string().min(1),
})

export const loginFn = createServerFn({ method: 'POST' })
  .middleware([publicMiddleware])
  .inputValidator((data: unknown) => loginSchema.parse(data))
  .handler(async ({ data }) => {
    const clientIp = getRequestHeader('CF-Connecting-IP') ?? 'unknown'

    if (isRateLimited(clientIp)) {
      return {
        success: false as const,
        error: 'Too many attempts. Wait 15 minutes.',
      }
    }

    const authSecret = process.env.AUTH_SECRET

    if (!authSecret) {
      console.error('AUTH_SECRET is not configured')
      return { success: false as const, error: 'Server error: Auth not configured' }
    }

    if (data.secret !== authSecret) {
      recordFailedAttempt(clientIp)
      return { success: false as const, error: 'Wrong password' }
    }

    clearFailedAttempts(clientIp)
    const session = await useAppSession()
    await session.update({ authenticated: true })

    return { success: true as const }
  })

export const logoutFn = createServerFn({ method: 'POST' })
  .middleware([publicMiddleware])
  .handler(async () => {
  const session = await useAppSession()
  await session.clear()

  return { success: true }
})

export const isAuthenticatedFn = createServerFn({ method: 'GET' })
  .middleware([publicMiddleware])
  .handler(async () => {
    const session = await useAppSession()
    return session.data.authenticated === true
  }
)
