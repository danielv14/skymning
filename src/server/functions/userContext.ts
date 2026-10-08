import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getDb } from '@/server/db'
import { userContext } from '@/server/db/schema'
import { eq } from 'drizzle-orm'
import { authMiddleware } from '@/server/middleware/auth'

export const getUserContext = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async () => {
    const db = getDb()
    let context = await db.query.userContext.findFirst()

    if (!context) {
      const [newContext] = await db.insert(userContext).values({ content: '' }).returning()
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
