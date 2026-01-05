import { createFileRoute } from '@tanstack/react-router'
import { chat, toStreamResponse } from '@tanstack/ai'
import { desc } from 'drizzle-orm'
import { REFLECTION_SYSTEM_PROMPT } from '../../server/ai/prompts'
import { openai } from '../../server/ai/client'
import { db } from '../../server/db'
import { entries } from '../../server/db/schema'
import { getMoodLabel } from '../../constants'

export const Route = createFileRoute('/api/chat')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = await request.json()

        // Hämta user context om det finns
        const userContext = await db.query.userContext.findFirst()
        const userContextContent = userContext?.content?.trim()
        const historyCount = userContext?.historyCount ?? 10

        // Hämta tidigare reflektioner om historyCount > 0
        let previousEntriesPrompt = ''
        if (historyCount > 0) {
          const recentEntries = await db.query.entries.findMany({
            columns: {
              date: true,
              mood: true,
              summary: true,
            },
            orderBy: [desc(entries.date)],
            limit: historyCount,
          })

          if (recentEntries.length > 0) {
            // Kronologisk ordning (äldst först)
            const entriesText = recentEntries
              .reverse()
              .map(
                (e) => `[${e.date}] Humör: ${getMoodLabel(e.mood)}\n${e.summary}`
              )
              .join('\n\n')

            previousEntriesPrompt = `## Användarens tidigare reflektioner\nHär är användarens senaste reflektioner för att ge dig kontext om vad som hänt i deras liv:\n\n${entriesText}`
          }
        }

        // Bygg system prompts
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
