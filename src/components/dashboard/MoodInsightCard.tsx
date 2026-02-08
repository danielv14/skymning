import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import {
  type MoodInsight,
  type MoodTrend,
  getInsightMessage,
} from "../../constants/moodInsight";
import { MOOD_INSIGHT_DAYS } from "../../constants";
import { MoodEmoji } from "../mood/MoodEmoji";
import { Card } from "../ui/Card";

type MoodInsightCardProps = {
  insight: MoodInsight;
};

const getTrendIcon = (trend: MoodTrend) => {
  switch (trend) {
    case "improving":
      return TrendingUp;
    case "declining":
      return TrendingDown;
    case "stable":
      return Minus;
  }
};

const getTrendColor = (trend: MoodTrend): string => {
  switch (trend) {
    case "improving":
      return "text-emerald-400";
    case "declining":
      return "text-violet-400";
    case "stable":
      return "text-cyan-400";
  }
};

const getGradientClass = (insight: MoodInsight): string => {
  if (insight.level === "high") {
    return "bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/10 border-emerald-500/20";
  }
  if (insight.level === "low") {
    return "bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-slate-500/10 border-violet-500/20";
  }
  return "bg-gradient-to-br from-cyan-500/10 via-sky-500/5 to-slate-500/10 border-cyan-500/20";
};

export const MoodInsightCard = ({ insight }: MoodInsightCardProps) => {
  const message = getInsightMessage(insight);
  const TrendIcon = getTrendIcon(insight.trend);
  const trendColor = getTrendColor(insight.trend);
  const gradientClass = getGradientClass(insight);

  return (
    <Card className={`h-full ${gradientClass}`}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-3">
          <div className={`flex items-center gap-1.5 ${trendColor}`}>
            <TrendIcon className="size-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              {insight.trend === "improving" && "Uppåt"}
              {insight.trend === "declining" && "Nedåt"}
              {insight.trend === "stable" && "Stabilt"}
            </span>
          </div>
          <MoodEmoji
            mood={Math.round(insight.average)}
            size="md"
            showLabel={false}
          />
        </div>
        <p className="text-white font-medium text-sm sm:text-base leading-relaxed flex-1">{message}</p>
        <p className="text-slate-500 text-xs mt-3">
          Senaste {MOOD_INSIGHT_DAYS} dagarna
        </p>
      </div>
    </Card>
  );
};
