import { cn } from "@/lib/utils";

interface SkeletonProps {
  variant?: "text" | "card" | "circle";
  className?: string;
}

const variantClasses = {
  text: "h-4 w-full rounded",
  card: "h-24 w-full rounded-2xl",
  circle: "h-10 w-10 rounded-full",
} as const;

export function Skeleton({ variant = "text", className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "bg-warm-200 animate-pulse",
        variantClasses[variant],
        className
      )}
      aria-hidden="true"
    />
  );
}
