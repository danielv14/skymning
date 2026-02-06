import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getDb } from '../db'
import { userContext } from '../db/schema'
import { eq } from 'drizzle-orm'
import { authMiddleware } from '../middleware/auth'

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
  historyCount: z.number().min(0).max(20),
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
          historyCount: data.historyCount,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(userContext.id, context.id))
        .returning()
      return updated
    } else {
      const [newContext] = await db
        .insert(userContext)
        .values({ content: data.content, historyCount: data.historyCount })
        .returning()
      return newContext
    }
  })
