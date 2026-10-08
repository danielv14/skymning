import { asc, count, desc, eq, lt } from 'drizzle-orm'
import { getDb } from '@/server/db'
import { chatMessages, exploreChatMessages } from '@/server/db/schema'
import { getTodayDateString } from '@/utils/date'
import { findEntryByDate } from './entries'

export const findTodayChatPreview = async () => {
  const db = getDb()
  const today = getTodayDateString()

  const [[{ messageCount }], [lastMessage]] = await Promise.all([
    db.select({ messageCount: count() }).from(chatMessages).where(eq(chatMessages.date, today)),
    db
      .select({
        role: chatMessages.role,
        content: chatMessages.content,
        createdAt: chatMessages.createdAt,
      })
      .from(chatMessages)
      .where(eq(chatMessages.date, today))
      .orderBy(desc(chatMessages.orderIndex))
      .limit(1),
  ])

  if (!lastMessage) return null

  return { messageCount, lastMessage }
}

export const findExploreChatPreview = async () => {
  const db = getDb()

  const [[{ messageCount }], [lastMessage]] = await Promise.all([
    db.select({ messageCount: count() }).from(exploreChatMessages),
    db
      .select({
        role: exploreChatMessages.role,
        content: exploreChatMessages.content,
        createdAt: exploreChatMessages.createdAt,
      })
      .from(exploreChatMessages)
      .orderBy(desc(exploreChatMessages.orderIndex))
      .limit(1),
  ])

  if (!lastMessage) return null

  return { messageCount, lastMessage }
}

// Read-only: a past chat whose date already has an entry is simply ignored here.
// Stale chats are removed by createEntry and clearPastChats, never as a side effect of a read.
export const findIncompletePastChat = async () => {
  const db = getDb()
  const today = getTodayDateString()

  const latestPastMessage = await db.query.chatMessages.findFirst({
    columns: { date: true },
    where: lt(chatMessages.date, today),
    orderBy: [desc(chatMessages.date)],
  })

  if (!latestPastMessage) return null

  const { date } = latestPastMessage

  const [existingEntry, messagesForDate] = await Promise.all([
    findEntryByDate(date),
    db.query.chatMessages.findMany({
      columns: { role: true, content: true },
      where: eq(chatMessages.date, date),
      orderBy: [asc(chatMessages.orderIndex)],
    }),
  ])

  if (existingEntry) return null

  return {
    date,
    messages: messagesForDate.map((message) => ({
      role: message.role as 'user' | 'assistant',
      content: message.content,
    })),
    messageCount: messagesForDate.length,
  }
}
