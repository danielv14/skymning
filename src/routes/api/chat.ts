import { createFileRoute } from '@tanstack/react-router'
import { chat, toServerSentEventsResponse } from '@tanstack/ai'
import { format } from 'date-fns'
import { sv } from 'date-fns/locale'
import { getMoodLabel } from '@/constants'
import { parseChatRequest } from '@/server/ai/chatRequest'
import { openai } from '@/server/ai/client'
import { REFLECTION_SYSTEM_PROMPT } from '@/server/ai/prompts'
import { chatTools } from '@/server/ai/tools'
import { getUserContextPrompt } from '@/server/ai/userContext'
import { requestAuthMiddleware } from '@/server/middleware/auth'
import { findRecentEntries, findStreak } from '@/server/queries/entries'
import { getCurrentHour, getTodayDate, getTodayDateString, subtractDays } from '@/utils/date'

const RECENT_ENTRIES_IN_PROMPT = 5

const getTimeOfDay = (hour: number) => {
  if (hour < 10) return 'morgon'
  if (hour < 17) return 'eftermiddag'
  return 'kväll'
}

export const Route = createFileRoute('/api/chat')({
  server: {
    middleware: [requestAuthMiddleware],
    handlers: {
      POST: async ({ request }) => {
        const chatRequest = await parseChatRequest(request, 'CHAT_RATE_LIMITER')
        if (!chatRequest.success) return chatRequest.response

        const [userContextPrompt, recentEntries, streak] = await Promise.all([
          getUserContextPrompt(),
          findRecentEntries(RECENT_ENTRIES_IN_PROMPT),
          findStreak(),
        ])

        const yesterday = subtractDays(getTodayDateString(), 1)
        const yesterdayEntry = recentEntries.find((entry) => entry.date === yesterday)

        const contextLines = [
          `- Veckodag: ${format(getTodayDate(), 'EEEE', { locale: sv })}`,
          `- Tid på dygnet: ${getTimeOfDay(getCurrentHour())}`,
          `- Streak: ${streak} dagar i rad`,
        ]
        if (yesterdayEntry) {
          contextLines.push(`- Gårdagens humör: ${getMoodLabel(yesterdayEntry.mood)}`)
        }

        const systemPrompts = [
          REFLECTION_SYSTEM_PROMPT,
          `## Aktuell kontext\n${contextLines.join('\n')}`,
        ]

        if (userContextPrompt) {
          systemPrompts.push(userContextPrompt)
        }

        if (recentEntries.length > 0) {
          const entriesText = recentEntries
            .toReversed()
            .map((entry) => `[${entry.date}] Humör: ${getMoodLabel(entry.mood)}\n${entry.summary}`)
            .join('\n\n')

          systemPrompts.push(
            `## Användarens senaste reflektioner (urval)\nNedan visas de ${recentEntries.length} senaste reflektionerna. Användaren kan ha fler -- använd dina verktyg om du behöver mer historik.\n\n${entriesText}`,
          )
        }

        const stream = chat({
          adapter: openai,
          systemPrompts,
          messages: chatRequest.modelMessages,
          tools: chatTools,
        })

        return toServerSentEventsResponse(stream)
      },
    },
  },
})
