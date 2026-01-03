import { createFileRoute } from '@tanstack/react-router'
import { chat, toStreamResponse } from '@tanstack/ai'
import { REFLECTION_SYSTEM_PROMPT } from '../../server/ai/prompts'
import { openai } from '../../server/ai/client'
import { db } from '../../server/db'

export const Route = createFileRoute('/api/chat')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = await request.json()

        // Hämta user context om det finns
        const userContext = await db.query.userContext.findFirst()
        const userContextContent = userContext?.content?.trim()

        // Bygg system prompts - inkludera user context om det finns
        const systemPrompts = userContextContent
          ? [
              REFLECTION_SYSTEM_PROMPT,
              `Här är information om användaren som du ska ha i åtanke under samtalet:\n\n${userContextContent}`,
            ]
          : [REFLECTION_SYSTEM_PROMPT]

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
