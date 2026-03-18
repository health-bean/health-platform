"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input, Button, Card } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid email or password");
        return;
      }

      router.push(data.user.isAdmin ? "/admin" : "/chat");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center px-6 py-12 overflow-hidden">
      {/* Subtle gradient backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-50/80 via-[var(--color-surface)] to-warm-100" />

      <div className="relative w-full max-w-sm animate-fade-in-up">
        {/* Brand */}
        <div className="mb-10 text-center">
          <div className="mb-4">
            <span className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-teal-700">
              Chew
            </span>
            <span className="font-[family-name:var(--font-display)] text-4xl font-bold italic tracking-tight text-teal-500">
              IQ
            </span>
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-semibold text-[var(--color-text-primary)]">
            Welcome back
          </h1>
          <p className="mt-1.5 text-sm text-[var(--color-text-secondary)]">
            Sign in to continue your healing journey
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-xs text-teal-600 hover:text-teal-700 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <Button type="submit" loading={loading} className="mt-2 w-full">
              Log In
            </Button>
          </form>
        </Card>

        <p className="mt-8 text-center text-sm text-[var(--color-text-muted)]">
          Have an invite code?{" "}
          <Link
            href="/signup"
            className="text-teal-600 hover:text-teal-700 font-medium transition-colors"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
