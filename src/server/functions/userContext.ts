import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { subDays } from 'date-fns'
import { getDb } from '../db'
import { userContext } from '../db/schema'
import { eq } from 'drizzle-orm'
import { authMiddleware } from '../middleware/auth'

const STALENESS_DAYS = 30

export const getUserContext = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async () => {
    const db = getDb()
    let context = await db.query.userContext.findFirst()

    if (!context) {
      const [newContext] = await db
        .insert(userContext)
        .values({ content: '', historyCount: 10 })
        .returning()
      context = newContext
    }

    return context
  })

const updateContextSchema = z.object({
  content: z.string().max(2000),
})

export const updateUserContext = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: unknown) => updateContextSchema.parse(data))
  .handler(async ({ data }) => {
    const db = getDb()
    const context = await db.query.userContext.findFirst()

    if (context) {
      const [updated] = await db
        .update(userContext)
        .set({
          content: data.content,
          updatedAt: new Date().toISOString(),
          dismissedAt: null,
        })
        .where(eq(userContext.id, context.id))
        .returning()
      return updated
    } else {
      const [newContext] = await db
        .insert(userContext)
        .values({ content: data.content })
        .returning()
      return newContext
    }
  })

export const getUserContextStaleness = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async () => {
    const db = getDb()
    const context = await db.query.userContext.findFirst()

    if (!context || !context.content) {
      return { isStale: false, updatedAt: null }
    }

    const threshold = subDays(new Date(), STALENESS_DAYS)
    const updatedAt = new Date(context.updatedAt)
    const isOld = updatedAt < threshold

    const isDismissed =
      context.dismissedAt && new Date(context.dismissedAt) > threshold

    return {
      isStale: isOld && !isDismissed,
      updatedAt: context.updatedAt,
    }
  })

export const dismissContextReminder = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .handler(async () => {
    const db = getDb()
    const context = await db.query.userContext.findFirst()

    if (context) {
      await db
        .update(userContext)
        .set({ dismissedAt: new Date().toISOString() })
        .where(eq(userContext.id, context.id))
    }
  })
