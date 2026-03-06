import type { UIMessage } from '@tanstack/ai-react'
import { fetchServerSentEvents, useChat } from '@tanstack/ai-react'
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { saveExploreChatMessage } from '../server/functions/exploreChat'
import type { ExploreChatMessage } from '../server/db/schema'
import { getMessageText } from './usePersistedChat'

const dbMessagesToUIMessages = (
  messages: ExploreChatMessage[],
): UIMessage[] =>
  messages.map((message) => ({
    id: `db-${message.id}`,
    role: message.role as 'user' | 'assistant',
    parts: [{ type: 'text' as const, content: message.content }],
    createdAt: new Date(message.createdAt),
  }))

type UseExploreChatOptions = {
  existingMessages: ExploreChatMessage[]
}

export const useExploreChat = ({
  existingMessages,
}: UseExploreChatOptions) => {
  const savedMessageIds = useRef<Set<string>>(
    new Set(existingMessages.map((message) => `db-${message.id}`)),
  )
  const hasMounted = useRef(false)
  const wasCleared = useRef(false)

  const initialMessages = dbMessagesToUIMessages(existingMessages)

  const {
    messages: hookMessages,
    sendMessage,
    isLoading,
    setMessages,
  } = useChat({
    connection: fetchServerSentEvents('/api/explore-chat'),
    initialMessages: initialMessages.length > 0 ? initialMessages : undefined,
  })

  const messages =
    hookMessages.length > 0 || wasCleared.current
      ? hookMessages
      : initialMessages

  // Sync loader data on navigation
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true
      return
    }
    if (existingMessages.length > 0 && hookMessages.length === 0) {
      setMessages(dbMessagesToUIMessages(existingMessages))
      savedMessageIds.current = new Set(
        existingMessages.map((message) => `db-${message.id}`),
      )
    }
  }, [existingMessages, hookMessages.length, setMessages])

  // Auto-save assistant messages to DB
  useEffect(() => {
    if (isLoading || messages.length === 0) return

    const lastMessage = messages[messages.length - 1]
    if (lastMessage.role !== 'assistant') return
    if (savedMessageIds.current.has(lastMessage.id)) return

    const content = getMessageText(lastMessage.parts)
    if (!content) return

    savedMessageIds.current.add(lastMessage.id)

    saveExploreChatMessage({
      data: { role: 'assistant', content },
    }).catch((error) => {
      console.error('Failed to save assistant message:', error)
      savedMessageIds.current.delete(lastMessage.id)
      toast.error('Kunde inte spara meddelandet')
    })
  }, [messages, isLoading])

  const sendAndPersist = async (text: string) => {
    sendMessage(text)
    try {
      await saveExploreChatMessage({
        data: { role: 'user', content: text },
      })
    } catch (error) {
      console.error('Failed to save user message:', error)
      toast.error('Kunde inte spara meddelandet')
    }
  }

  const resetMessages = () => {
    wasCleared.current = true
    setMessages([])
    savedMessageIds.current.clear()
  }

  return {
    messages,
    isLoading,
    sendAndPersist,
    resetMessages,
  }
}
