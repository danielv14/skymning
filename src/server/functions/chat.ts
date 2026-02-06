import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getDb } from '../db'
import { chatMessages } from '../db/schema'
import { eq, lt, asc, desc } from 'drizzle-orm'
import { dateString } from '../../constants'
import { getTodayDateString } from '../../utils/date'
import { authMiddleware } from '../middleware/auth'

export const getTodayChat = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async () => {
    const db = getDb()
    const today = getTodayDateString()

    const messages = await db.query.chatMessages.findMany({
      where: eq(chatMessages.date, today),
      orderBy: [asc(chatMessages.orderIndex)],
    })

    return messages
  })

export const getIncompletePastChat = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async () => {
    const db = getDb()
    const today = getTodayDateString()

    const pastMessages = await db.query.chatMessages.findMany({
      where: lt(chatMessages.date, today),
      orderBy: [desc(chatMessages.date), asc(chatMessages.orderIndex)],
    })

    if (pastMessages.length === 0) {
      return null
    }

    const date = pastMessages[0].date
    const messagesForDate = pastMessages.filter((m) => m.date === date)

    return {
      date,
      messages: messagesForDate.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      messageCount: messagesForDate.length,
    }
  })

export const clearPastChats = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .handler(async () => {
    const db = getDb()
    const today = getTodayDateString()

    await db.delete(chatMessages).where(lt(chatMessages.date, today))

    return { success: true }
  })

const getChatForDateSchema = z.object({
  date: dateString,
})

export const getChatForDate = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator((data: unknown) => getChatForDateSchema.parse(data))
  .handler(async ({ data }) => {
    const db = getDb()

    const messages = await db.query.chatMessages.findMany({
      where: eq(chatMessages.date, data.date),
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
  date: dateString.optional(),
})

export const saveChatMessage = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: unknown) => saveChatMessageSchema.parse(data))
  .handler(async ({ data }) => {
    const db = getDb()
    const messageDate = data.date ?? getTodayDateString()

    const existingMessages = await db.query.chatMessages.findMany({
      where: eq(chatMessages.date, messageDate),
      columns: { id: true },
    })
    const orderIndex = existingMessages.length

    const [message] = await db
      .insert(chatMessages)
      .values({
        date: messageDate,
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
