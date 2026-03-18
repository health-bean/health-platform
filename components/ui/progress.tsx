import { cn } from "@/lib/utils";

const trackSizeClasses = {
  sm: "h-1.5",
  md: "h-2.5",
} as const;

interface ProgressProps {
  value: number;
  label?: string;
  showValue?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function Progress({
  value,
  label,
  showValue = false,
  size = "md",
  className,
}: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && (
            <span className="text-xs font-medium text-[var(--color-text-secondary)]">
              {label}
            </span>
          )}
          {showValue && (
            <span className="text-xs font-medium text-[var(--color-text-muted)]">
              {Math.round(clamped)}%
            </span>
          )}
        </div>
      )}

      <div
        className={cn(
          "w-full overflow-hidden rounded-full bg-teal-100",
          trackSizeClasses[size]
        )}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className={cn(
            "rounded-full bg-teal-500 transition-all duration-500",
            trackSizeClasses[size],
            clamped === 0 && "w-0",
            clamped > 0 && clamped <= 5 && "w-[5%]",
            clamped > 5 && clamped <= 10 && "w-[10%]",
            clamped > 10 && clamped <= 15 && "w-[15%]",
            clamped > 15 && clamped <= 20 && "w-1/5",
            clamped > 20 && clamped <= 25 && "w-1/4",
            clamped > 25 && clamped <= 33 && "w-1/3",
            clamped > 33 && clamped <= 40 && "w-2/5",
            clamped > 40 && clamped <= 50 && "w-1/2",
            clamped > 50 && clamped <= 60 && "w-3/5",
            clamped > 60 && clamped <= 66 && "w-2/3",
            clamped > 66 && clamped <= 75 && "w-3/4",
            clamped > 75 && clamped <= 80 && "w-4/5",
            clamped > 80 && clamped <= 90 && "w-[90%]",
            clamped > 90 && clamped < 100 && "w-[95%]",
            clamped === 100 && "w-full"
          )}
        />
      </div>
    </div>
  );
}
