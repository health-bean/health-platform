"use client";

import { useState, useEffect } from "react";
import { Apple, Check } from "lucide-react";
import type { EntryType } from "@/types";

interface ProtocolFood {
  id: string;
  displayName: string;
  categoryName: string;
  subcategoryName: string;
  protocolStatus: string | null;
}

interface ProtocolFoodsProps {
  protocolId: string | null;
  onSelect: (entryType: EntryType, name: string) => void;
  selectedNames: Set<string>;
}

export function ProtocolFoods({
  protocolId,
  onSelect,
  selectedNames,
}: ProtocolFoodsProps) {
  const [foods, setFoods] = useState<ProtocolFood[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!protocolId) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        // Get common foods with protocol status
        const res = await fetch(
          `/api/foods/search?q=%&protocol=${protocolId}`
        );
        if (res.ok) {
          const data = await res.json();
          // Filter to allowed foods only
          const allowed = (data.foods ?? []).filter(
            (f: ProtocolFood) =>
              f.protocolStatus === "allowed" || f.protocolStatus === null
          );
          setFoods(allowed);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [protocolId]);

  if (loading || !protocolId || foods.length === 0) return null;

  // Group by category
  const byCategory = foods.reduce<Record<string, ProtocolFood[]>>(
    (acc, food) => {
      const cat = food.categoryName;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(food);
      return acc;
    },
    {}
  );

  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-warm-400">
        Protocol Foods
      </h3>
      <div className="flex flex-col gap-3">
        {Object.entries(byCategory).map(([category, catFoods]) => (
          <div key={category}>
            <p className="mb-1.5 text-xs font-medium text-warm-500">
              {category}
            </p>
            <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {catFoods.map((food) => {
                const isSelected = selectedNames.has(
                  `food:${food.displayName}`
                );
                return (
                  <button
                    key={food.id}
                    onClick={() => onSelect("food", food.displayName)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      isSelected
                        ? "border-green-300 bg-green-50 text-green-700"
                        : "border-warm-200 bg-white text-warm-700 hover:bg-warm-50"
                    }`}
                    style={{ minHeight: "36px" }}
                  >
                    {isSelected ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Apple className="h-3.5 w-3.5" />
                    )}
                    {food.displayName}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
