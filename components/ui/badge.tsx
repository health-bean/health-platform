import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const variantClasses = {
  allowed: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  avoid: "bg-red-50 text-red-700 ring-red-600/15",
  moderation: "bg-amber-50 text-amber-700 ring-amber-600/15",
  default: "bg-warm-100 text-warm-700 ring-warm-600/15",
  info: "bg-teal-50 text-teal-700 ring-teal-600/15",
  supplement: "bg-purple-50 text-purple-700 ring-purple-600/15",
} as const;

type BadgeVariant = keyof typeof variantClasses;

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5",
        "text-xs font-medium ring-1 ring-inset",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export type { BadgeProps, BadgeVariant };
