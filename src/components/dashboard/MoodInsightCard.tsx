import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import {
  type MoodInsight,
  type MoodTrend,
  getInsightMessage,
} from "../../constants/moodInsight";
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

const getGradientClass = (insight: MoodInsight): string => {
  if (insight.level === "high") {
    return "bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-emerald-500/20";
  }
  if (insight.level === "low") {
    return "bg-gradient-to-r from-violet-500/10 to-slate-500/10 border-violet-500/20";
  }
  return "bg-gradient-to-r from-cyan-500/10 to-slate-500/10 border-cyan-500/20";
};

export const MoodInsightCard = ({ insight }: MoodInsightCardProps) => {
  const message = getInsightMessage(insight);
  const TrendIcon = getTrendIcon(insight.trend);
  const gradientClass = getGradientClass(insight);

  return (
    <Card className={gradientClass}>
      <div className="flex items-center gap-4">
        <div className="shrink-0">
          <MoodEmoji
            mood={Math.round(insight.average)}
            size="lg"
            showLabel={false}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <TrendIcon className="size-6 text-slate-400" />
            <span className="text-xs text-slate-400 font-medium">
              {insight.trend === "improving" && "Uppåt"}
              {insight.trend === "declining" && "Nedåt"}
              {insight.trend === "stable" && "Stabilt"}
            </span>
          </div>
          <p className="text-white font-medium">{message}</p>
          <p className="text-slate-400 text-sm mt-1">
            Baserat på dina senaste reflektioner
          </p>
        </div>
      </div>
    </Card>
  );
};
