"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Auth error:", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <h2 className="text-xl font-semibold text-warm-900">
        Something went wrong
      </h2>
      <p className="max-w-md text-sm text-warm-500">
        We hit an unexpected error. Please try again.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-xl bg-warm-100 px-4 py-2.5 text-sm font-medium text-warm-700 hover:bg-warm-200"
        >
          Try again
        </button>
        <Link
          href="/login"
          className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700"
        >
          Back to login
        </Link>
      </div>
    </div>
  );
}
