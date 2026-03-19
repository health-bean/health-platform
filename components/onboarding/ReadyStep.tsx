"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, MessageSquare, Calendar } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

interface ReadyStepProps {
  protocolId?: string;
  homeTab?: "chat" | "log";
  onHomeTabChange: (tab: "chat" | "log") => void;
  onBack: () => void;
}

const EXAMPLE_PROMPTS = [
  { emoji: "\u{1F41F}", text: "I had salmon and sweet potato for lunch" },
  { emoji: "\u{1F623}", text: "My joint pain is about a 6 today" },
  { emoji: "\u{1F48A}", text: "I took magnesium and vitamin D this morning" },
];

export function ReadyStep({ protocolId, homeTab = "log", onHomeTabChange, onBack }: ReadyStepProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleComplete() {
    setLoading(true);
    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          protocolId: protocolId || null,
          homeTab,
          loadSampleData: false,
        }),
      });
      router.push(homeTab === "chat" ? "/chat" : "/timeline");
    } catch {
      router.push(homeTab === "chat" ? "/chat" : "/timeline");
    }
  }

  return (
    <div className="flex flex-col items-center text-center py-8">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-6">
        <Sparkles className="h-8 w-8" />
      </div>

      <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--color-text-primary)] mb-2">
        You&apos;re all set!
      </h2>

      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-xs mb-6">
        Start by telling me what you ate today, how you&apos;re feeling, or any supplements you took. I&apos;ll take it from there.
      </p>

      <div className="w-full rounded-2xl bg-[var(--color-surface-card)] p-4 shadow-[var(--shadow-card)] border border-[var(--color-border)]/20 mb-6 text-left">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="h-4 w-4 text-[var(--color-text-muted)]" />
          <span className="text-xs text-[var(--color-text-muted)]">Try saying:</span>
        </div>
        <div className="flex flex-col gap-2">
          {EXAMPLE_PROMPTS.map((prompt) => (
            <div
              key={prompt.text}
              className="flex items-center gap-2.5 text-sm text-[var(--color-text-primary)]"
            >
              <span className="text-base">{prompt.emoji}</span>
              <span>&ldquo;{prompt.text}&rdquo;</span>
            </div>
          ))}
        </div>
      </div>

      {/* Home tab preference */}
      <div className="w-full mb-6">
        <p className="text-sm font-medium text-[var(--color-text-primary)] mb-3">
          Where would you like to start each day?
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => onHomeTabChange("chat")}
            className={cn(
              "flex-1 rounded-xl p-4 text-center",
              "bg-[var(--color-surface-card)] border transition-all duration-200",
              homeTab === "chat"
                ? "border-teal-500 bg-teal-50 shadow-[var(--shadow-card)]"
                : "border-[var(--color-border)] hover:border-teal-300"
            )}
          >
            <MessageSquare className="h-6 w-6 mx-auto mb-2 text-teal-600" />
            <div className="text-sm font-semibold text-[var(--color-text-primary)]">Chat</div>
            <div className="text-xs text-[var(--color-text-muted)] mt-1">I prefer to describe things in conversation</div>
          </button>
          <button
            onClick={() => onHomeTabChange("log")}
            className={cn(
              "flex-1 rounded-xl p-4 text-center",
              "bg-[var(--color-surface-card)] border transition-all duration-200",
              homeTab === "log"
                ? "border-teal-500 bg-teal-50 shadow-[var(--shadow-card)]"
                : "border-[var(--color-border)] hover:border-teal-300"
            )}
          >
            <Calendar className="h-6 w-6 mx-auto mb-2 text-teal-600" />
            <div className="text-sm font-semibold text-[var(--color-text-primary)]">Log</div>
            <div className="text-xs text-[var(--color-text-muted)] mt-1">I prefer to tap and select from lists</div>
          </button>
        </div>
      </div>

      <Button onClick={handleComplete} loading={loading} size="lg" className="w-full">
        Let&apos;s Go
      </Button>

      <button
        onClick={onBack}
        className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors mt-4"
      >
        Back
      </button>
    </div>
  );
}
