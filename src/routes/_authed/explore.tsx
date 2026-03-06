import { createFileRoute } from '@tanstack/react-router'
import { SendHorizontal, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { ChatMessage } from '../../components/reflection/ChatMessage'
import { AlertDialog } from '../../components/ui/AlertDialog'
import { Button } from '../../components/ui/Button'
import { PageHeader } from '../../components/ui/PageHeader'
import { Textarea } from '../../components/ui/Textarea'
import {
  clearExploreChat,
  getExploreChatMessages,
} from '../../server/functions/exploreChat'
import { getMessageText } from '../../hooks/usePersistedChat'
import { useExploreChat } from '../../hooks/useExploreChat'
import { formatTime } from '../../utils/date'

const ExplorePage = () => {
  const { existingMessages } = Route.useLoaderData()
  const [clearDialogOpen, setClearDialogOpen] = useState(false)
  const [input, setInput] = useState('')
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const hasScrolledOnMount = useRef(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { messages, isLoading, sendAndPersist, resetMessages } =
    useExploreChat({ existingMessages })

  const scrollToBottom = (smooth = false) => {
    const container = scrollContainerRef.current
    if (!container) return

    if (smooth) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth',
      })
    } else {
      container.scrollTop = container.scrollHeight
    }
  }

  useEffect(() => {
    if (messages.length === 0) return

    if (!hasScrolledOnMount.current) {
      requestAnimationFrame(() => scrollToBottom(false))
      hasScrolledOnMount.current = true
    } else {
      scrollToBottom(true)
    }
  }, [messages])

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!isLoading) {
      textareaRef.current?.focus()
    }
  }, [isLoading])

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    const message = input.trim()
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
    await sendAndPersist(message)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleClearChat = async () => {
    try {
      await clearExploreChat()
      resetMessages()
      setClearDialogOpen(false)
    } catch (error) {
      console.error('Failed to clear chat:', error)
      toast.error('Kunde inte rensa konversationen')
    }
  }

  return (
    <>
      <AlertDialog
        open={clearDialogOpen}
        onOpenChange={setClearDialogOpen}
        title="Rensa konversationen?"
        description="Hela chatthistoriken kommer att raderas. Du kan sedan starta en ny konversation."
        cancelText="Avbryt"
        confirmText="Ja, rensa"
        variant="danger"
        onConfirm={handleClearChat}
      />
      <div className="h-dvh flex flex-col bg-slate-950">
        <PageHeader
          title="Utforska"
          subtitle="Gräv i din reflektionshistorik"
          rightContent={
            messages.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setClearDialogOpen(true)}
                className="flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                Rensa
              </Button>
            )
          }
        />

        <div
          ref={scrollContainerRef}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
        >
          <div className="max-w-2xl mx-auto px-4 sm:px-8 py-6 space-y-4">
            {messages.length === 0 && !isLoading && (
              <div className="text-center py-16 sm:py-20">
                <div className="relative inline-block mb-8">
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-400/20 to-cyan-400/20 rounded-full blur-2xl scale-150" />
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 flex items-center justify-center shadow-xl">
                    <span className="text-4xl">🔍</span>
                  </div>
                </div>
                <h2 className="text-stone-100 text-2xl sm:text-3xl font-semibold mb-3">
                  Utforska dina reflektioner
                </h2>
                <p className="text-slate-400 text-base sm:text-lg max-w-sm mx-auto leading-relaxed mb-6">
                  Ställ frågor om din historik, hitta mönster, eller gräv i
                  specifika perioder
                </p>
                <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
                  {[
                    'Hur var förra månaden?',
                    'Vilken veckodag mår jag bäst?',
                    'Sök efter "jobbet"',
                    'Jämför denna månad med förra',
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => sendAndPersist(suggestion)}
                      className="text-sm px-3 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/40 text-slate-300 hover:text-white hover:border-slate-600/60 hover:bg-slate-700/60 transition-all duration-200 cursor-pointer"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                role={message.role as 'user' | 'assistant'}
                text={getMessageText(message.parts)}
                isStreaming={
                  isLoading &&
                  message.role === 'assistant' &&
                  message === messages[messages.length - 1]
                }
                time={formatTime(message.createdAt)}
              />
            ))}
          </div>
        </div>

        <div className="shrink-0 px-4 sm:px-6 pt-2 pb-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-slate-950/80 backdrop-blur-xl">
          <div className="max-w-2xl mx-auto bg-slate-800/50 border border-slate-700/50 rounded-2xl px-4 sm:px-5 py-4 shadow-xl shadow-black/20">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={setInput}
                onKeyDown={handleKeyDown}
                placeholder="Fråga om din historik..."
                rows={2}
                disabled={isLoading}
                autoResize
                maxHeight={150}
                className="rounded-2xl !pr-16"
              />
              <button
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
                className="absolute right-4 bottom-4 w-10 h-10 flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:from-emerald-600 active:to-teal-700 rounded-full text-white transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer hover:scale-110 active:scale-95 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
              >
                <SendHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export const Route = createFileRoute('/_authed/explore')({
  head: () => ({
    meta: [{ title: 'Utforska - Skymning' }],
  }),
  loader: async () => {
    const existingMessages = await getExploreChatMessages()
    return { existingMessages }
  },
  component: ExplorePage,
})
