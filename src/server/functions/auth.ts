import { createServerFn } from '@tanstack/react-start'
import { getRequestHeader } from '@tanstack/react-start/server'
import { z } from 'zod'
import { useAppSession } from '../auth/session'
import {
  isRateLimited,
  recordFailedAttempt,
  clearFailedAttempts,
} from '../auth/rateLimit'

const loginSchema = z.object({
  secret: z.string().min(1),
})

export const loginFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => loginSchema.parse(data))
  .handler(async ({ data }) => {
    // Hämta klient-IP från Cloudflare header (fallback till 'unknown' lokalt)
    const clientIp = getRequestHeader('CF-Connecting-IP') ?? 'unknown'

    if (isRateLimited(clientIp)) {
      return {
        success: false as const,
        error: 'För många försök. Vänta 15 minuter.',
      }
    }

    const authSecret = process.env.AUTH_SECRET

    if (!authSecret) {
      console.error('AUTH_SECRET is not configured')
      return { success: false as const, error: 'Serverfel: Auth ej konfigurerat' }
    }

    if (data.secret !== authSecret) {
      recordFailedAttempt(clientIp)
      return { success: false as const, error: 'Fel lösenord' }
    }

    clearFailedAttempts(clientIp)
    const session = await useAppSession()
    await session.update({ authenticated: true })

    return { success: true as const }
  })

export const logoutFn = createServerFn({ method: 'POST' }).handler(async () => {
  const session = await useAppSession()
  await session.clear()

  return { success: true }
})

export const isAuthenticatedFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const session = await useAppSession()
    return session.data.authenticated === true
  }
)
