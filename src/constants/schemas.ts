import { z } from 'zod'

export const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

export const weekInputSchema = z.object({
  year: z.number(),
  week: z.number().min(1).max(53),
})

export type WeekInput = z.infer<typeof weekInputSchema>
