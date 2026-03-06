import { createFileRoute } from '@tanstack/react-router'
import {
  chat,
  convertMessagesToModelMessages,
  toServerSentEventsResponse,
} from '@tanstack/ai'
import type { ModelMessage, UIMessage } from '@tanstack/ai'
import { z } from 'zod'
import { format } from 'date-fns'
import { sv } from 'date-fns/locale'
import { EXPLORE_SYSTEM_PROMPT } from '../../server/ai/prompts'
import { openai } from '../../server/ai/client'
import { exploreTools } from '../../server/ai/exploreTools'
import { getUserContextPrompt } from '../../server/ai/userContext'
import { requestAuthMiddleware } from '../../server/middleware/auth'
import { exploreChatLimiter } from '../../server/auth/rateLimit'
import { getTodayDateString } from '../../utils/date'

const chatRequestSchema = z.object({
  messages: z.array(z.any()).min(1).max(100),
})

export const Route = createFileRoute('/api/explore-chat')({
  server: {
    middleware: [requestAuthMiddleware],
    handlers: {
      POST: async ({ request }) => {
        const clientIp =
          request.headers.get('CF-Connecting-IP') ?? 'unknown'

        if (exploreChatLimiter.isRateLimited(clientIp)) {
          return new Response(
            JSON.stringify({
              error: 'Too many requests. Please wait a few minutes.',
            }),
            { status: 429, headers: { 'Content-Type': 'application/json' } },
          )
        }

        exploreChatLimiter.recordAttempt(clientIp)

        const body = await request.json()
        const parsed = chatRequestSchema.safeParse(body)

        if (!parsed.success) {
          return new Response(
            JSON.stringify({ error: 'Invalid request body' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } },
          )
        }

        const modelMessages = convertMessagesToModelMessages(
          parsed.data.messages as Array<UIMessage>,
        ) as Array<ModelMessage<string>>

        const userContextPrompt = await getUserContextPrompt()

        const todayStr = getTodayDateString()
        const weekday = format(new Date(), 'EEEE', { locale: sv })

        const systemPrompts = [EXPLORE_SYSTEM_PROMPT]
        systemPrompts.push(`## Aktuell kontext\n- Dagens datum: ${todayStr} (${weekday})`)

        if (userContextPrompt) {
          systemPrompts.push(userContextPrompt)
        }

        const stream = chat({
          adapter: openai,
          systemPrompts,
          messages: modelMessages,
          tools: exploreTools,
        })

        return toServerSentEventsResponse(stream)
      },
    },
  },
})
