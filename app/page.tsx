"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    fetch("/api/users/me")
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
        throw new Error("Not authenticated");
      })
      .then(() => {
        // TODO: read user's homeTab preference and redirect accordingly
        // For now, default to timeline
        router.replace("/timeline");
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [router]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[var(--color-surface)]">
      <Spinner />
    </div>
  );
}
