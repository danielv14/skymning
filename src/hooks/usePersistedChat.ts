import type { UIMessage } from "@tanstack/ai-react"
import { fetchServerSentEvents, useChat } from "@tanstack/ai-react"
import { useEffect, useRef } from "react"
import { toast } from "sonner"
import { saveChatMessage } from "../server/functions/chat"
import type { ChatMessage as DbChatMessage } from "../server/db/schema"

const GREETING_TRIGGER = '[GREETING]'

export const getMessageText = (parts: UIMessage["parts"]) =>
  parts
    .filter((part) => part.type === "text")
    .map((part) => part.content)
    .join("")

const dbMessagesToUIMessages = (messages: DbChatMessage[]): UIMessage[] =>
  messages.map((message) => ({
    id: `db-${message.id}`,
    role: message.role as "user" | "assistant",
    parts: [{ type: "text" as const, content: message.content }],
    createdAt: new Date(message.createdAt),
  }))

type UsePersistedChatOptions = {
  existingChat: DbChatMessage[]
  hasIncompletePastChat: boolean
  reflectionDate: string
}

export const usePersistedChat = ({
  existingChat,
  hasIncompletePastChat,
  reflectionDate,
}: UsePersistedChatOptions) => {
  const savedMessageIds = useRef<Set<string>>(
    new Set(existingChat.map((message) => `db-${message.id}`))
  )
  const hasMounted = useRef(false)
  const greetingSent = useRef(false)

  const initialMessages = dbMessagesToUIMessages(existingChat)

  const { messages: hookMessages, sendMessage, isLoading, setMessages } = useChat({
    connection: fetchServerSentEvents("/api/chat"),
    initialMessages: initialMessages.length > 0 ? initialMessages : undefined,
  })

  const messages = hookMessages.length > 0 ? hookMessages : initialMessages

  // Sync loader data to useChat on navigation (skip initial mount to avoid double render)
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true
      return
    }
    if (existingChat.length > 0 && hookMessages.length === 0) {
      setMessages(dbMessagesToUIMessages(existingChat))
      savedMessageIds.current = new Set(
        existingChat.map((message) => `db-${message.id}`)
      )
    }
  }, [existingChat, hookMessages.length, setMessages])

  // Auto-trigger personalized greeting when starting a fresh conversation
  useEffect(() => {
    if (greetingSent.current) return
    if (existingChat.length > 0) return
    if (hasIncompletePastChat) return

    greetingSent.current = true
    sendMessage(GREETING_TRIGGER)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save assistant messages to DB
  useEffect(() => {
    if (isLoading || messages.length === 0) return

    const lastMessage = messages[messages.length - 1]
    if (lastMessage.role !== "assistant") return
    if (savedMessageIds.current.has(lastMessage.id)) return

    const content = getMessageText(lastMessage.parts)
    if (!content) return

    savedMessageIds.current.add(lastMessage.id)

    saveChatMessage({
      data: { role: "assistant", content, date: reflectionDate },
    }).catch((error) => {
      console.error("Failed to save assistant message:", error)
      savedMessageIds.current.delete(lastMessage.id)
      toast.error("Kunde inte spara meddelandet")
    })
  }, [messages, isLoading, reflectionDate])

  const isGreetingTrigger = (message: UIMessage) =>
    message.role === 'user' && getMessageText(message.parts) === GREETING_TRIGGER

  const visibleMessages = messages.filter((m) => !isGreetingTrigger(m))

  const sendAndPersist = async (text: string) => {
    sendMessage(text)
    try {
      await saveChatMessage({
        data: { role: "user", content: text, date: reflectionDate },
      })
    } catch (error) {
      console.error("Failed to save user message:", error)
      toast.error("Kunde inte spara meddelandet")
    }
  }

  const resetChat = () => {
    setMessages([])
    savedMessageIds.current.clear()
    greetingSent.current = false
    sendMessage(GREETING_TRIGGER)
    greetingSent.current = true
  }

  const loadMessages = (dbMessages: DbChatMessage[]) => {
    setMessages(dbMessagesToUIMessages(dbMessages))
    savedMessageIds.current = new Set(dbMessages.map((m) => `db-${m.id}`))
  }

  return {
    messages,
    visibleMessages,
    isLoading,
    sendAndPersist,
    resetChat,
    loadMessages,
  }
}
