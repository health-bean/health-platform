# Exercise-Energy Integration Documentation

## Overview

The exercise-energy correlation analyzer has been successfully integrated into the Pico Health correlation engine. This document verifies that all requirements from Task 2.5 have been met.

## Integration Points

### 1. Analyzer Function Call

**Location**: `lib/correlations/engine.ts` (Line 195)

```typescript
const exerciseEnergy = analyzeExerciseEnergy(entries, options);
```

✅ **Verified**: The `analyzeExerciseEnergy` function is called in the `analyzeInsights` function alongside all other analyzers.

### 2. Correlation Array Inclusion

**Location**: `lib/correlations/engine.ts` (Lines 209-218)

```typescript
const allCorrelations: RawCorrelation[] = [
  ...filteredFoodSymptom,
  ...patterns,
  ...supplementEffect,
  ...medicationEffect,
  ...sleepSupplement,
  ...stressSymptom,
  ...mealTiming,
  ...exerciseEnergy,  // ✅ Included
];
```

✅ **Verified**: Exercise-energy correlations are included in the `allCorrelations` array that gets passed to the categorization function.

### 3. InsightSummary Field

**Location**: `lib/correlations/types.ts` (Lines 138-148)

```typescript
export interface InsightSummary {
  total: number;
  foodTriggers: number;
  foodPatterns: number;
  supplementEffects: number;
  medicationEffects: number;
  stressAmplifiers: number;
  sleepFactors: number;
  mealTimingFactors: number;
  exerciseEnergyFactors: number;  // ✅ Included
}
```

**Location**: `lib/correlations/scoring.ts` (Line 267)

```typescript
const summary: InsightSummary = {
  total: correlations.length,
  foodTriggers: correlations.filter((c) => c.type === "food-symptom").length,
  foodPatterns: correlations.filter((c) => c.type === "food-property-pattern").length,
  supplementEffects: correlations.filter((c) => c.type === "supplement-effect").length,
  medicationEffects: correlations.filter((c) => c.type === "medication-effect").length,
  stressAmplifiers: correlations.filter((c) => c.type === "stress-symptom").length,
  sleepFactors: correlations.filter((c) => c.type === "sleep-supplement").length,
  mealTimingFactors: correlations.filter((c) => c.type === "meal-timing").length,
  exerciseEnergyFactors: correlations.filter((c) => c.type === "exercise-energy").length,  // ✅ Calculated
};
```

✅ **Verified**: The `InsightSummary` interface includes the `exerciseEnergyFactors` field, and it's properly calculated in the categorization function.

### 4. Categorization Logic

**Location**: `lib/correlations/scoring.ts` (Lines 237-244)

```typescript
case "exercise-energy":
  // Energy boosts are helpers, energy drains are triggers
  if (c.effect === "energy_boost") {
    helpers.push(insight);
  } else {
    triggers.push(insight);
  }
  break;
```

✅ **Verified**: The categorization logic properly handles exercise-energy correlations:
- Energy boosts (`effect === "energy_boost"`) → **helpers**
- Energy drains (`effect === "energy_drain"`) → **triggers**

### 5. Description Generation

**Location**: `lib/correlations/scoring.ts` (Lines 78-83)

```typescript
case "exercise-energy": {
  const change = c.avgSeverity ?? 0;
  const dir = c.effect === "energy_boost" ? "increased" : "decreased";
  const window = c.timeWindowDescription ?? "24 hours";
  return `${c.trigger} ${dir} energy levels by ${change.toFixed(1)} points on average ${window} (${c.occurrences} instances analyzed).`;
}
```

✅ **Verified**: Exercise-energy correlations have proper description generation that includes:
- Exercise type and intensity (trigger)
- Direction of energy change (increased/decreased)
- Magnitude of change (avgSeverity)
- Time window
- Sample size (occurrences)

### 6. Recommendation Generation

**Location**: `lib/correlations/scoring.ts` (Lines 133-139)

```typescript
case "exercise-energy": {
  if (c.effect === "energy_boost") {
    return `${c.trigger} appears to boost your energy. Consider incorporating this exercise when you need an energy lift.`;
  }
  return `${c.trigger} may be draining your energy. Consider reducing intensity or duration, or trying at different times of day.`;
}
```

