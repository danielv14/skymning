import { getDb } from '../db'

export const getUserContextPrompt = async (): Promise<string | null> => {
  const db = getDb()
  const context = await db.query.userContext.findFirst()
  const content = context?.content?.trim()

  if (!content) return null

  return `## Om användaren\nHär är information om användaren som du ska ha i åtanke:\n\n${content}`
}
