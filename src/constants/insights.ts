import { z } from 'zod'

export const insightCategorySchema = z.enum([
  'topic_mood_correlation',
  'temporal_pattern',
  'recurring_theme',
  'positive_correlation',
  'negative_correlation',
  'anomaly',
  'observation',
])

export const insightItemSchema = z.object({
  category: insightCategorySchema,
  title: z.string(),
  description: z.string(),
  confidence: z.enum(['high', 'medium', 'low']),
  relatedMoods: z.array(z.number().min(1).max(5)).optional(),
  frequency: z.string().optional(),
})

// OpenAI structured output requires top-level type: "object"
export const insightsOutputSchema = z.object({
  insights: z.array(insightItemSchema),
})

export type InsightCategory = z.infer<typeof insightCategorySchema>
export type InsightItem = z.infer<typeof insightItemSchema>
