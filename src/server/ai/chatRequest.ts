import { convertMessagesToModelMessages } from '@tanstack/ai'
import type { ModelMessage, UIMessage } from '@tanstack/ai'
import { z } from 'zod'
import { getClientIp, isRateLimited } from '@/server/auth/rateLimit'

const MAX_REQUEST_BYTES = 512 * 1024

const textPartSchema = z.looseObject({
  type: z.literal('text'),
  content: z.string().max(10_000),
})

const toolCallPartSchema = z.looseObject({
  type: z.literal('tool-call'),
  id: z.string().max(200),
  name: z.string().max(100),
  arguments: z.string().max(10_000),
})

const toolResultPartSchema = z.looseObject({
  type: z.literal('tool-result'),
  toolCallId: z.string().max(200),
  content: z.string().max(50_000),
})

const thinkingPartSchema = z.looseObject({
  type: z.literal('thinking'),
  content: z.string().max(50_000),
})

// Only user/assistant roles are accepted so the client can never inject its own system prompt
const uiMessageSchema = z.looseObject({
  id: z.string().max(200),
  role: z.enum(['user', 'assistant']),
  parts: z
    .array(
      z.discriminatedUnion('type', [
        textPartSchema,
        toolCallPartSchema,
        toolResultPartSchema,
        thinkingPartSchema,
      ]),
    )
    .max(50),
})

const chatRequestSchema = z.looseObject({
  messages: z.array(uiMessageSchema).min(1).max(100),
})

type ChatRateLimiter = 'CHAT_RATE_LIMITER' | 'EXPLORE_CHAT_RATE_LIMITER'

type ParsedChatRequest =
  | { success: true; modelMessages: Array<ModelMessage<string>> }
  | { success: false; response: Response }

const errorResponse = (error: string, status: number): ParsedChatRequest => ({
  success: false,
  response: Response.json({ error }, { status }),
})

export const parseChatRequest = async (
  request: Request,
  rateLimiter: ChatRateLimiter,
): Promise<ParsedChatRequest> => {
  if (await isRateLimited(rateLimiter, getClientIp(request.headers))) {
    return errorResponse('Too many requests. Please wait a minute.', 429)
  }

  const rawBody = await request.text()
  if (rawBody.length > MAX_REQUEST_BYTES) {
    return errorResponse('Request body too large', 413)
  }

  let body: unknown
  try {
    body = JSON.parse(rawBody)
  } catch {
    return errorResponse('Invalid JSON', 400)
  }

  const parsed = chatRequestSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse('Invalid request body', 400)
  }

  const modelMessages = convertMessagesToModelMessages(
    parsed.data.messages as unknown as Array<UIMessage>,
  ) as Array<ModelMessage<string>>

  return { success: true, modelMessages }
}
