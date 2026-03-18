import { describe, it, expect } from "vitest";
import type { FoodTriggerProperties, TriggerLevel } from "@/types";

// Helper functions to test (extracted from component logic)
function getLevelColor(level: TriggerLevel): {
  bg: string;
  text: string;
  ring: string;
} {
  switch (level) {
    case "none":
    case "low":
      return {
        bg: "bg-green-50",
        text: "text-green-700",
        ring: "ring-green-600/20",
      };
    case "moderate":
      return {
        bg: "bg-yellow-50",
        text: "text-yellow-700",
        ring: "ring-yellow-600/20",
      };
    case "high":
    case "very_high":
      return {
        bg: "bg-red-50",
        text: "text-red-700",
        ring: "ring-red-600/20",
      };
    case "unknown":
    default:
      return {
        bg: "bg-warm-50",
        text: "text-warm-600",
        ring: "ring-warm-500/20",
      };
  }
}

function getBooleanColor(value: boolean): {
  bg: string;
  text: string;
  ring: string;
} {
  if (value) {
    return {
      bg: "bg-red-50",
      text: "text-red-700",
      ring: "ring-red-600/20",
    };
  }
  return {
    bg: "bg-green-50",
    text: "text-green-700",
    ring: "ring-green-600/20",
  };
}

function formatLevel(level: TriggerLevel): string {
  switch (level) {
    case "none":
      return "None";
    case "low":
      return "Low";
    case "moderate":
      return "Moderate";
    case "high":
      return "High";
    case "very_high":
      return "Very High";
    case "unknown":
    default:
      return "Unknown";
  }
}

function buildPropertyList(properties: FoodTriggerProperties) {
  const propertyList: Array<{ key: string; value: boolean | TriggerLevel; type: "boolean" | "level" }> = [];

  // Add nightshade (boolean)
  if (properties.nightshade !== undefined) {
    propertyList.push({
      key: "nightshade",
      value: properties.nightshade,
      type: "boolean",
    });
  }

  // Add level-based properties
  const levelProperties: Array<keyof FoodTriggerProperties> = [
    "histamine",
    "oxalate",
    "lectin",
    "fodmap",
    "salicylate",
    "amines",
    "glutamates",
    "sulfites",
    "goitrogens",
    "purines",
    "phytoestrogens",
    "phytates",
    "tyramine",
  ];

  for (const key of levelProperties) {
    const value = properties[key];
    if (value && value !== "unknown") {
      propertyList.push({
        key,
        value: value as TriggerLevel,
        type: "level",
      });
    }
  }

  return propertyList;
}

describe("FoodPropertyCard Logic", () => {
  describe("getLevelColor", () => {
    it("returns green for low and none levels", () => {
      expect(getLevelColor("low")).toEqual({
        bg: "bg-green-50",
        text: "text-green-700",
        ring: "ring-green-600/20",
      });
      expect(getLevelColor("none")).toEqual({
        bg: "bg-green-50",
        text: "text-green-700",
        ring: "ring-green-600/20",
      });
    });

    it("returns yellow for moderate level", () => {
      expect(getLevelColor("moderate")).toEqual({
        bg: "bg-yellow-50",
        text: "text-yellow-700",
        ring: "ring-yellow-600/20",
      });
    });

    it("returns red for high and very_high levels", () => {
      expect(getLevelColor("high")).toEqual({
        bg: "bg-red-50",
        text: "text-red-700",
        ring: "ring-red-600/20",
      });
      expect(getLevelColor("very_high")).toEqual({
        bg: "bg-red-50",
        text: "text-red-700",
        ring: "ring-red-600/20",
      });
    });

    it("returns slate for unknown level", () => {
      expect(getLevelColor("unknown")).toEqual({
        bg: "bg-warm-50",
        text: "text-warm-600",
        ring: "ring-warm-500/20",
      });
    });
  });

  describe("getBooleanColor", () => {
    it("returns red for true (nightshade present)", () => {
      expect(getBooleanColor(true)).toEqual({
        bg: "bg-red-50",
        text: "text-red-700",
        ring: "ring-red-600/20",
      });
    });

    it("returns green for false (nightshade not present)", () => {
      expect(getBooleanColor(false)).toEqual({
        bg: "bg-green-50",
        text: "text-green-700",
        ring: "ring-green-600/20",
      });
    });
  });

  describe("formatLevel", () => {
    it("formats all trigger levels correctly", () => {
      expect(formatLevel("none")).toBe("None");
      expect(formatLevel("low")).toBe("Low");
      expect(formatLevel("moderate")).toBe("Moderate");
      expect(formatLevel("high")).toBe("High");
      expect(formatLevel("very_high")).toBe("Very High");
      expect(formatLevel("unknown")).toBe("Unknown");
    });
  });

  describe("buildPropertyList", () => {
    it("includes nightshade when defined", () => {
      const properties: FoodTriggerProperties = {
        nightshade: true,
        histamine: "low",
        oxalate: "low",
        lectin: "low",
        fodmap: "low",
        salicylate: "low",
      };

      const list = buildPropertyList(properties);
      const nightshade = list.find((p) => p.key === "nightshade");

      expect(nightshade).toBeDefined();
      expect(nightshade?.value).toBe(true);
      expect(nightshade?.type).toBe("boolean");
    });

    it("excludes unknown properties", () => {
      const properties: FoodTriggerProperties = {
        nightshade: false,
        histamine: "unknown",
        oxalate: "low",
        lectin: "unknown",
        fodmap: "unknown",
        salicylate: "unknown",
      };

      const list = buildPropertyList(properties);
      
      expect(list.find((p) => p.key === "histamine")).toBeUndefined();
      expect(list.find((p) => p.key === "lectin")).toBeUndefined();
      expect(list.find((p) => p.key === "oxalate")).toBeDefined();
    });

    it("includes optional properties when provided", () => {
      const properties: FoodTriggerProperties = {
        nightshade: false,
        histamine: "low",
        oxalate: "low",
        lectin: "low",
        fodmap: "low",
        salicylate: "low",
        amines: "moderate",
        tyramine: "high",
        sulfites: "low",
      };

      const list = buildPropertyList(properties);

      expect(list.find((p) => p.key === "amines")).toBeDefined();
      expect(list.find((p) => p.key === "tyramine")).toBeDefined();
      expect(list.find((p) => p.key === "sulfites")).toBeDefined();
    });

    it("returns empty list when no properties are available", () => {
      const properties: FoodTriggerProperties = {
        nightshade: false,
        histamine: "unknown",
        oxalate: "unknown",
        lectin: "unknown",
        fodmap: "unknown",
        salicylate: "unknown",
      };

      // Remove nightshade to test empty state
      const emptyProperties = {
        ...properties,
        nightshade: undefined as any,
      };

      const list = buildPropertyList(emptyProperties);
      expect(list.length).toBe(0);
    });

    it("handles all trigger levels correctly", () => {
      const properties: FoodTriggerProperties = {
        nightshade: false,
        histamine: "none",
        oxalate: "low",
        lectin: "moderate",
        fodmap: "high",
        salicylate: "very_high",
      };

      const list = buildPropertyList(properties);

      expect(list.find((p) => p.key === "histamine")?.value).toBe("none");
      expect(list.find((p) => p.key === "oxalate")?.value).toBe("low");
      expect(list.find((p) => p.key === "lectin")?.value).toBe("moderate");
      expect(list.find((p) => p.key === "fodmap")?.value).toBe("high");
      expect(list.find((p) => p.key === "salicylate")?.value).toBe("very_high");
    });
  });
});
