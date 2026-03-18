/**
 * FoodSearchInput Component - Usage Examples
 * 
 * This file demonstrates how to use the FoodSearchInput component
 * in different scenarios.
 */

import { useState } from "react";
import { FoodSearchInput } from "./FoodSearchInput";
import type { Food } from "@/types";

// ── Example 1: Basic Usage ──────────────────────────────────────────────────

export function BasicFoodSearch() {
  const handleFoodSelect = (food: Food) => {
    console.log("Selected food:", food);
    // Handle food selection (e.g., add to meal log)
  };

  return (
    <div className="p-4">
      <h2 className="mb-2 text-lg font-semibold">Search for a food</h2>
      <FoodSearchInput onSelect={handleFoodSelect} />
    </div>
  );
}

// ── Example 2: With Protocol Compliance ────────────────────────────────────

export function FoodSearchWithProtocol() {
  const userProtocolId = "aip-protocol-123"; // From user's active protocol

  const handleFoodSelect = (food: Food) => {
    // Check if food is compliant
    if (food.protocolStatus === "avoid") {
      // Show warning dialog
      const confirmed = confirm(
        `${food.displayName} is not allowed on your protocol. Log anyway?`
      );
      if (!confirmed) return;
    }

    // Proceed with logging
    console.log("Logging food:", food);
  };

  return (
    <div className="p-4">
      <h2 className="mb-2 text-lg font-semibold">Search foods (with protocol)</h2>
      <FoodSearchInput
        onSelect={handleFoodSelect}
        protocolId={userProtocolId}
        placeholder="Search foods..."
      />
    </div>
  );
}

// ── Example 3: In a Form ────────────────────────────────────────────────────

export function FoodLogForm() {
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [portion, setPortion] = useState("");
  const [mealType, setMealType] = useState("lunch");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFood) return;

    const payload = {
      entryType: "food",
      foodId: selectedFood.id,
      foodName: selectedFood.displayName,
      portion,
      mealType,
      entryDate: new Date().toISOString().split("T")[0],
    };

    const response = await fetch("/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      // Reset form
      setSelectedFood(null);
      setPortion("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium">
          Food <span className="text-red-500">*</span>
        </label>
        <FoodSearchInput
          onSelect={setSelectedFood}
          placeholder="Search for a food..."
          autoFocus
        />
        {selectedFood && (
          <div className="mt-2 rounded-lg border border-green-200 bg-green-50 p-2 text-sm">
            Selected: <strong>{selectedFood.displayName}</strong>
          </div>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">
          Portion
        </label>
        <input
          type="text"
          value={portion}
          onChange={(e) => setPortion(e.target.value)}
          placeholder="1 cup, 2 servings, etc."
          className="w-full rounded-lg border border-warm-200 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium">
          Meal Type
        </label>
        <select
          value={mealType}
          onChange={(e) => setMealType(e.target.value)}
          className="w-full rounded-lg border border-warm-200 px-3 py-2 text-sm"
        >
          <option value="breakfast">Breakfast</option>
          <option value="lunch">Lunch</option>
          <option value="dinner">Dinner</option>
          <option value="snack">Snack</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={!selectedFood}
        className="w-full rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
      >
        Log Food
      </button>
    </form>
  );
}

// ── Example 4: With Custom Styling ─────────────────────────────────────────

export function CustomStyledFoodSearch() {
  return (
    <div className="mx-auto max-w-md p-4">
      <div className="rounded-xl border-2 border-teal-200 bg-teal-50 p-6">
        <h3 className="mb-4 text-center text-xl font-bold text-teal-900">
          What did you eat?
        </h3>
        <FoodSearchInput
          onSelect={(food) => console.log(food)}
          placeholder="Type to search..."
          autoFocus
        />
      </div>
    </div>
  );
}

// ── Example 5: Handling Loading States ─────────────────────────────────────

export function FoodSearchWithLoadingState() {
  const [saving, setSaving] = useState(false);
  const [savedFood, setSavedFood] = useState<string | null>(null);

  const handleFoodSelect = async (food: Food) => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSavedFood(food.displayName);
      setTimeout(() => setSavedFood(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4">
      <FoodSearchInput
        onSelect={handleFoodSelect}
        placeholder="Search foods..."
      />
      {saving && (
        <div className="mt-2 text-sm text-warm-600">
          Saving...
        </div>
      )}
      {savedFood && (
        <div className="mt-2 rounded-lg border border-green-200 bg-green-50 p-2 text-sm text-green-800">
          ✓ Logged {savedFood}
        </div>
      )}
    </div>
  );
}

/**
 * Key Features Demonstrated:
 * 
 * 1. Debounced Search (200ms)
 *    - Reduces API calls while typing
 *    - Minimum 2 characters required
 * 
 * 2. Autocomplete Dropdown
 *    - Up to 10 results displayed
 *    - Shows food name, category, subcategory
 *    - Protocol compliance status (if protocolId provided)
 * 
 * 3. Keyboard Navigation
 *    - Arrow Up/Down: Navigate results
 *    - Enter: Select highlighted result
 *    - Escape: Close dropdown
 * 
 * 4. Loading Indicator
 *    - Shows spinner during search
 *    - Clear button when input has text
 * 
 * 5. Protocol Compliance
 *    - Visual badges (Allowed, Avoid, Moderation)
 *    - Warning messages for non-compliant foods
 * 
 * 6. Accessibility
 *    - Keyboard navigation support
 *    - Focus management
 *    - Screen reader friendly
 */
