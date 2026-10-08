import { createServerFn } from '@tanstack/react-start'
import { getRequestHeader } from '@tanstack/react-start/server'
import { z } from 'zod'
import { useAppSession } from '@/server/auth/session'
import { isRateLimited } from '@/server/auth/rateLimit'
import { timingSafeEqual } from '@/server/auth/secrets'

const loginSchema = z.object({
  secret: z.string().min(1).max(500),
})

export const loginFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => loginSchema.parse(data))
  .handler(async ({ data }) => {
    const clientIp = getRequestHeader('CF-Connecting-IP') ?? 'unknown'

    if (await isRateLimited('LOGIN_RATE_LIMITER', clientIp)) {
      return {
        success: false as const,
        error: 'För många försök. Vänta en minut och försök igen.',
      }
    }

    const authSecret = process.env.AUTH_SECRET

    if (!authSecret) {
      console.error('AUTH_SECRET is not configured')
      return { success: false as const, error: 'Serverfel: inloggning är inte konfigurerad' }
    }

    if (!(await timingSafeEqual(data.secret, authSecret))) {
      return { success: false as const, error: 'Fel lösenord' }
    }

    const session = await useAppSession()
    await session.update({ authenticated: true })

    return { success: true as const }
  })

export const logoutFn = createServerFn({ method: 'POST' }).handler(async () => {
  const session = await useAppSession()
  await session.clear()

  return { success: true }
})

export const isAuthenticatedFn = createServerFn({ method: 'GET' }).handler(async () => {
  const session = await useAppSession()
  return session.data.authenticated === true
})