✅ **Verified**: Exercise-energy correlations have actionable recommendations:
- Energy boosts: Encourage incorporating the exercise
- Energy drains: Suggest adjusting intensity, duration, or timing

## Verification Results

All integration tests pass successfully:

```
✓ Test 1: analyzeExerciseEnergy function is imported
✓ Test 2: Sample data created with 5 exercises and 3 energy logs
✓ Test 3: analyzeExerciseEnergy returned 1 correlation(s)
✓ Test 4: Correlation type is 'exercise-energy'
✓ Test 5: categorizeInsights processed 1 correlation(s)
✓ Test 6: Energy boost correctly categorized as helper
✓ Test 7: Empty data handling works
✓ Test 8: Energy drain analyzer returned 1 correlation(s)
✓ Test 9: Energy drain correctly categorized as trigger
```

### Example Output

**Energy Boost Example:**
```
Trigger: running (moderate)
Effect: energy_boost
Confidence: 60.0%
Description: running (moderate) increased energy levels by 3.0 points on average within 2h (3 instances analyzed).
Recommendation: running (moderate) appears to boost your energy. Consider incorporating this exercise when you need an energy lift.
Category: helpers
```

**Energy Drain Example:**
```
Trigger: strength_training (vigorous)
Effect: energy_drain
Confidence: 60.0%
Description: strength_training (vigorous) decreased energy levels by 3.0 points on average within 2h (3 instances analyzed).
Recommendation: strength_training (vigorous) may be draining your energy. Consider reducing intensity or duration, or trying at different times of day.
Category: triggers
```

## Requirements Mapping

### Requirement 3.1: Exercise-Energy Correlation Analysis

✅ **Met**: The correlation engine analyzes relationships between exercise entries and energy level changes within multiple time windows (2h, 4h, 8h, 24h).

### Requirement 4.1: Exercise Insights Display

✅ **Met**: Exercise insights are properly categorized and include:
- Exercise type and intensity
- Average energy change
- Correlation strength (confidence)
- Sample size (occurrences)
- Actionable recommendations

## Data Flow

```
User Exercise Entry
    ↓
Timeline Entry (with exerciseType, intensityLevel, energyLevel)
    ↓
analyzeInsights() loads entries
    ↓
analyzeExerciseEnergy() analyzes patterns
    ↓
Returns RawCorrelation[] with type="exercise-energy"
    ↓
Added to allCorrelations array
    ↓
categorizeInsights() processes correlations
    ↓
Energy boosts → helpers array
Energy drains → triggers array
    ↓
InsightResult with summary.exerciseEnergyFactors
    ↓
API returns to frontend
    ↓
Displayed in Insights UI
```

## Files Modified

- ✅ `lib/correlations/engine.ts` - Calls analyzer and includes results
- ✅ `lib/correlations/scoring.ts` - Categorizes and generates descriptions
- ✅ `lib/correlations/types.ts` - Includes exercise-energy type and summary field
- ✅ `lib/correlations/analyzers.ts` - Implements analyzeExerciseEnergy function

## Testing

### Verification Script
Run: `npx tsx lib/correlations/verify-integration.ts`

This script tests:
1. Function import and callability
2. Correlation generation with sample data
3. Proper typing (exercise-energy)
4. Summary field inclusion
5. Energy boost categorization (helpers)
6. Energy drain categorization (triggers)
7. Empty data handling
8. Description and recommendation generation

### Integration Test
File: `lib/correlations/test-integration.ts`

Contains Jest-based integration tests for the full correlation engine flow.

## Conclusion

✅ **Task 2.5 Complete**: All requirements have been verified:

1. ✅ analyzeExerciseEnergy is called in analyzeInsights function
2. ✅ exercise-energy correlations are included in allCorrelations array
3. ✅ InsightSummary includes exerciseEnergyFactors count
4. ✅ Categorization logic properly handles exercise-energy type:
   - Energy boosts → helpers
   - Energy drains → triggers
5. ✅ Descriptions and recommendations are generated
6. ✅ All integration tests pass

The exercise analyzer is fully integrated into the correlation engine and ready for use in the insights API.
