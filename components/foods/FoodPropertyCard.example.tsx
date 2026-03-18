import { FoodPropertyCard } from "./FoodPropertyCard";
import type { FoodTriggerProperties } from "@/types";

/**
 * Example usage of FoodPropertyCard component
 * 
 * This component displays food trigger properties with color-coded indicators
 * and tooltips explaining each property.
 */

// Example 1: High-trigger food (tomato - nightshade with high histamine)
const tomatoProperties: FoodTriggerProperties = {
  nightshade: true,
  histamine: "high",
  oxalate: "moderate",
  lectin: "low",
  fodmap: "low",
  salicylate: "high",
};

// Example 2: Low-trigger food (cucumber)
const cucumberProperties: FoodTriggerProperties = {
  nightshade: false,
  histamine: "low",
  oxalate: "low",
  lectin: "low",
  fodmap: "low",
  salicylate: "low",
};

// Example 3: Food with optional properties (aged cheese)
const agedCheeseProperties: FoodTriggerProperties = {
  nightshade: false,
  histamine: "very_high",
  oxalate: "low",
  lectin: "low",
  fodmap: "low",
  salicylate: "low",
  amines: "high",
  tyramine: "very_high",
};

// Example 4: Food with unknown properties
const unknownFoodProperties: FoodTriggerProperties = {
  nightshade: false,
  histamine: "unknown",
  oxalate: "unknown",
  lectin: "unknown",
  fodmap: "unknown",
  salicylate: "unknown",
};

export function FoodPropertyCardExamples() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="mb-2 text-lg font-semibold">High-Trigger Food (Tomato)</h2>
        <FoodPropertyCard properties={tomatoProperties} />
      </div>

      <div>
        <h2 className="mb-2 text-lg font-semibold">Low-Trigger Food (Cucumber)</h2>
        <FoodPropertyCard properties={cucumberProperties} />
      </div>

      <div>
        <h2 className="mb-2 text-lg font-semibold">
          Food with Optional Properties (Aged Cheese)
        </h2>
        <FoodPropertyCard properties={agedCheeseProperties} />
      </div>

      <div>
        <h2 className="mb-2 text-lg font-semibold">
          Food with Unknown Properties
        </h2>
        <FoodPropertyCard properties={unknownFoodProperties} />
      </div>

      <div>
        <h2 className="mb-2 text-lg font-semibold">With Custom Styling</h2>
        <FoodPropertyCard
          properties={tomatoProperties}
          className="shadow-lg"
        />
      </div>
    </div>
  );
}

/**
 * Usage in a food detail view:
 * 
 * ```tsx
 * import { FoodPropertyCard } from "@/components/foods/FoodPropertyCard";
 * 
 * function FoodDetailView({ food }: { food: Food }) {
 *   return (
 *     <div>
 *       <h1>{food.displayName}</h1>
 *       <FoodPropertyCard properties={food.triggerProperties} />
 *     </div>
 *   );
 * }
 * ```
 * 
 * Usage in food search results:
 * 
 * ```tsx
 * import { FoodPropertyCard } from "@/components/foods/FoodPropertyCard";
 * 
 * function FoodSearchResult({ food }: { food: Food }) {
 *   return (
 *     <div className="border rounded-lg p-4">
 *       <h3>{food.displayName}</h3>
 *       <p className="text-sm text-warm-600">{food.categoryName}</p>
 *       <FoodPropertyCard 
 *         properties={food.triggerProperties} 
 *         className="mt-3"
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
