import { integer, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core'

export const entries = sqliteTable('entries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull().unique(), // ISO-datum YYYY-MM-DD
  mood: integer('mood').notNull(), // 1-5
  summary: text('summary').notNull(),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
})

export const weeklySummaries = sqliteTable(
  'weekly_summaries',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    year: integer('year').notNull(),
    week: integer('week').notNull(), // 1-52
    summary: text('summary').notNull(),
    createdAt: text('created_at')
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [unique('year_week_unique').on(table.year, table.week)]
)

export const userContext = sqliteTable('user_context', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  content: text('content').notNull().default(''),
  historyCount: integer('history_count').notNull().default(10), // Antal tidigare reflektioner att inkludera i chatten (0, 5, 10, 20)
  updatedAt: text('updated_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
})

export type Entry = typeof entries.$inferSelect
export type NewEntry = typeof entries.$inferInsert
export type WeeklySummary = typeof weeklySummaries.$inferSelect
export type NewWeeklySummary = typeof weeklySummaries.$inferInsert
export type UserContext = typeof userContext.$inferSelect
