import { createServerFn } from '@tanstack/react-start'
import { chat } from '@tanstack/ai'
import { z } from 'zod'
import { format, parseISO } from 'date-fns'
import { sv } from 'date-fns/locale'
import { DAY_SUMMARY_SYSTEM_PROMPT, WEEK_SUMMARY_SYSTEM_PROMPT, QUICK_POLISH_SYSTEM_PROMPT } from './prompts'
import { openai } from './client'
import { getMoodLabel } from '../../constants'
import { capitalizeFirst } from '../../utils/string'

const formatWeekday = (dateString: string): string => {
  const date = parseISO(dateString)
  const weekday = format(date, 'EEEE', { locale: sv })
  return capitalizeFirst(weekday)
}

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
})

const generateDaySummarySchema = z.object({
  messages: z.array(messageSchema),
})

export const generateDaySummary = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => generateDaySummarySchema.parse(data))
  .handler(async ({ data }) => {
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
    const entriesText = data.entries
      .map(
        (e) =>
          `${formatWeekday(e.date)} (${getMoodLabel(e.mood)}):\n${e.summary}`
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

const polishQuickEntrySchema = z.object({
  text: z.string().min(10),
})

export const polishQuickEntry = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => polishQuickEntrySchema.parse(data))
  .handler(async ({ data }) => {
    const response = await chat({
      adapter: openai,
      systemPrompts: [QUICK_POLISH_SYSTEM_PROMPT],
      messages: [
        {
          role: 'user',
          content: data.text,
        },
      ],
      stream: false,
    })

    return response
  })
