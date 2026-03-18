"use client";

import { cn } from "@/lib/utils";
import type { ComponentType, SVGProps } from "react";

interface Tab {
  value: string;
  label: string;
  icon?: ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;
}

interface TabsProps {
  tabs: Tab[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function Tabs({ tabs, value, onChange, className }: TabsProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-xl bg-warm-100 p-1",
        className
      )}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = tab.value === value;
        const Icon = tab.icon;

        return (
          <button
            key={tab.value}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium",
              "transition-all duration-200 ease-[var(--ease-out-expo)]",
              "cursor-pointer",
              isActive
                ? "bg-[var(--color-surface-card)] text-teal-700 font-semibold shadow-[var(--shadow-card)]"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            )}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export type { TabsProps };
