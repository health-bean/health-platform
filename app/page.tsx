"use client";

import Link from "next/link";
import {
  MessageSquare,
  LineChart,
  Shield,
  Leaf,
  Sparkles,
  Users,
  ArrowRight,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui";

const features = [
  {
    icon: MessageSquare,
    title: "Conversational Tracking",
    description:
      "Just tell ChewIQ what you ate or how you feel. No forms, no dropdowns, no friction.",
    detail: "\"I had salmon for lunch and my joints are aching\"",
  },
  {
    icon: Shield,
    title: "Protocol Intelligence",
    description:
      "Built-in knowledge of AIP, GAPS, Low Histamine, and 6 more protocols.",
    detail: "Instant compliance checking on every food",
  },
  {
    icon: LineChart,
    title: "Correlation Insights",
    description:
      "AI identifies hidden patterns between what you eat and how you feel.",
    detail: "\"Spinach triggers joint pain 12-24 hours later\"",
  },
];

const secondaryFeatures = [
  { icon: Leaf, text: "Designed for brain fog — large targets, smart defaults" },
  { icon: Sparkles, text: "Personalized AI coach that learns your triggers" },
  { icon: Users, text: "Share data with your functional medicine practitioner" },
];

const testimonials = [
  {
    quote: "This is exactly what my patients need — they're managing too many systems.",
    author: "Functional Medicine Doctor",
  },
  {
    quote: "Finally, something that understands protocol complexity.",
    author: "Certified Nutritionist",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-[var(--color-surface)]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 lg:px-12">
        <div className="flex items-center gap-0.5">
          <span className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-teal-800">
            Chew
          </span>
          <span className="font-[family-name:var(--font-display)] text-xl font-bold italic tracking-tight text-teal-500">
            IQ
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">Log In</Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero — split layout with app preview */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50/80 via-[var(--color-surface)] to-warm-100/50" />

        <div className="relative mx-auto max-w-6xl px-6 py-16 lg:px-12 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left: copy */}
            <div className="animate-fade-in-up">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-1.5 text-xs font-medium text-teal-700">
                <Leaf className="h-3.5 w-3.5" />
                Your intelligent protocol coach
              </div>

              <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-4xl lg:text-5xl lg:leading-tight">
                Healing is personal.
                <br />
                <span className="text-teal-600">Your data should be too.</span>
              </h1>

              <p className="mt-5 max-w-md text-base text-[var(--color-text-secondary)] leading-relaxed">
                ChewIQ helps people with chronic illness navigate complex healing protocols
                with AI-powered tracking and personalized insights.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/signup">
                  <Button size="lg">
                    Start Free
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg">Log In</Button>
                </Link>
              </div>

              <p className="mt-4 text-xs text-[var(--color-text-muted)]">
                No credit card required. Built for patients and practitioners.
              </p>
            </div>

            {/* Right: app preview mock */}
            <div className="relative animate-fade-in-up lg:pl-8" style={{ animationDelay: "150ms" }}>
              <div className="mx-auto max-w-sm rounded-2xl bg-[var(--color-surface-card)] shadow-[var(--shadow-float)] border border-[var(--color-border)]/30 overflow-hidden">
                {/* Mock header */}
                <div className="flex items-center justify-between border-b border-[var(--color-border-light)] px-4 py-3">
                  <div className="flex items-center gap-0.5">
                    <span className="font-[family-name:var(--font-display)] text-sm font-bold text-teal-800">Chew</span>
                    <span className="font-[family-name:var(--font-display)] text-sm font-bold italic text-teal-500">IQ</span>
                  </div>
                  <span className="text-xs text-[var(--color-text-muted)]">Sarah</span>
                </div>

                {/* Mock chat */}
                <div className="flex flex-col gap-3 p-4">
                  <div className="self-end max-w-[75%] rounded-2xl rounded-br-sm bg-teal-600 px-3.5 py-2 text-xs text-white leading-relaxed">
                    I had salmon and sweet potato for lunch
                  </div>
                  <div className="self-start max-w-[80%] rounded-2xl rounded-bl-sm bg-[var(--color-surface-overlay)] px-3.5 py-2 text-xs text-[var(--color-text-primary)] leading-relaxed shadow-[var(--shadow-card)]">
                    Logged! Both are <strong>AIP compliant</strong>. Salmon is great for omega-3s — consistently one of your best foods. 🌿
                  </div>

                  {/* Mock extracted cards */}
                  <div className="self-start flex max-w-[80%] items-center gap-2.5 rounded-xl bg-teal-50 px-3 py-2">
                    <span className="text-sm">🐟</span>
                    <div>
                      <div className="text-xs font-semibold text-[var(--color-text-primary)]">Grilled Salmon</div>
                      <div className="text-[10px] text-emerald-600">Allowed ✓</div>
                    </div>
                  </div>
                  <div className="self-start flex max-w-[80%] items-center gap-2.5 rounded-xl bg-teal-50 px-3 py-2">
                    <span className="text-sm">🍠</span>
                    <div>
                      <div className="text-xs font-semibold text-[var(--color-text-primary)]">Sweet Potato</div>
                      <div className="text-[10px] text-emerald-600">Allowed ✓</div>
                    </div>
                  </div>
                </div>

                {/* Mock input */}
                <div className="border-t border-[var(--color-border-light)] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 rounded-xl border border-[var(--color-border)] px-3 py-2 text-xs text-[var(--color-text-muted)]">
                      Tell me what you ate or how you feel...
                    </div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-white text-xs">↑</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features — three distinct cards, not identical boxes */}
      <section className="border-t border-[var(--color-border-light)] bg-[var(--color-surface-card)] px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-[family-name:var(--font-display)] text-center text-2xl font-bold text-[var(--color-text-primary)] mb-3">
            Not another calorie counter
          </h2>
          <p className="text-center text-sm text-[var(--color-text-secondary)] mb-14 max-w-md mx-auto">
            ChewIQ understands healing protocols, tracks what matters, and reveals
            the patterns that unlock your path to wellness.
          </p>

          <div className="grid gap-6 lg:grid-cols-3 stagger-children">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-[var(--color-border)]/30 bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)] transition-all duration-300 hover:shadow-[var(--shadow-elevated)] hover:-translate-y-0.5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 mb-4 group-hover:bg-teal-100 transition-colors">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-3">
                  {f.description}
                </p>
                <p className="text-xs text-teal-600 font-medium italic">
                  {f.detail}
                </p>
              </div>
            ))}
          </div>

          {/* Secondary features — horizontal list */}
          <div className="mt-14 flex flex-wrap justify-center gap-x-8 gap-y-3">
            {secondaryFeatures.map((f) => (
              <div key={f.text} className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                <f.icon className="h-4 w-4 text-teal-500 shrink-0" />
                {f.text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="px-6 py-16 lg:px-12">
        <div className="mx-auto max-w-3xl">
          <div className="grid gap-6 sm:grid-cols-2">
            {testimonials.map((t) => (
              <div
                key={t.author}
                className="rounded-2xl border border-[var(--color-border)]/20 bg-[var(--color-surface-card)] p-6 shadow-[var(--shadow-card)]"
              >
                <p className="font-[family-name:var(--font-display)] text-base text-[var(--color-text-primary)] leading-relaxed italic mb-4">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <p className="text-xs font-medium text-[var(--color-text-muted)]">
                  — {t.author}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16 text-center lg:px-12">
        <div className="mx-auto max-w-md rounded-2xl bg-gradient-to-br from-teal-50 to-warm-100 p-10 border border-teal-100/50">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-text-primary)] mb-3">
            Ready to start healing smarter?
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6">
            Free to start. See patterns in 30 days.
          </p>
          <Link href="/signup">
            <Button size="lg">
              Get Started Free
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
          <div className="mt-4 flex justify-center gap-4 text-xs text-[var(--color-text-muted)]">
            <span className="flex items-center gap-1"><Check className="h-3 w-3 text-teal-500" /> No credit card</span>
            <span className="flex items-center gap-1"><Check className="h-3 w-3 text-teal-500" /> Cancel anytime</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border-light)] px-6 py-6 text-center text-xs text-[var(--color-text-muted)]">
        ChewIQ &mdash; Built for people healing through food.
      </footer>
    </div>
  );
}
