import {
  Clock,
  Lightbulb,
  Link2,
  Repeat,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Card } from "../ui/Card";

type InsightCategory =
  | "topic_mood_correlation"
  | "temporal_pattern"
  | "recurring_theme"
  | "positive_correlation"
  | "negative_correlation"
  | "observation";

export type InsightItem = {
  category: InsightCategory;
  title: string;
  description: string;
  confidence: "high" | "medium" | "low";
  relatedMoods?: number[];
  frequency?: string;
};

export const CATEGORY_CONFIG: Record<
  InsightCategory,
  {
    icon: typeof Link2;
    label: string;
    description: string;
    color: string;
    bgColor: string;
  }
> = {
  topic_mood_correlation: {
    icon: Link2,
    label: "Ämne-humör-koppling",
    description: "Aktiviteter eller ämnen som korrelerar med visst humör",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/20",
  },
  temporal_pattern: {
    icon: Clock,
    label: "Tidsmönster",
    description: "Mönster kopplade till veckodagar eller perioder",
    color: "text-amber-400",
    bgColor: "bg-amber-500/20",
  },
  recurring_theme: {
    icon: Repeat,
    label: "Återkommande tema",
    description: "Ämnen som dyker upp ofta i reflektionerna",
    color: "text-violet-400",
    bgColor: "bg-violet-500/20",
  },
  positive_correlation: {
    icon: TrendingUp,
    label: "Positiv koppling",
    description: "Saker som konsekvent kopplas till bra humör",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20",
  },
  negative_correlation: {
    icon: TrendingDown,
    label: "Negativ koppling",
    description: "Saker som konsekvent kopplas till dåligt humör",
    color: "text-rose-400",
    bgColor: "bg-rose-500/20",
  },
  observation: {
    icon: Lightbulb,
    label: "Observation",
    description: "Övriga intressanta observationer",
    color: "text-sky-400",
    bgColor: "bg-sky-500/20",
  },
};

type InsightCardProps = {
  insight: InsightItem;
};

export const InsightCard = ({ insight }: InsightCardProps) => {
  const config =
    CATEGORY_CONFIG[insight.category] ?? CATEGORY_CONFIG.observation;
  const Icon = config.icon;

  return (
    <Card>
      <div className="flex items-start gap-3">
        <div className={`shrink-0 p-2 rounded-xl ${config.bgColor}`}>
          <Icon className={`w-4 h-4 ${config.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-sm sm:text-base">
            {insight.title}
          </h3>
          <p className="text-slate-300 text-sm sm:text-base mt-1 leading-relaxed">
            {insight.description}
          </p>
          {insight.frequency && (
            <span
              className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}
            >
              {insight.frequency}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};
