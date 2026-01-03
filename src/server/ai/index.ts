import { createServerFn } from '@tanstack/react-start'
import { chat } from '@tanstack/ai'
import { z } from 'zod'
import { DAY_SUMMARY_SYSTEM_PROMPT, WEEK_SUMMARY_SYSTEM_PROMPT } from './prompts'
import { openai } from './client'
import { getMoodLabel } from '../../constants'

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
})

// Generera dagssummering från chatthistorik
const generateDaySummarySchema = z.object({
  messages: z.array(messageSchema),
})

export const generateDaySummary = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => generateDaySummarySchema.parse(data))
  .handler(async ({ data }) => {
    // Formatera chatthistoriken som text
    const conversationText = data.messages
      .map((m) => `${m.role === 'user' ? 'Användare' : 'AI'}: ${m.content}`)
      .join('\n\n')

    const response = await chat({
      adapter: openai,
      systemPrompts: [DAY_SUMMARY_SYSTEM_PROMPT],
      messages: [
        {
          role: 'user',
          content: conversationText,
        },
      ],
      stream: false,
    })

    return response
  })

// Generera veckosummering från dagsinlägg
const generateWeeklySummarySchema = z.object({
  entries: z.array(
    z.object({
      date: z.string(),
      mood: z.number(),
      summary: z.string(),
    })
  ),
})

export const generateWeeklySummary = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => generateWeeklySummarySchema.parse(data))
  .handler(async ({ data }) => {
    // Formatera inläggen som text
    const entriesText = data.entries
      .map(
        (e) =>
          `${e.date} (${getMoodLabel(e.mood)}):\n${e.summary}`
      )
      .join('\n\n---\n\n')

    const response = await chat({
      adapter: openai,
      systemPrompts: [WEEK_SUMMARY_SYSTEM_PROMPT],
      messages: [
        {
          role: 'user',
          content: entriesText,
        },
      ],
      stream: false,
    })

    return response
  })
