/**
 * ProtocolComplianceWarning Component Examples
 * 
 * This file demonstrates various usage scenarios for the ProtocolComplianceWarning component.
 * These examples show how to integrate the warning into different parts of the application.
 */

"use client";

import { useState } from "react";
import { ProtocolComplianceWarning } from "./ProtocolComplianceWarning";
import type { Food, Protocol } from "@/types";

// Example 1: Inline Warning in Food Search
export function InlineFoodSearchWarning() {
  const [showWarning, setShowWarning] = useState(false);

  const exampleFood: Food = {
    id: "1",
    displayName: "Tomatoes",
    categoryName: "Vegetables",
    subcategoryName: "Nightshades",
    protocolStatus: "avoid",
    triggerProperties: {
      nightshade: true,
      histamine: "high",
      oxalate: "moderate",
      lectin: "moderate",
      fodmap: "low",
      salicylate: "high",
    },
  };

  const exampleProtocol: Protocol = {
    id: "aip",
    name: "Autoimmune Protocol (AIP)",
    description: "Eliminates inflammatory foods",
    category: "elimination",
    durationWeeks: 12,
    hasPhases: true,
  };

  const violations = ["nightshade", "high histamine", "high salicylate"];

  const handleProceed = () => {
    console.log("User chose to log food anyway");
    // Log the food to timeline
    setShowWarning(false);
  };

  const handleCancel = () => {
    console.log("User cancelled food logging");
    setShowWarning(false);
  };

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-lg font-semibold">Example 1: Inline Warning</h2>
      
      <button
        onClick={() => setShowWarning(!showWarning)}
        className="rounded-lg bg-teal-600 px-4 py-2 text-white hover:bg-teal-700"
      >
        {showWarning ? "Hide Warning" : "Show Warning"}
      </button>

      {showWarning && (
        <ProtocolComplianceWarning
          food={exampleFood}
          protocol={exampleProtocol}
          violations={violations}
          onProceed={handleProceed}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}

// Example 2: Modal Dialog Warning
export function ModalFoodWarning() {
  const [isOpen, setIsOpen] = useState(false);

  const exampleFood: Food = {
    id: "2",
    displayName: "Almonds",
    categoryName: "Nuts & Seeds",
    subcategoryName: "Tree Nuts",
    protocolStatus: "avoid",
    triggerProperties: {
      nightshade: false,
      histamine: "moderate",
      oxalate: "very_high",
      lectin: "moderate",
      fodmap: "moderate",
      salicylate: "moderate",
    },
  };

  const exampleProtocol: Protocol = {
    id: "low-oxalate",
    name: "Low Oxalate",
    description: "Reduces oxalate intake",
    category: "therapeutic",
    durationWeeks: null,
    hasPhases: false,
  };

  const violations = ["very high oxalate"];

  const handleProceed = () => {
    console.log("Proceeding with high-oxalate food");
    setIsOpen(false);
  };

  const handleCancel = () => {
    console.log("Cancelled logging");
    setIsOpen(false);
  };

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-lg font-semibold">Example 2: Modal Dialog</h2>
      
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-lg bg-teal-600 px-4 py-2 text-white hover:bg-teal-700"
      >
        Log Almonds
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-w-lg">
            <ProtocolComplianceWarning
              food={exampleFood}
              protocol={exampleProtocol}
              violations={violations}
              onProceed={handleProceed}
              onCancel={handleCancel}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Example 3: Multiple Violations
export function MultipleViolationsWarning() {
  const [showWarning, setShowWarning] = useState(true);

  const exampleFood: Food = {
    id: "3",
    displayName: "Aged Cheese",
    categoryName: "Dairy",
    subcategoryName: "Cheese",
    protocolStatus: "avoid",
    triggerProperties: {
      nightshade: false,
      histamine: "very_high",
      oxalate: "low",
      lectin: "low",
      fodmap: "high",
      salicylate: "low",
    },
  };

  const exampleProtocol: Protocol = {
    id: "low-histamine",
    name: "Low Histamine",
    description: "Eliminates high-histamine foods",
    category: "therapeutic",
    durationWeeks: null,
    hasPhases: false,
  };

  const violations = [
    "very high histamine",
    "high FODMAP",
    "dairy (contains lactose)",
    "aged/fermented (increases histamine)",
  ];

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-lg font-semibold">Example 3: Multiple Violations</h2>
      
      {showWarning && (
        <ProtocolComplianceWarning
          food={exampleFood}
          protocol={exampleProtocol}
          violations={violations}
          onProceed={() => setShowWarning(false)}
          onCancel={() => setShowWarning(false)}
        />
      )}
    </div>
  );
}

// Example 4: Chat Interface Integration
export function ChatInterfaceWarningExample() {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([
    { role: "user", content: "I had tomatoes for lunch" },
  ]);
  const [showWarning, setShowWarning] = useState(true);

  const exampleFood: Food = {
    id: "1",
    displayName: "Tomatoes",
    categoryName: "Vegetables",
    subcategoryName: "Nightshades",
    protocolStatus: "avoid",
    triggerProperties: {
      nightshade: true,
      histamine: "high",
      oxalate: "moderate",
      lectin: "moderate",
      fodmap: "low",
      salicylate: "high",
    },
  };

  const exampleProtocol: Protocol = {
    id: "aip",
    name: "Autoimmune Protocol (AIP)",
    description: "Eliminates inflammatory foods",
    category: "elimination",
    durationWeeks: 12,
    hasPhases: true,
  };

  const violations = ["nightshade", "high histamine"];

  const handleProceed = () => {
    setMessages([
      ...messages,
      {
        role: "assistant",
        content: "Logged: Tomatoes (lunch). Note: This food is not compliant with your AIP protocol.",
      },
    ]);
    setShowWarning(false);
  };

  const handleCancel = () => {
    setMessages([
      ...messages,
      {
        role: "assistant",
        content: "Okay, I won't log the tomatoes. What else would you like to track?",
      },
    ]);
    setShowWarning(false);
  };

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-lg font-semibold">Example 4: Chat Interface</h2>
      
      <div className="space-y-3 rounded-lg border border-warm-200 bg-warm-50 p-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`rounded-lg p-3 ${
              msg.role === "user"
                ? "bg-teal-100 text-teal-900"
                : "bg-white text-warm-800"
            }`}
          >
            <p className="text-sm font-medium">
              {msg.role === "user" ? "You" : "ChewIQ"}
            </p>
            <p className="mt-1 text-sm">{msg.content}</p>
          </div>
        ))}

        {showWarning && (
          <div className="mt-4">
            <ProtocolComplianceWarning
              food={exampleFood}
              protocol={exampleProtocol}
              violations={violations}
              onProceed={handleProceed}
              onCancel={handleCancel}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Example 5: Quick-Add Integration
export function QuickAddWarningExample() {
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [showWarning, setShowWarning] = useState(false);

  const foods: Food[] = [
    {
      id: "1",
      displayName: "Spinach",
      categoryName: "Vegetables",
      subcategoryName: "Leafy Greens",
      protocolStatus: "avoid",
      triggerProperties: {
        nightshade: false,
        histamine: "moderate",
        oxalate: "very_high",
        lectin: "low",
        fodmap: "low",
        salicylate: "moderate",
      },
    },
    {
      id: "2",
      displayName: "Chicken",
      categoryName: "Protein",
      subcategoryName: "Poultry",
      protocolStatus: "allowed",
      triggerProperties: {
        nightshade: false,
        histamine: "low",
        oxalate: "none",
        lectin: "none",
        fodmap: "low",
        salicylate: "none",
      },
    },
  ];

  const exampleProtocol: Protocol = {
    id: "low-oxalate",
    name: "Low Oxalate",
    description: "Reduces oxalate intake",
    category: "therapeutic",
    durationWeeks: null,
    hasPhases: false,
  };

  const handleFoodSelect = (food: Food) => {
    setSelectedFood(food);
    if (food.protocolStatus === "avoid") {
      setShowWarning(true);
    } else {
      console.log("Logging food:", food.displayName);
    }
  };

  const handleProceed = () => {
    console.log("Logging food anyway:", selectedFood?.displayName);
    setShowWarning(false);
    setSelectedFood(null);
  };

  const handleCancel = () => {
    setShowWarning(false);
    setSelectedFood(null);
  };

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-lg font-semibold">Example 5: Quick-Add Integration</h2>
      
      <div className="space-y-2">
        <p className="text-sm text-warm-600">Select a food to log:</p>
        {foods.map((food) => (
          <button
            key={food.id}
            onClick={() => handleFoodSelect(food)}
            className="w-full rounded-lg border border-warm-200 bg-white p-3 text-left hover:bg-warm-50"
          >
            <p className="font-medium">{food.displayName}</p>
            <p className="text-xs text-warm-500">{food.categoryName}</p>
            {food.protocolStatus === "avoid" && (
              <span className="mt-1 inline-block rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">
                Not allowed on protocol
              </span>
            )}
          </button>
        ))}
      </div>

      {showWarning && selectedFood && (
        <div className="mt-4">
          <ProtocolComplianceWarning
            food={selectedFood}
            protocol={exampleProtocol}
            violations={["very high oxalate"]}
            onProceed={handleProceed}
            onCancel={handleCancel}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Usage Notes:
 * 
 * 1. The component is flexible and can be used inline or in modals
 * 2. Violations should be human-readable strings
 * 3. The component handles its own styling but can be wrapped in containers
 * 4. Both callbacks (onProceed, onCancel) are required
 * 5. The component is responsive and works well on mobile
 * 
 * Integration Checklist:
 * - [ ] Fetch user's active protocol
 * - [ ] Check food compliance before showing warning
 * - [ ] Format violations as readable strings
 * - [ ] Handle proceed action (log food with warning flag)
 * - [ ] Handle cancel action (return to food selection)
 * - [ ] Consider tracking "proceed anyway" events for insights
 */
