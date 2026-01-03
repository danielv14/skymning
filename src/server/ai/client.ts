import { openaiText } from '@tanstack/ai-openai'

// Delad OpenAI-klient för hela applikationen
export const openai = openaiText('gpt-4o-mini')
