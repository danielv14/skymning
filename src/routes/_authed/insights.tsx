import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Brain, Info, RefreshCw, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CATEGORY_CONFIG,
  InsightCard,
  type InsightItem,
} from "../../components/insights/InsightCard";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Modal, ModalCloseButton } from "../../components/ui/Modal";
import { PageHeader } from "../../components/ui/PageHeader";
import { INSIGHTS_MIN_ENTRIES } from "../../constants";
import { generateInsights } from "../../server/ai";
import {
  getEntriesForInsights,
  getInsights,
  saveInsights,
} from "../../server/functions/insights";

const formatRelativeTime = (isoString: string): string => {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "just nu";
  if (diffMinutes < 60) return `${diffMinutes} min sedan`;
  if (diffHours < 24)
    return `${diffHours} ${diffHours === 1 ? "timme" : "timmar"} sedan`;
  if (diffDays === 1) return "igår";
  if (diffDays < 7) return `${diffDays} dagar sedan`;
  if (diffDays < 30)
    return `${Math.floor(diffDays / 7)} ${Math.floor(diffDays / 7) === 1 ? "vecka" : "veckor"} sedan`;
  return `${Math.floor(diffDays / 30)} ${Math.floor(diffDays / 30) === 1 ? "månad" : "månader"} sedan`;
};

const SkeletonCard = () => (
  <Card>
    <div className="flex items-start gap-3 animate-pulse">
      <div className="shrink-0 w-8 h-8 rounded-xl bg-slate-700/50" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-700/50 rounded w-2/3" />
        <div className="h-3 bg-slate-700/30 rounded w-full" />
        <div className="h-3 bg-slate-700/30 rounded w-4/5" />
      </div>
    </div>
  </Card>
);

const InsightsPage = () => {
  const { cachedInsights, currentEntryCount } = Route.useLoaderData();
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);

  const parsedInsights: InsightItem[] | null = (() => {
    if (!cachedInsights) return null;
    try {
      return JSON.parse(cachedInsights.insightsJson);
    } catch {
      return null;
    }
  })();

  const isStale =
    cachedInsights !== null &&
    currentEntryCount > cachedInsights.analyzedEntryCount;

  const newEntriesSinceGeneration = cachedInsights
    ? currentEntryCount - cachedInsights.analyzedEntryCount
    : 0;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const insightEntries = await getEntriesForInsights();

      if (insightEntries.length < INSIGHTS_MIN_ENTRIES) {
        toast.error("Behöver minst 10 reflektioner för att generera insikter");
        return;
      }

      const parsed = await generateInsights({
        data: {
          entries: insightEntries.map((entry) => ({
            date: entry.date,
            mood: entry.mood,
            summary: entry.summary,
          })),
        },
      });

      await saveInsights({
        data: {
          insightsJson: JSON.stringify(parsed),
          analyzedEntryCount: insightEntries.length,
          periodStart: insightEntries[0]?.date ?? "",
          periodEnd: insightEntries[insightEntries.length - 1]?.date ?? "",
        },
      });

      router.invalidate();
    } catch (error) {
      console.error("Failed to generate insights:", error);
      toast.error("Kunde inte generera insikter");
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (
      !cachedInsights &&
      currentEntryCount >= INSIGHTS_MIN_ENTRIES &&
      !isGenerating
    ) {
      handleGenerate();
    }
  }, []);

  const notEnoughEntries =
    currentEntryCount < INSIGHTS_MIN_ENTRIES && !cachedInsights;

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Insikter"
        subtitle="AI-driven mönsteranalys"
        rightContent={
          <button
            onClick={() => setLegendOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-white/10 active:bg-white/15 transition-all duration-200 cursor-pointer text-slate-400 hover:text-slate-200"
          >
            <Info className="w-4 h-4" />
            <span className="text-xs font-medium">Förklaring</span>
          </button>
        }
      />

      <Modal
        open={legendOpen}
        onOpenChange={setLegendOpen}
        title="Insiktskategorier"
        footer={
          <div className="mt-6">
            <ModalCloseButton variant="secondary" size="sm">
              Stäng
            </ModalCloseButton>
          </div>
        }
      >
        <div className="space-y-4">
          {Object.values(CATEGORY_CONFIG).map((config) => {
            const Icon = config.icon;
            return (
              <div key={config.label} className="flex items-start gap-3">
                <div className={`shrink-0 p-2 rounded-xl ${config.bgColor}`}>
                  <Icon className={`w-4 h-4 ${config.color}`} />
                </div>
                <div>
                  <p className={`text-sm sm:text-base font-medium ${config.color}`}>
                    {config.label}
                  </p>
                  <p className="text-sm sm:text-base text-slate-400">{config.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Modal>

      <main className="max-w-2xl mx-auto p-4 sm:p-8 space-y-4 sm:space-y-5">
        {notEnoughEntries && (
          <Card className="border-slate-600/30">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="shrink-0 p-2.5 rounded-2xl bg-slate-700/50">
                <Brain className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">
                  Behöver fler reflektioner
                </h3>
                <p className="text-sm sm:text-base text-slate-400 mt-1">
                  Det behövs minst {INSIGHTS_MIN_ENTRIES} reflektioner under de
                  senaste 90 dagarna för att generera insikter. Du har{" "}
                  {currentEntryCount} just nu.
                </p>
              </div>
            </div>
          </Card>
        )}

        {isGenerating && (
          <div className="space-y-3">
            <Card className="border-emerald-500/30 bg-gradient-to-r from-emerald-500/5 to-teal-500/5">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
                <div>
                  <p className="text-sm sm:text-base font-medium text-white">
                    Analyserar dina reflektioner...
                  </p>
                  <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                    Det här kan ta några sekunder
                  </p>
                </div>
              </div>
            </Card>
            <div className="space-y-3 stagger-children">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        )}

        {!isGenerating && parsedInsights && (
          <>
            <Card className="border-slate-700/30 bg-slate-800/30">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm sm:text-base text-slate-400">
                  Baserat på {cachedInsights!.analyzedEntryCount} reflektioner ·
                  Genererades {formatRelativeTime(cachedInsights!.createdAt)}
                  {isStale && (
                    <span className="text-amber-400">
                      {" "}
                      · {newEntriesSinceGeneration}{" "}
                      {newEntriesSinceGeneration === 1
                        ? "ny reflektion"
                        : "nya reflektioner"}{" "}
                      sedan dess
                    </span>
                  )}
                </p>
                {isStale && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleGenerate}
                  >
                    <span className="flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5" />
                      Uppdatera
                    </span>
                  </Button>
                )}
              </div>
            </Card>

            <div className="space-y-3 stagger-children">
              {parsedInsights.map((insight, index) => (
                <InsightCard key={index} insight={insight} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export const Route = createFileRoute("/_authed/insights")({
  head: () => ({
    meta: [{ title: "Insikter - Skymning" }],
  }),
  loader: async () => {
    const { insights, currentEntryCount } = await getInsights();
    return { cachedInsights: insights, currentEntryCount };
  },
  component: InsightsPage,
});
