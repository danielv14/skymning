import { createFileRoute } from '@tanstack/react-router'
import { chat, toServerSentEventsResponse } from '@tanstack/ai'
import { desc } from 'drizzle-orm'
import { z } from 'zod'
import { format } from 'date-fns'
import { sv } from 'date-fns/locale'
import { REFLECTION_SYSTEM_PROMPT } from '../../server/ai/prompts'
import { openai } from '../../server/ai/client'
import { getUserContextPrompt } from '../../server/ai/userContext'
import { getDb } from '../../server/db'
import { entries } from '../../server/db/schema'
import { getMoodLabel } from '../../constants'
import { requestAuthMiddleware } from '../../server/middleware/auth'
import { chatLimiter } from '../../server/auth/rateLimit'
import { getTodayDateString, subtractDays } from '../../utils/date'

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
        const [userContextPrompt, recentEntriesResult, userContextRecord] = await Promise.all([
          getUserContextPrompt(),
          db.query.entries.findMany({
            columns: {
              date: true,
              mood: true,
              summary: true,
            },
            orderBy: [desc(entries.date)],
            limit: 20,
          }),
          db.query.userContext.findFirst(),
        ])

        const historyCount = userContextRecord?.historyCount ?? 10

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

        // Build current context for greeting and conversation awareness
        const todayStr = getTodayDateString()
        const weekday = format(new Date(), 'EEEE', { locale: sv })
        const hour = new Date().getHours()
        const timeOfDay = hour < 10 ? 'morgon' : hour < 17 ? 'eftermiddag' : 'kväll'

        const yesterdayStr = subtractDays(todayStr, 1)
        const yesterdayEntry = recentEntriesResult.find((e) => e.date === yesterdayStr)

        // Compute streak from recent entries (already sorted desc)
        let streak = 0
        if (recentEntriesResult.length > 0) {
          const latestDate = recentEntriesResult[0].date
          if (latestDate === todayStr || latestDate === yesterdayStr) {
            const dateSet = new Set(recentEntriesResult.map((e) => e.date))
            let checkDate = latestDate
            while (dateSet.has(checkDate)) {
              streak++
              checkDate = subtractDays(checkDate, 1)
            }
          }
        }

        const contextLines = [
          `- Veckodag: ${weekday}`,
          `- Tid på dygnet: ${timeOfDay}`,
          `- Streak: ${streak} dagar i rad`,
        ]
        if (yesterdayEntry) {
          contextLines.push(`- Gårdagens humör: ${getMoodLabel(yesterdayEntry.mood)}`)
        }

        const systemPrompts = [REFLECTION_SYSTEM_PROMPT]

        systemPrompts.push(`## Aktuell kontext\n${contextLines.join('\n')}`)

        if (userContextPrompt) {
          systemPrompts.push(userContextPrompt)
        }

        if (previousEntriesPrompt) {
          systemPrompts.push(previousEntriesPrompt)
        }

        const stream = chat({
          adapter: openai,
          systemPrompts,
          messages,
        })

        return toServerSentEventsResponse(stream)
      },
    },
  },
})
