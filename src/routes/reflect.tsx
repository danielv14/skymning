import { useState, useRef, useEffect, useCallback } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useChat, fetchServerSentEvents } from '@tanstack/ai-react'
import { getTodayEntry, createEntry } from '../server/functions/entries'
import { Button } from '../components/ui/Button'
import { PageHeader } from '../components/ui/PageHeader'
import { CompletionModal } from '../components/reflection/CompletionModal'

const ReflectPage = () => {
  const router = useRouter()
  const { todayEntry } = Route.useLoaderData()
  const [modalOpen, setModalOpen] = useState(false)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { messages, sendMessage, isLoading } = useChat({
    connection: fetchServerSentEvents('/api/chat'),
  })

  // Redirect om redan gjort
  if (todayEntry) {
    router.navigate({ to: '/' })
    return null
  }

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`
    }
  }, [])

  // Scrolla till botten när nya meddelanden kommer eller uppdateras (streaming)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Fokusera textarea när sidan laddas och efter bot svarar
  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  // Fokusera igen när bot är klar med att svara
  useEffect(() => {
    if (!isLoading) {
      textareaRef.current?.focus()
    }
  }, [isLoading])

  const handleSendMessage = () => {
    if (input.trim() && !isLoading) {
      sendMessage(input)
      setInput('')
      // Reset textarea height
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

  const chatMessages = messages.map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.parts
      .filter((p) => p.type === 'text')
      .map((p) => p.content)
      .join(''),
  }))

  const getMessageText = (parts: typeof messages[0]['parts']) => {
    return parts
      .filter((p) => p.type === 'text')
      .map((p) => p.content)
      .join('')
  }

  return (
    <>
      <CompletionModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        messages={chatMessages}
        onSave={handleSave}
      />
    <div className="h-screen flex flex-col bg-slate-900">
      {/* Header med gradient */}
      <PageHeader
        title="Dagens reflektion"
        subtitle="Ta en stund att reflektera"
      />

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 sm:px-8 py-6 space-y-5">
          {messages.length === 0 && !isLoading && (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🌙</div>
              <p className="text-stone-200 text-lg mb-2">Hej! Hur har din dag varit?</p>
              <p className="text-stone-500">
                Berätta vad du har gjort eller hur du mår
              </p>
            </div>
          )}

          {messages.map((message) => {
            const text = getMessageText(message.parts)
            const isStreaming = isLoading && message.role === 'assistant' && message === messages[messages.length - 1]
            
            return (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-br-md shadow-lg shadow-indigo-500/20'
                      : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-bl-md'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {text || (isStreaming ? '...' : '')}
                    {isStreaming && text && (
                      <span className="inline-block w-2 h-4 ml-1 bg-indigo-400 animate-pulse rounded-sm align-middle" />
                    )}
                  </p>
                </div>
              </div>
            )
          })}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="shrink-0 px-4 sm:px-6 py-4">
        <div className="max-w-2xl mx-auto bg-slate-800/70 border border-slate-700/50 backdrop-blur-sm rounded-2xl px-4 sm:px-5 py-4">
          {messages.length >= 2 && !isLoading && (
            <div className="mb-3">
              <Button
                variant="secondary"
                onClick={handleOpenModal}
                className="w-full"
              >
                Jag är klar – spara dagen
              </Button>
            </div>
          )}

          <div className="flex gap-3 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                adjustTextareaHeight()
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              placeholder="Dela dina tankar..."
              rows={1}
              className="flex-1 px-4 py-3 rounded-2xl border border-slate-600 bg-slate-700/50 text-slate-100 placeholder-slate-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors resize-none overflow-hidden"
              disabled={isLoading}
            />
            <Button onClick={handleSendMessage} disabled={!input.trim() || isLoading}>
              {isLoading ? '...' : 'Skicka'}
            </Button>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

export const Route = createFileRoute('/reflect')({
  head: () => ({
    meta: [{ title: 'Reflektera - Skymning' }],
  }),
  loader: async () => {
    const todayEntry = await getTodayEntry()
    return { todayEntry }
  },
  component: ReflectPage,
})
