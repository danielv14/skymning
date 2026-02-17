import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

export const entries = sqliteTable("entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull().unique(), // ISO-datum YYYY-MM-DD
  mood: integer("mood").notNull(), // 1-5
  summary: text("summary").notNull(),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const weeklySummaries = sqliteTable(
  "weekly_summaries",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    year: integer("year").notNull(),
    week: integer("week").notNull(), // 1-52
    summary: text("summary").notNull(),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [unique("year_week_unique").on(table.year, table.week)],
);

export const monthlySummaries = sqliteTable(
  "monthly_summaries",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    summary: text("summary").notNull(),
    createdAt: text("created_at")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [unique("year_month_unique").on(table.year, table.month)],
);

export const userContext = sqliteTable("user_context", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  content: text("content").notNull().default(""),
  historyCount: integer("history_count").notNull().default(10), // Antal tidigare reflektioner att inkludera i chatten (0, 5, 10, 20)
  dismissedAt: text("dismissed_at"),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const chatMessages = sqliteTable("chat_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(), // YYYY-MM-DD
  role: text("role").notNull(), // 'user' | 'assistant'
  content: text("content").notNull(),
  orderIndex: integer("order_index").notNull(),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const insights = sqliteTable("insights", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  insightsJson: text("insights_json").notNull(),
  analyzedEntryCount: integer("analyzed_entry_count").notNull(),
  periodStart: text("period_start").notNull(),
  periodEnd: text("period_end").notNull(),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export type Entry = typeof entries.$inferSelect;
export type WeeklySummary = typeof weeklySummaries.$inferSelect;
export type MonthlySummary = typeof monthlySummaries.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type Insight = typeof insights.$inferSelect;
