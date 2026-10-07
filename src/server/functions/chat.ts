import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { asc, eq, lt, sql } from 'drizzle-orm'
import { dateString } from '@/constants'
import { getDb } from '@/server/db'
import { chatMessages } from '@/server/db/schema'
import { authMiddleware } from '@/server/middleware/auth'
import { findIncompletePastChat } from '@/server/queries/chat'
import { getTodayDateString } from '@/utils/date'

const findChatForDate = (date: string) =>
  getDb().query.chatMessages.findMany({
    where: eq(chatMessages.date, date),
    orderBy: [asc(chatMessages.orderIndex)],
  })

export const getTodayChat = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(() => findChatForDate(getTodayDateString()))

const getChatForDateSchema = z.object({
  date: dateString,
})

export const getChatForDate = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator((data: unknown) => getChatForDateSchema.parse(data))
  .handler(({ data }) => findChatForDate(data.date))

export const getValidIncompletePastChat = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(() => findIncompletePastChat())

const saveChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(10_000),
  date: dateString.optional(),
})

export const saveChatMessage = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: unknown) => saveChatMessageSchema.parse(data))
  .handler(async ({ data }) => {
    const messageDate = data.date ?? getTodayDateString()

    // Computing the next index inside the INSERT keeps it atomic, so two messages
    // saved at the same time can't end up with the same order_index.
    const [message] = await getDb()
      .insert(chatMessages)
      .values({
        date: messageDate,
        role: data.role,
        content: data.content,
        orderIndex: sql`(SELECT COALESCE(MAX(${chatMessages.orderIndex}), -1) + 1 FROM ${chatMessages} WHERE ${chatMessages.date} = ${messageDate})`,
      })
      .returning()

    return message
  })

export const clearPastChats = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .handler(async () => {
    await getDb().delete(chatMessages).where(lt(chatMessages.date, getTodayDateString()))
    return { success: true }
  })

export const clearTodayChat = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .handler(async () => {
    await getDb().delete(chatMessages).where(eq(chatMessages.date, getTodayDateString()))
    return { success: true }
  })
