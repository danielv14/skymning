import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { asc, count, desc, sql } from 'drizzle-orm'
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

    const [countResult, lastMessageResult] = await Promise.all([
      db.select({ messageCount: count() }).from(exploreChatMessages),
      db.query.exploreChatMessages.findFirst({
        orderBy: [desc(exploreChatMessages.orderIndex)],
      }),
    ])

    if (!lastMessageResult) return null

    return {
      messageCount: countResult[0].messageCount,
      lastMessage: {
        role: lastMessageResult.role,
        content: lastMessageResult.content,
        createdAt: lastMessageResult.createdAt,
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
