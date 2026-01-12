import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getDb } from '../db'
import { chatMessages } from '../db/schema'
import { eq, lt, asc } from 'drizzle-orm'
import { getTodayDateString } from '../../utils/date'

export const getTodayChat = createServerFn({ method: 'GET' }).handler(
  async () => {
    const db = getDb()
    const today = getTodayDateString()

    // Clean up old messages from previous days
    await db.delete(chatMessages).where(lt(chatMessages.date, today))

    // Return today's messages
    const messages = await db.query.chatMessages.findMany({
      where: eq(chatMessages.date, today),
      orderBy: [asc(chatMessages.orderIndex)],
    })

    return messages
  }
)

export const hasOngoingChat = createServerFn({ method: 'GET' }).handler(
  async () => {
    const db = getDb()
    const today = getTodayDateString()

    const message = await db.query.chatMessages.findFirst({
      where: eq(chatMessages.date, today),
    })

    return message !== undefined
  }
)

const saveChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1),
  orderIndex: z.number().min(0),
})

export const saveChatMessage = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => saveChatMessageSchema.parse(data))
  .handler(async ({ data }) => {
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
    const db = getDb()
    const today = getTodayDateString()

    await db.delete(chatMessages).where(eq(chatMessages.date, today))
  }
)
