"use client";

import Link from "next/link";
import { MessageSquare, LineChart, Shield } from "lucide-react";
import { Button } from "@/components/ui";

const features = [
  {
    icon: MessageSquare,
    title: "Conversational Tracking",
    description:
      "Just tell ChewIQ what you ate, how you feel, or what supplements you took. No forms, no friction.",
  },
  {
    icon: Shield,
    title: "Protocol-Aware",
    description:
      "ChewIQ knows your elimination protocol and flags foods that may not be compliant.",
  },
  {
    icon: LineChart,
    title: "Correlation Insights",
    description:
      "Over time, ChewIQ identifies patterns between what you eat and how you feel.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      {/* Hero */}
      <header className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-warm-900 sm:text-5xl">
          ChewIQ
        </h1>
        <p className="mt-4 max-w-md text-lg text-warm-600">
          Track your health through conversation
        </p>
        <p className="mt-2 max-w-sm text-sm text-warm-500">
          An AI health companion that understands elimination protocols,
          logs your food and symptoms, and reveals hidden correlations.
        </p>

        <div className="mt-8 flex gap-3">
          <Link href="/signup">
            <Button size="lg">Get Started</Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary" size="lg">
              Log In
            </Button>
          </Link>
        </div>
      </header>

      {/* Features */}
      <section className="border-t border-warm-200 bg-white px-6 py-16">
        <div className="mx-auto grid max-w-3xl gap-10 sm:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-warm-900">
                {f.title}
              </h3>
              <p className="mt-2 text-sm text-warm-500">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-warm-200 px-6 py-6 text-center text-xs text-warm-400">
        ChewIQ &mdash; Built for people healing through food.
      </footer>
    </div>
  );
}
