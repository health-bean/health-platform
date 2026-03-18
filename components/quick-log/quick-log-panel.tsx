"use client";

import { useState, useEffect } from "react";
import { Check, X, Loader2, Apple, Frown, Activity } from "lucide-react";
import { Button } from "@/components/ui";
import { useQuickLog } from "@/hooks/use-quick-log";
import { RecentItems } from "./recent-items";
import { ProtocolFoods } from "./protocol-foods";
import { SymptomPicker } from "./symptom-picker";
import { ExerciseQuickAdd } from "./ExerciseQuickAdd";
import { FoodSearchInput } from "./FoodSearchInput";
import { FoodPropertyCard } from "@/components/foods/FoodPropertyCard";
import { ProtocolComplianceWarning } from "@/components/foods/ProtocolComplianceWarning";
import { CustomFoodForm } from "@/components/foods/CustomFoodForm";
import type { EntryType, Food, Protocol } from "@/types";

type TabType = "food" | "symptom" | "exercise";

export function QuickLogPanel() {
  const {
    items,
    addItem,
    removeItem,
    updateSeverity,
    submitAll,
    submitting,
    clear,
  } = useQuickLog();
  const [protocolId, setProtocolId] = useState<string | null>(null);
  const [protocol, setProtocol] = useState<Protocol | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("food");
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [showComplianceWarning, setShowComplianceWarning] = useState(false);
  const [showCustomFoodForm, setShowCustomFoodForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch user's current protocol
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/users/me");
        if (res.ok) {
          const data = await res.json();
          const currentProtocolId = data.user?.currentProtocolId ?? null;
          setProtocolId(currentProtocolId);
          
          // Fetch protocol details if available
          if (currentProtocolId) {
            const protocolRes = await fetch(`/api/protocols/${currentProtocolId}`);
            if (protocolRes.ok) {
              const protocolData = await protocolRes.json();
              setProtocol(protocolData.protocol);
            }
          }
        }
      } catch {
        // ignore
      }
    }
    load();
  }, []);

  // Build selected names set for highlighting
  const selectedNames = new Set(
    items.map((i) => `${i.entryType}:${i.name}`)
  );

  // Symptom severities map
  const severities: Record<string, number> = {};
  for (const item of items) {
    if (item.entryType === "symptom" && item.severity !== undefined) {
      severities[item.name] = item.severity;
    }
  }

  function handleSelect(entryType: EntryType, name: string) {
    const key = `${entryType}:${name}`;
    if (selectedNames.has(key)) {
      const item = items.find(
        (i) => i.entryType === entryType && i.name === name
      );
      if (item) removeItem(item.id);
    } else {
      addItem(entryType, name);
    }
    setSubmitted(false);
  }

  function handleSeverityChange(name: string, severity: number) {
    const item = items.find(
      (i) => i.entryType === "symptom" && i.name === name
    );
    if (item) updateSeverity(item.id, severity);
  }

  // Handle food selection from search
  function handleFoodSelect(food: Food) {
    setSearchQuery("");
    
    // Check protocol compliance
    if (protocolId && food.protocolStatus === "avoid") {
      setSelectedFood(food);
      setShowComplianceWarning(true);
      return;
    }

    // Show food property card and add to items
    setSelectedFood(food);
    addItem("food", food.displayName);
    setSubmitted(false);
  }

  // Calculate protocol violations for warning
  function getViolations(food: Food): string[] {
    const violations: string[] = [];
    const props = food.triggerProperties;

    if (props.nightshade) violations.push("nightshade");
    if (props.histamine === "high" || props.histamine === "very_high") violations.push("high histamine");
    if (props.oxalate === "high" || props.oxalate === "very_high") violations.push("high oxalate");
    if (props.lectin === "high" || props.lectin === "very_high") violations.push("high lectin");
    if (props.fodmap === "high" || props.fodmap === "very_high") violations.push("high FODMAP");
    if (props.salicylate === "high" || props.salicylate === "very_high") violations.push("high salicylate");

    return violations;
  }

  // Handle proceeding with non-compliant food
  function handleProceedWithFood() {
    if (selectedFood) {
      addItem("food", selectedFood.displayName);
      setSubmitted(false);
    }
    setShowComplianceWarning(false);
    setSelectedFood(null);
  }

  // Handle canceling non-compliant food
  function handleCancelFood() {
    setShowComplianceWarning(false);
    setSelectedFood(null);
  }

  // Handle custom food creation
  async function handleCustomFoodCreate(customFood: { displayName: string }) {
    addItem("food", customFood.displayName);
    setShowCustomFoodForm(false);
    setSubmitted(false);
  }

  async function handleSubmit() {
    const ok = await submitAll();
    if (ok) setSubmitted(true);
  }

  const tabs: { id: TabType; label: string; icon: typeof Apple }[] = [
    { id: "food", label: "Food", icon: Apple },
    { id: "symptom", label: "Symptom", icon: Frown },
    { id: "exercise", label: "Exercise", icon: Activity },
  ];

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-2xl px-4 py-4">
        {/* Tabs */}
        <div className="mb-4 flex gap-2 border-b border-warm-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-teal-600 text-teal-600"
                    : "border-transparent text-warm-500 hover:text-warm-700"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Selected items summary */}
        {items.length > 0 && (
          <div className="mb-4 rounded-xl border border-teal-200 bg-teal-50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-teal-800">
                {items.length} {items.length === 1 ? "item" : "items"} selected
              </span>
              <button
                onClick={clear}
                className="text-xs text-teal-600 hover:text-teal-800"
              >
                Clear all
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {items.map((item) => (
                <span
                  key={item.id}
                  className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-warm-700 shadow-sm"
                >
                  {item.name}
                  {item.severity && (
                    <span className="text-red-500">{item.severity}/10</span>
                  )}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="ml-0.5 text-warm-400 hover:text-warm-600"
                    aria-label={`Remove ${item.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Success message */}
        {submitted && items.length === 0 && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <Check className="h-4 w-4" />
            Entries saved to timeline!
          </div>
        )}

        {/* Tab content */}
        <div className="flex flex-col gap-6">
          {activeTab === "food" && (
            <>
              {/* Food Search */}
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-warm-400">
                  Search Foods
                </h3>
                <FoodSearchInput
                  onSelect={handleFoodSelect}
                  protocolId={protocolId ?? undefined}
                  placeholder="Search for a food..."
                />
                
                {/* Show custom food form option when no results */}
                {searchQuery.length >= 2 && (
                  <button
                    onClick={() => setShowCustomFoodForm(true)}
                    className="mt-2 text-sm text-teal-600 hover:text-teal-800"
                  >
                    Can&apos;t find your food? Create a custom food
                  </button>
                )}
              </div>

              {/* Selected Food Property Card */}
              {selectedFood && !showComplianceWarning && (
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-warm-400">
                    Food Properties
                  </h3>
                  <FoodPropertyCard properties={selectedFood.triggerProperties} />
                </div>
              )}

              {/* Protocol Compliance Warning Modal */}
              {showComplianceWarning && selectedFood && protocol && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                  <div className="w-full max-w-md">
                    <ProtocolComplianceWarning
                      food={selectedFood}
                      protocol={protocol}
                      violations={getViolations(selectedFood)}
                      onProceed={handleProceedWithFood}
                      onCancel={handleCancelFood}
                    />
                  </div>
                </div>
              )}

              {/* Custom Food Form Modal */}
              {showCustomFoodForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                  <div className="w-full max-w-md">
                    <CustomFoodForm
                      onSuccess={handleCustomFoodCreate}
                      onCancel={() => setShowCustomFoodForm(false)}
                    />
                  </div>
                </div>
              )}

              <RecentItems
                onSelect={handleSelect}
                selectedNames={selectedNames}
              />
              <ProtocolFoods
                protocolId={protocolId}
                onSelect={handleSelect}
                selectedNames={selectedNames}
              />
            </>
          )}

          {activeTab === "symptom" && (
            <SymptomPicker
              onSelect={handleSelect}
              selectedNames={selectedNames}
              onSeverityChange={handleSeverityChange}
              severities={severities}
            />
          )}

          {activeTab === "exercise" && (
            <ExerciseQuickAdd onSuccess={() => setSubmitted(true)} />
          )}
        </div>
      </div>

      {/* Submit bar - only for food/symptom tabs */}
      {items.length > 0 && activeTab !== "exercise" && (
        <div className="sticky bottom-0 border-t border-warm-200 bg-white px-4 py-3">
          <div className="mx-auto max-w-2xl">
            <Button
              onClick={handleSubmit}
              loading={submitting}
              className="w-full"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                `Log ${items.length} ${items.length === 1 ? "item" : "items"}`
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
