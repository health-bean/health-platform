"use client";

import { useState, useEffect } from "react";
import { LineChart, TrendingUp, AlertTriangle, Heart, Zap, Plus } from "lucide-react";
import { Card, Badge, Spinner, Button } from "@/components/ui";
import { ExerciseInsights } from "@/components/insights/ExerciseInsights";
import { ReintroductionCard } from "@/components/reintroductions/ReintroductionCard";
import { StartReintroductionModal } from "@/components/reintroductions/StartReintroductionModal";
import type { Insight, InsightResult, ReintroductionTrial } from "@/types";
import { useRouter } from "next/navigation";

function InsightCard({ insight }: { insight: Insight }) {
  const isPattern = insight.type === "food-property-pattern";
  const isHelper =
    insight.type === "supplement-effect" || insight.type === "sleep-supplement";

  return (
    <Card>
      <div className="flex items-start gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            isHelper
              ? "bg-emerald-50 text-emerald-600"
              : isPattern
                ? "bg-teal-50 text-teal-600"
                : "bg-amber-50 text-amber-600"
          }`}
        >
          {isHelper ? (
            <Heart className="h-4 w-4" />
          ) : isPattern ? (
            <Zap className="h-4 w-4" />
          ) : insight.confidence >= 0.7 ? (
            <TrendingUp className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-warm-900">
            {insight.trigger}{" "}
            <span className="text-warm-500">
              {isHelper ? "helps with" : "correlates with"}
            </span>{" "}
            {insight.effect}
          </p>

          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <Badge
              variant={
                isHelper
                  ? "allowed"
                  : insight.confidence >= 0.7
                    ? "avoid"
                    : "moderation"
              }
            >
              {insight.percentage}% confidence
            </Badge>

            <span className="text-xs text-warm-400">
              {insight.occurrences} occurrence
              {insight.occurrences !== 1 ? "s" : ""}
            </span>

            {insight.foodCount && (
              <span className="text-xs text-warm-400">
                {insight.foodCount} foods
              </span>
            )}
          </div>

          {insight.description && (
            <p className="mt-2 text-xs text-warm-500">{insight.description}</p>
          )}

          {insight.recommendation && (
            <p className="mt-1 text-xs font-medium text-warm-600">
              {insight.recommendation}
            </p>
          )}

          {insight.contributingFoods && insight.contributingFoods.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {insight.contributingFoods.map((food) => (
                <span
                  key={food}
                  className="inline-block rounded-md bg-warm-100 px-1.5 py-0.5 text-xs text-warm-600"
                >
                  {food}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function InsightSection({
  title,
  insights,
}: {
  title: string;
  insights: Insight[];
}) {
  if (insights.length === 0) return null;

  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-warm-400">
        {title}
      </h2>
      <div className="flex flex-col gap-3">
        {insights.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </div>
    </div>
  );
}

export default function InsightsPage() {
  const router = useRouter();
  const [result, setResult] = useState<InsightResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeReintroduction, setActiveReintroduction] = useState<ReintroductionTrial | null>(null);
  const [protocolId, setProtocolId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [insightsRes, userRes, reintroRes] = await Promise.all([
          fetch("/api/insights?days=90"),
          fetch("/api/users/me"),
          fetch("/api/reintroductions"),
        ]);

        if (insightsRes.ok) {
          const data: InsightResult = await insightsRes.json();
          setResult(data);
        } else {
          setError("Failed to load insights");
        }

        if (userRes.ok) {
          const userData = await userRes.json();
          setProtocolId(userData.user?.currentProtocolId || null);
        }

        if (reintroRes.ok) {
          const reintroData = await reintroRes.json();
          const active = reintroData.reintroductions?.find(
            (r: ReintroductionTrial) => r.status === "active"
          );
          setActiveReintroduction(active || null);
        }
      } catch {
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  const totalInsights = result
    ? result.triggers.length + result.helpers.length + result.trends.length
    : 0;

  // Separate exercise insights from other insights
  const exerciseInsights = result
    ? [...result.triggers, ...result.helpers, ...result.trends].filter(
        (insight) => insight.type === "exercise-energy"
      )
    : [];

  const otherTriggers = result
    ? result.triggers.filter((insight) => insight.type !== "exercise-energy")
    : [];

  const otherHelpers = result
    ? result.helpers.filter((insight) => insight.type !== "exercise-energy")
    : [];

  const otherTrends = result
    ? result.trends.filter((insight) => insight.type !== "exercise-energy")
    : [];

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-6 text-lg font-semibold text-warm-900">Insights</h1>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {totalInsights === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
            <LineChart className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-warm-900">
            Not enough data yet
          </h2>
          <p className="mt-1 max-w-xs text-sm text-warm-500">
            Log more entries to see insights. ChewIQ identifies patterns between
            what you eat and how you feel over time.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Active Reintroduction */}
          {activeReintroduction && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-warm-400">
                  Active Reintroduction
                </h2>
                <button
                  onClick={() => router.push("/reintroductions")}
                  className="text-xs text-teal-600 hover:text-teal-700"
                >
                  View All →
                </button>
              </div>
              <ReintroductionCard
                reintroduction={activeReintroduction}
                onViewDetails={() => router.push("/reintroductions")}
              />
            </div>
          )}

          {/* Start Reintroduction CTA */}
          {!activeReintroduction && protocolId && totalInsights > 0 && (
            <Card>
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50">
                  <Plus className="h-5 w-5 text-teal-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-warm-900">
                    Ready to Reintroduce Foods?
                  </h3>
                  <p className="mt-1 text-sm text-warm-600">
                    Start testing eliminated foods to see if you can safely add them back to your diet.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => setIsModalOpen(true)}
                    >
                      Start Reintroduction
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => router.push("/reintroductions")}
                    >
                      View Recommendations
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {exerciseInsights.length > 0 && (
            <ExerciseInsights insights={exerciseInsights} />
          )}
          <InsightSection title="Patterns" insights={otherTrends} />
          <InsightSection title="Triggers" insights={otherTriggers} />
          <InsightSection title="What Helps" insights={otherHelpers} />
        </div>
      )}

      {/* Start Reintroduction Modal */}
      {protocolId && (
        <StartReintroductionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            router.push("/reintroductions");
          }}
          protocolId={protocolId}
        />
      )}
    </div>
  );
}
