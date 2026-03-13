"use client";

import { cn } from "@/lib/utils";

interface ScoreSliderProps {
  label: string;
  value: number | null;
  onChange: (value: number) => void;
  color: string; // tailwind color class like "indigo" | "amber" | etc.
  hideLabel?: boolean;
}

const colorMap: Record<string, { bg: string; accent: string; track: string }> = {
  indigo: { bg: "bg-indigo-50", accent: "accent-indigo-600", track: "text-indigo-600" },
  amber: { bg: "bg-amber-50", accent: "accent-amber-500", track: "text-amber-600" },
  green: { bg: "bg-green-50", accent: "accent-green-600", track: "text-green-600" },
  red: { bg: "bg-red-50", accent: "accent-red-500", track: "text-red-600" },
  orange: { bg: "bg-orange-50", accent: "accent-orange-500", track: "text-orange-600" },
};

export function ScoreSlider({ label, value, onChange, color, hideLabel }: ScoreSliderProps) {
  const colors = colorMap[color] ?? colorMap.indigo;
  const displayValue = value ?? 5;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        {!hideLabel && (
          <span className="text-sm font-medium text-slate-700">{label}</span>
        )}
        <span className={cn("text-sm font-semibold", hideLabel && "ml-auto", colors.track)}>
          {value !== null ? `${value}/10` : "—"}
        </span>
      </div>
      <div className={cn("rounded-lg px-3 py-2", colors.bg)}>
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={displayValue}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className={cn(
            "w-full h-2 rounded-lg appearance-none cursor-pointer",
            "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-[28px] [&::-webkit-slider-thumb]:w-[28px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-current",
            colors.accent,
            colors.track
          )}
          style={{ minHeight: "44px" }}
          aria-label={`${label} score`}
        />
      </div>
    </div>
  );
}
