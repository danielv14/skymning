import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getDb } from '../db'
import { chatMessages } from '../db/schema'
import { eq, lt, asc, desc, count } from 'drizzle-orm'
import { getTodayDateString } from '../../utils/date'
import { requireAuth } from '../auth/session'

export const getTodayChat = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireAuth()
    const db = getDb()
    const today = getTodayDateString()

    await db.delete(chatMessages).where(lt(chatMessages.date, today))

    const messages = await db.query.chatMessages.findMany({
      where: eq(chatMessages.date, today),
      orderBy: [asc(chatMessages.orderIndex)],
    })

    return messages
  }
)

export const getChatPreview = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireAuth()
    const db = getDb()
    const today = getTodayDateString()

    const [countResult] = await db
      .select({ count: count() })
      .from(chatMessages)
      .where(eq(chatMessages.date, today))

    const messageCount = countResult?.count ?? 0

    if (messageCount === 0) {
      return null
    }

    const lastMessage = await db.query.chatMessages.findFirst({
      where: eq(chatMessages.date, today),
      orderBy: [desc(chatMessages.orderIndex)],
    })

    return {
      messageCount,
      lastMessage: lastMessage
        ? {
            role: lastMessage.role,
            content: lastMessage.content,
            createdAt: lastMessage.createdAt,
          }
        : null,
    }
  }
)

const saveChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(10000),
  orderIndex: z.number().min(0),
})

export const saveChatMessage = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => saveChatMessageSchema.parse(data))
  .handler(async ({ data }) => {
    await requireAuth()
    const db = getDb()
    const today = getTodayDateString()

    const [message] = await db
      .insert(chatMessages)
      .values({
        date: today,
        role: data.role,
        content: data.content,
        orderIndex: data.orderIndex,
      })
      .returning()

    return message
  })

export const clearTodayChat = createServerFn({ method: 'POST' }).handler(
  async () => {
    await requireAuth()
    const db = getDb()
    const today = getTodayDateString()

    await db.delete(chatMessages).where(eq(chatMessages.date, today))
  }
)
