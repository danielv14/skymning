import { createServerFn } from "@tanstack/react-start";
import { count, desc, gte, ne } from "drizzle-orm";
import { z } from "zod";
import { INSIGHTS_ANALYSIS_DAYS } from "../../constants";
import { getTodayDateString, subtractDays } from "../../utils/date";
import { getDb } from "../db";
import { entries, insights } from "../db/schema";
import { authMiddleware } from "../middleware/auth";

export const getInsights = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    const db = getDb();

    const cachedInsights = await db.query.insights.findFirst({
      orderBy: [desc(insights.createdAt)],
    });

    const cutoffDate = subtractDays(
      getTodayDateString(),
      INSIGHTS_ANALYSIS_DAYS,
    );

    const [currentEntryCountResult] = await db
      .select({ count: count() })
      .from(entries)
      .where(gte(entries.date, cutoffDate));

    return {
      insights: cachedInsights ?? null,
      currentEntryCount: currentEntryCountResult?.count ?? 0,
    };
  });

const saveInsightsSchema = z.object({
  insightsJson: z.string(),
  analyzedEntryCount: z.number(),
  periodStart: z.string(),
  periodEnd: z.string(),
});

export const saveInsights = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator((data: unknown) => saveInsightsSchema.parse(data))
  .handler(async ({ data }) => {
    const db = getDb();

    const [saved] = await db.insert(insights).values(data).returning();

    await db.delete(insights).where(ne(insights.id, saved!.id));

    return saved;
  });

export const getEntriesForInsights = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    const db = getDb();

    const cutoffDate = subtractDays(
      getTodayDateString(),
      INSIGHTS_ANALYSIS_DAYS,
    );

    const insightEntries = await db.query.entries.findMany({
      columns: { date: true, mood: true, summary: true },
      where: gte(entries.date, cutoffDate),
      orderBy: [entries.date],
    });

    return insightEntries;
  });
