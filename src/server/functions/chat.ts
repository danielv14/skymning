import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getDb } from '../db'
import { chatMessages } from '../db/schema'
import { eq, lt, asc, desc } from 'drizzle-orm'
import { getTodayDateString } from '../../utils/date'
import { requireAuth } from '../auth/session'

export const getTodayChat = createServerFn({ method: 'GET' }).handler(
  async () => {
    await requireAuth()
    const db = getDb()
    const today = getTodayDateString()

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

    const messages = await db.query.chatMessages.findMany({
      where: eq(chatMessages.date, today),
      orderBy: [desc(chatMessages.orderIndex)],
    })

    if (messages.length === 0) {
      return null
    }

    const lastMessage = messages[0]

    return {
      messageCount: messages.length,
      lastMessage: {
        role: lastMessage.role,
        content: lastMessage.content,
        createdAt: lastMessage.createdAt,
      },
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

    // Clean up old messages from previous days
    await db.delete(chatMessages).where(lt(chatMessages.date, today))

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

    return { success: true }
  }
)
