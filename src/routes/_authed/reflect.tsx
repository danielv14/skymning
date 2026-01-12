import { useState, useRef, useEffect } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useChat, fetchServerSentEvents } from '@tanstack/ai-react'
import type { UIMessage } from '@tanstack/ai-react'
import { RefreshCw, Send } from 'lucide-react'
import { toast } from 'sonner'
import { getTodayEntry, createEntry } from '../../server/functions/entries'
import { getTodayChat, saveChatMessage, clearTodayChat } from '../../server/functions/chat'
import { formatTime } from '../../utils/date'
import { Button } from '../../components/ui/Button'
import { Textarea } from '../../components/ui/Textarea'
import { PageHeader } from '../../components/ui/PageHeader'
import { AlertDialog } from '../../components/ui/AlertDialog'
import { TypingIndicator } from '../../components/ui/TypingIndicator'
import { CompletionModal } from '../../components/reflection/CompletionModal'

const ReflectPage = () => {
  const router = useRouter()
  const { todayEntry, existingChat } = Route.useLoaderData()
  const [modalOpen, setModalOpen] = useState(false)
  const [restartDialogOpen, setRestartDialogOpen] = useState(false)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const savedMessageIds = useRef<Set<string>>(
    new Set(existingChat.map((message) => `db-${message.id}`))
  )

  const initialMessages: UIMessage[] = existingChat.map((message) => ({
    id: `db-${message.id}`,
    role: message.role as 'user' | 'assistant',
    parts: [{ type: 'text' as const, content: message.content }],
    createdAt: new Date(message.createdAt),
  }))

  const { messages, sendMessage, isLoading, setMessages } = useChat({
    connection: fetchServerSentEvents('/api/chat'),
    initialMessages: initialMessages.length > 0 ? initialMessages : undefined,
  })

  // Redirect if today's entry already exists
  useEffect(() => {
    if (todayEntry) {
      router.navigate({ to: '/' })
    }
  }, [todayEntry, router])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!isLoading) {
      textareaRef.current?.focus()
    }
  }, [isLoading])

  useEffect(() => {
    const saveNewMessages = async () => {
      for (let i = 0; i < messages.length; i++) {
        const message = messages[i]

        // Skip if already saved or if AI is still streaming this message
        if (savedMessageIds.current.has(message.id)) continue
        if (
          message.role === 'assistant' &&
          isLoading &&
          i === messages.length - 1
        )
          continue

        const content = getMessageText(message.parts)
        if (!content) continue

        // Mark as saved BEFORE the async operation to prevent race conditions
        savedMessageIds.current.add(message.id)

        try {
          await saveChatMessage({
            data: {
              role: message.role as 'user' | 'assistant',
              content,
              orderIndex: i,
            },
          })
        } catch (error) {
          console.error('Failed to save chat message:', error)
          savedMessageIds.current.delete(message.id)
          toast.error('Kunde inte spara meddelandet')
        }
      }
    }

    saveNewMessages()
  }, [messages, isLoading])

  const handleSendMessage = () => {
    if (input.trim() && !isLoading) {
      sendMessage(input)
      setInput('')
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleOpenModal = () => {
    if (messages.length > 0) {
      setModalOpen(true)
    }
  }

  const handleSave = async (mood: number, summary: string) => {
    await createEntry({
      data: {
        mood,
        summary,
      },
    })
    setModalOpen(false)
    router.navigate({ to: '/' })
  }

  const handleRestartChat = async () => {
    await clearTodayChat()
    setMessages([])
    savedMessageIds.current.clear()
    setRestartDialogOpen(false)
  }

  const getMessageText = (parts: typeof messages[0]['parts']) => {
    return parts
      .filter((part) => part.type === 'text')
      .map((part) => part.content)
      .join('')
  }

  const chatMessages = messages.map((message) => ({
    role: message.role as 'user' | 'assistant',
    content: getMessageText(message.parts),
  }))

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <>
      <CompletionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        messages={chatMessages}
        onSave={handleSave}
      />
      <AlertDialog
        open={restartDialogOpen}
        onOpenChange={setRestartDialogOpen}
        title="Börja om chatten?"
        description="Din nuvarande konversation kommer att raderas. Du kan sedan starta en ny."
        cancelText="Avbryt"
        confirmText="Ja, börja om"
        variant="danger"
        onConfirm={handleRestartChat}
      />
      <div className="h-screen flex flex-col bg-slate-900">
        <PageHeader
          title="Dagens reflektion"
          subtitle="Ta en stund att reflektera"
          rightContent={
            messages.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setRestartDialogOpen(true)}
                className="flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-1.5" />
                Börja om
              </Button>
            )
          }
        />

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-6 sm:px-8 py-6 space-y-5">
            {messages.length === 0 && !isLoading && (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">🌙</div>
                <p className="text-stone-200 text-lg mb-2">
                  Hej! Hur har din dag varit?
                </p>
                <p className="text-stone-500">
                  Berätta vad du har gjort eller hur du mår
                </p>
              </div>
            )}

            {messages.map((message) => {
              const text = getMessageText(message.parts)
              const isStreaming =
                isLoading &&
                message.role === 'assistant' &&
                message === messages[messages.length - 1]
              const time = formatTime(message.createdAt)

              return (
                <div
                  key={message.id}
                  className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-br-md shadow-lg shadow-indigo-500/20'
                        : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-bl-md'
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">
                      {text || (isStreaming ? <TypingIndicator /> : '')}
                      {isStreaming && text && (
                        <span className="inline-block w-2 h-4 ml-1 bg-indigo-400 animate-pulse rounded-sm align-middle" />
                      )}
                    </p>
                  </div>
                  {time && (
                    <span className="text-xs text-slate-500 mt-1 px-1">
                      {time}
                    </span>
                  )}
                </div>
              )
            })}

            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="shrink-0 px-4 sm:px-6 py-4">
          <div className="max-w-2xl mx-auto bg-slate-800/70 border border-slate-700/50 backdrop-blur-sm rounded-2xl px-4 sm:px-5 py-4">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={setInput}
                onKeyDown={handleKeyDown}
                placeholder="Dela dina tankar..."
                rows={2}
                disabled={isLoading}
                autoResize
                maxHeight={150}
                className="rounded-2xl !pr-12"
              />
              <button
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
                className="absolute right-4 bottom-4 text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            {messages.length >= 2 && !isLoading && (
              <div className="flex justify-end mt-2">
                <button
                  onClick={handleOpenModal}
                  className="text-sm text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  Jag är klar – spara dagen
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export const Route = createFileRoute('/_authed/reflect')({
  head: () => ({
    meta: [{ title: 'Reflektera - Skymning' }],
  }),
  loader: async () => {
    const [todayEntry, existingChat] = await Promise.all([
      getTodayEntry(),
      getTodayChat(),
    ])
    return { todayEntry, existingChat }
  },
  component: ReflectPage,
})
