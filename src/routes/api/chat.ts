import { createFileRoute } from '@tanstack/react-router'
import { chat, toStreamResponse } from '@tanstack/ai'
import { desc } from 'drizzle-orm'
import { z } from 'zod'
import { REFLECTION_SYSTEM_PROMPT } from '../../server/ai/prompts'
import { openai } from '../../server/ai/client'
import { getDb } from '../../server/db'
import { entries } from '../../server/db/schema'
import { getMoodLabel } from '../../constants'
import { requestAuthMiddleware } from '../../server/middleware/auth'
import { chatLimiter } from '../../server/auth/rateLimit'

const chatRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string().min(1).max(10000),
    })
  ).min(1).max(100),
})

export const Route = createFileRoute('/api/chat')({
  server: {
    middleware: [requestAuthMiddleware],
    handlers: {
      POST: async ({ request }) => {
        const clientIp = request.headers.get('CF-Connecting-IP') ?? 'unknown'

        if (chatLimiter.isRateLimited(clientIp)) {
          return new Response(
            JSON.stringify({ error: 'Too many requests. Please wait a few minutes.' }),
            { status: 429, headers: { 'Content-Type': 'application/json' } }
          )
        }

        chatLimiter.recordAttempt(clientIp)

        const body = await request.json()
        const parsed = chatRequestSchema.safeParse(body)

        if (!parsed.success) {
          return new Response(
            JSON.stringify({ error: 'Invalid request body' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          )
        }

        const { messages } = parsed.data

        const db = getDb()
        const [userContext, recentEntriesResult] = await Promise.all([
          db.query.userContext.findFirst(),
          db.query.entries.findMany({
            columns: {
              date: true,
              mood: true,
              summary: true,
            },
            orderBy: [desc(entries.date)],
            limit: 20,
          }),
        ])

        const userContextContent = userContext?.content?.trim()
        const historyCount = userContext?.historyCount ?? 10

        let previousEntriesPrompt = ''
        if (historyCount > 0 && recentEntriesResult.length > 0) {
          const limitedEntries = recentEntriesResult.slice(0, historyCount)
          const entriesText = limitedEntries
            .reverse()
            .map(
              (e) => `[${e.date}] Humör: ${getMoodLabel(e.mood)}\n${e.summary}`
            )
            .join('\n\n')

          previousEntriesPrompt = `## Användarens tidigare reflektioner\nHär är användarens senaste reflektioner för att ge dig kontext om vad som hänt i deras liv:\n\n${entriesText}`
        }

        const systemPrompts = [REFLECTION_SYSTEM_PROMPT]

        if (userContextContent) {
          systemPrompts.push(
            `## Om användaren\nHär är information om användaren som du ska ha i åtanke under samtalet:\n\n${userContextContent}`
          )
        }

        if (previousEntriesPrompt) {
          systemPrompts.push(previousEntriesPrompt)
        }

        const stream = chat({
          adapter: openai,
          systemPrompts,
          messages,
        })

        return toStreamResponse(stream)
      },
    },
  },
})
