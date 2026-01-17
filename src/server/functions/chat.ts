import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getDb } from '../db'
import { chatMessages } from '../db/schema'
import { eq, lt, asc, desc } from 'drizzle-orm'
import { getTodayDateString } from '../../utils/date'
import { authMiddleware } from '../middleware/auth'

export const getTodayChat = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async () => {
    const db = getDb()
    const today = getTodayDateString()

    // Auto-clear incomplete chats from previous days (not today's)
    // This ensures users start fresh if they didn't finish yesterday's reflection
    await db.delete(chatMessages).where(lt(chatMessages.date, today))

    const messages = await db.query.chatMessages.findMany({
      where: eq(chatMessages.date, today),
      orderBy: [asc(chatMessages.orderIndex)],
    })

    return messages
  })

export const getChatPreview = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async () => {
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
  })

const saveChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(10000),
})

export const saveChatMessage = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: unknown) => saveChatMessageSchema.parse(data))
  .handler(async ({ data }) => {
    const db = getDb()
    const today = getTodayDateString()

    const existingMessages = await db.query.chatMessages.findMany({
      where: eq(chatMessages.date, today),
      columns: { id: true },
    })
    const orderIndex = existingMessages.length

    const [message] = await db
      .insert(chatMessages)
      .values({
        date: today,
        role: data.role,
        content: data.content,
        orderIndex,
      })
      .returning()

    return message
  })

export const clearTodayChat = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .handler(async () => {
    const db = getDb()
    const today = getTodayDateString()

    await db.delete(chatMessages).where(eq(chatMessages.date, today))

    return { success: true }
  })
