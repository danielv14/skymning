import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { db } from '../db'
import { userContext } from '../db/schema'
import { eq } from 'drizzle-orm'

// Hämta user context (skapar en tom om ingen finns)
export const getUserContext = createServerFn({ method: 'GET' }).handler(
  async () => {
    let context = await db.query.userContext.findFirst()

    // Om ingen kontext finns, skapa en tom
    if (!context) {
      const [newContext] = await db
        .insert(userContext)
        .values({ content: '', historyCount: 10 })
        .returning()
      context = newContext
    }

    return context
  }
)

// Uppdatera user context
const updateContextSchema = z.object({
  content: z.string(),
  historyCount: z.number().min(0).max(20),
})

export const updateUserContext = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => updateContextSchema.parse(data))
  .handler(async ({ data }) => {
    // Hämta först för att se om det finns
    let context = await db.query.userContext.findFirst()

    if (context) {
      // Uppdatera befintlig
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
      // Skapa ny
      const [newContext] = await db
        .insert(userContext)
        .values({ content: data.content, historyCount: data.historyCount })
        .returning()
      return newContext
    }
  })
