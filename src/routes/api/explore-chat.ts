import { createFileRoute } from '@tanstack/react-router'
import { chat, toServerSentEventsResponse } from '@tanstack/ai'
import { format } from 'date-fns'
import { sv } from 'date-fns/locale'
import { parseChatRequest } from '@/server/ai/chatRequest'
import { openai } from '@/server/ai/client'
import { exploreTools } from '@/server/ai/exploreTools'
import { EXPLORE_SYSTEM_PROMPT } from '@/server/ai/prompts'
import { getUserContextPrompt } from '@/server/ai/userContext'
import { requestAuthMiddleware } from '@/server/middleware/auth'
import { getTodayDate, getTodayDateString } from '@/utils/date'

export const Route = createFileRoute('/api/explore-chat')({
  server: {
    middleware: [requestAuthMiddleware],
    handlers: {
      POST: async ({ request }) => {
        const chatRequest = await parseChatRequest(request, 'EXPLORE_CHAT_RATE_LIMITER')
        if (!chatRequest.success) return chatRequest.response

        const userContextPrompt = await getUserContextPrompt()
        const weekday = format(getTodayDate(), 'EEEE', { locale: sv })

        const systemPrompts = [
          EXPLORE_SYSTEM_PROMPT,
          `## Aktuell kontext\n- Dagens datum: ${getTodayDateString()} (${weekday})`,
        ]

        if (userContextPrompt) {
          systemPrompts.push(userContextPrompt)
        }

        const stream = chat({
          adapter: openai,
          systemPrompts,
          messages: chatRequest.modelMessages,
          tools: exploreTools,
        })

        return toServerSentEventsResponse(stream)
      },
    },
  },
})
