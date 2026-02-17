import { chat } from "@tanstack/ai";
import { createServerFn } from "@tanstack/react-start";
import { format, getISOWeek, parseISO } from "date-fns";
import { sv } from "date-fns/locale";
import { z } from "zod";
import { getMoodLabel } from "../../constants";
import { capitalizeFirst } from "../../utils/string";
import { authMiddleware } from "../middleware/auth";
import { openai } from "./client";
import {
  DAY_SUMMARY_SYSTEM_PROMPT,
  INSIGHTS_SYSTEM_PROMPT,
  MONTH_SUMMARY_SYSTEM_PROMPT,
  QUICK_POLISH_SYSTEM_PROMPT,
  WEEK_SUMMARY_SYSTEM_PROMPT,
} from "./prompts";
import { getUserContextPrompt } from "./userContext";

const formatWeekday = (dateString: string): string => {
  const date = parseISO(dateString);
  const weekday = format(date, "EEEE", { locale: sv });
  return capitalizeFirst(weekday);
};

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const generateDaySummarySchema = z.object({
  messages: z.array(messageSchema),
});

export const generateDaySummary = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator((data: unknown) => generateDaySummarySchema.parse(data))
  .handler(async ({ data }) => {
    const conversationText = data.messages
      .map((m) => `${m.role === "user" ? "Användare" : "AI"}: ${m.content}`)
      .join("\n\n");

    const systemPrompts = [DAY_SUMMARY_SYSTEM_PROMPT];
    const userContextPrompt = await getUserContextPrompt();
    if (userContextPrompt) systemPrompts.push(userContextPrompt);

    const response = await chat({
      adapter: openai,
      systemPrompts,
      messages: [
        {
          role: "user",
          content: conversationText,
        },
      ],
      stream: false,
    });

    return response;
  });

const generateWeeklySummarySchema = z.object({
  entries: z.array(
    z.object({
      date: z.string(),
      mood: z.number(),
      summary: z.string(),
    }),
  ),
});

export const generateWeeklySummary = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator((data: unknown) => generateWeeklySummarySchema.parse(data))
  .handler(async ({ data }) => {
    const entriesText = data.entries
      .map(
        (e) =>
          `${formatWeekday(e.date)} (${getMoodLabel(e.mood)}):\n${e.summary}`,
      )
      .join("\n\n---\n\n");

    const systemPrompts = [WEEK_SUMMARY_SYSTEM_PROMPT];
    const userContextPrompt = await getUserContextPrompt();
    if (userContextPrompt) systemPrompts.push(userContextPrompt);

    const response = await chat({
      adapter: openai,
      systemPrompts,
      messages: [
        {
          role: "user",
          content: entriesText,
        },
      ],
      stream: false,
    });

    return response;
  });

const generateMonthlySummarySchema = z.object({
  entries: z.array(
    z.object({
      date: z.string(),
      mood: z.number(),
      summary: z.string(),
    }),
  ),
  weeklySummaries: z.array(
    z.object({
      year: z.number(),
      week: z.number(),
      summary: z.string(),
    }),
  ),
});

const formatAverageMood = (entries: Array<{ mood: number }>): string => {
  if (entries.length === 0) return "?";
  const average =
    entries.reduce((sum, entry) => sum + entry.mood, 0) / entries.length;
  return average.toFixed(1);
};

export const generateMonthlySummary = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator((data: unknown) => generateMonthlySummarySchema.parse(data))
  .handler(async ({ data }) => {
    const weeklySummariesText = data.weeklySummaries
      .map((weeklySummary) => {
        const weekEntries = data.entries.filter((entry) => {
          const entryDate = parseISO(entry.date);
          return getISOWeek(entryDate) === weeklySummary.week;
        });
        const averageMood = formatAverageMood(weekEntries);
        return `Vecka ${weeklySummary.week} (snitthumör: ${averageMood}): ${weeklySummary.summary}`;
      })
      .join("\n\n");

    const entriesText = data.entries
      .map(
        (entry) =>
          `${formatWeekday(entry.date)} ${entry.date} (${getMoodLabel(entry.mood)}):\n${entry.summary}`,
      )
      .join("\n\n---\n\n");

    const fullPromptContent = [
      "Veckosummeringar:",
      weeklySummariesText,
      "",
      "Enskilda dagboksinlägg:",
      entriesText,
    ].join("\n\n");

    const systemPrompts = [MONTH_SUMMARY_SYSTEM_PROMPT];
    const userContextPrompt = await getUserContextPrompt();
    if (userContextPrompt) systemPrompts.push(userContextPrompt);

    const response = await chat({
      adapter: openai,
      systemPrompts,
      messages: [
        {
          role: "user",
          content: fullPromptContent,
        },
      ],
      stream: false,
    });

    return response;
  });

const polishQuickEntrySchema = z.object({
  text: z.string().min(10),
});

export const polishQuickEntry = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator((data: unknown) => polishQuickEntrySchema.parse(data))
  .handler(async ({ data }) => {
    const response = await chat({
      adapter: openai,
      systemPrompts: [QUICK_POLISH_SYSTEM_PROMPT],
      messages: [
        {
          role: "user",
          content: data.text,
        },
      ],
      stream: false,
    });

    return response;
  });

const generateInsightsSchema = z.object({
  entries: z.array(
    z.object({
      date: z.string(),
      mood: z.number(),
      summary: z.string(),
    }),
  ),
});

export const generateInsights = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator((data: unknown) => generateInsightsSchema.parse(data))
  .handler(async ({ data }) => {
    const moods = data.entries.map((e) => e.mood);
    const averageMood = moods.reduce((sum, m) => sum + m, 0) / moods.length;
    const moodDistribution = [1, 2, 3, 4, 5]
      .map(
        (value) =>
          `${getMoodLabel(value)}: ${moods.filter((m) => m === value).length}`,
      )
      .join(", ");

    const firstDate = data.entries[0]?.date ?? "?";
    const lastDate = data.entries[data.entries.length - 1]?.date ?? "?";

    const statsHeader = [
      `Analysperiod: ${firstDate} till ${lastDate}`,
      `Antal inlägg: ${data.entries.length} | Snitthumör: ${averageMood.toFixed(1)}`,
      `Humörfördelning: ${moodDistribution}`,
    ].join("\n");

    const entriesText = data.entries
      .map(
        (entry) =>
          `${formatWeekday(entry.date)} ${entry.date} (${getMoodLabel(entry.mood)}, humör ${entry.mood}):\n${entry.summary}`,
      )
      .join("\n\n---\n\n");

    const fullPromptContent = [statsHeader, "", "---", "", entriesText].join(
      "\n",
    );

    const systemPrompts = [INSIGHTS_SYSTEM_PROMPT];
    const userContextPrompt = await getUserContextPrompt();
    if (userContextPrompt) systemPrompts.push(userContextPrompt);

    const response = await chat({
      adapter: openai,
      systemPrompts,
      messages: [
        {
          role: "user",
          content: fullPromptContent,
        },
      ],
      stream: false,
    });

    const rawText = typeof response === "string" ? response : String(response);
    const cleanedText = rawText
      .replace(/^```(?:json)?\s*\n?/i, "")
      .replace(/\n?```\s*$/i, "");
    return JSON.parse(cleanedText);
  });
