"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h2 className="text-xl font-semibold text-warm-900">
        Something went wrong
      </h2>
      <p className="max-w-md text-sm text-warm-500">
        An unexpected error occurred. Please try again, or contact support if
        the problem persists.
      </p>
      <Button onClick={reset} variant="secondary">
        Try again
      </Button>
    </div>
  );
}
