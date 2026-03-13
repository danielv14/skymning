import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { asc, sql } from 'drizzle-orm'
import { getDb } from '../db'
import { exploreChatMessages } from '../db/schema'
import { authMiddleware } from '../middleware/auth'

export const getExploreChatMessages = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async () => {
    const db = getDb()

    const messages = await db.query.exploreChatMessages.findMany({
      orderBy: [asc(exploreChatMessages.orderIndex)],
    })

    return messages
  })

export const getExploreChatPreview = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async () => {
    const db = getDb()

    const [result] = await db
      .select({
        messageCount: sql<number>`count(*)`,
        lastRole: sql<string | null>`(SELECT role FROM explore_chat_messages ORDER BY order_index DESC LIMIT 1)`,
        lastContent: sql<string | null>`(SELECT content FROM explore_chat_messages ORDER BY order_index DESC LIMIT 1)`,
        lastCreatedAt: sql<string | null>`(SELECT created_at FROM explore_chat_messages ORDER BY order_index DESC LIMIT 1)`,
      })
      .from(exploreChatMessages)

    if (result.messageCount === 0 || !result.lastRole) return null

    return {
      messageCount: result.messageCount,
      lastMessage: {
        role: result.lastRole,
        content: result.lastContent!,
        createdAt: result.lastCreatedAt!,
      },
    }
  })

const saveExploreChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(10000),
})

export const saveExploreChatMessage = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: unknown) => saveExploreChatMessageSchema.parse(data))
  .handler(async ({ data }) => {
    const db = getDb()

    const [message] = await db
      .insert(exploreChatMessages)
      .values({
        role: data.role,
        content: data.content,
        orderIndex: sql`(SELECT COALESCE(MAX(order_index), -1) + 1 FROM explore_chat_messages)`,
      })
      .returning()

    return message
  })

export const clearExploreChat = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .handler(async () => {
    const db = getDb()
    await db.delete(exploreChatMessages)
    return { success: true }
  })
