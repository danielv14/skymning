import type { UIMessage } from '@tanstack/ai-react'

type DbMessage = {
  id: number
  role: string
  content: string
  createdAt: string
}

export const getMessageText = (parts: UIMessage['parts']) =>
  parts
    .filter((part) => part.type === 'text')
    .map((part) => part.content)
    .join('')

export const dbMessagesToUIMessages = (messages: DbMessage[]): UIMessage[] =>
  messages.map((message) => ({
    id: `db-${message.id}`,
    role: message.role as 'user' | 'assistant',
    parts: [{ type: 'text' as const, content: message.content }],
    createdAt: new Date(message.createdAt),
  }))
