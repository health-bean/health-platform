// ─── Correlation Engine Types ───────────────────────────────────────────

/** Entry types the engine can analyze */
export type AnalyzableEntryType =
  | "food"
  | "symptom"
  | "supplement"
  | "medication"
  | "exposure"
  | "detox"
  | "exercise"
  | "off_protocol";

/** The 8 correlation types supported by the current schema */
export type CorrelationType =
  | "food-symptom"
  | "food-property-pattern"
  | "supplement-effect"
  | "medication-effect"
  | "sleep-supplement"
  | "stress-symptom"
  | "meal-timing"
  | "exercise-energy";

// ─── Input Types ────────────────────────────────────────────────────────

/** Normalized timeline entry for analysis */
export interface CorrelationEntry {
  id: string;
  entryType: AnalyzableEntryType;
  name: string;
  severity: number | null;
  date: string; // YYYY-MM-DD
  time: string | null; // HH:MM:SS
  timestamp: number; // epoch ms
  structuredContent: Record<string, unknown> | null;
  foodId: string | null; // UUID reference to foods or custom_foods table
}

/** Journal data for a single day */
export interface JournalData {
  date: string; // YYYY-MM-DD
  sleepScore: number | null;
  energyScore: number | null;
  moodScore: number | null;
  stressScore: number | null;
}

/** Trigger properties for a single food (from food_trigger_properties) */
export interface FoodProperties {
  oxalate: string;
  histamine: string;
  lectin: string;
  nightshade: boolean;
  fodmap: string;
  salicylate: string;
  amines: string;
  glutamates: string;
  sulfites: string;
  goitrogens: string;
  purines: string;
  phytoestrogens: string;
  phytates: string;
  tyramine: string;
}

/** Map of lowercase food name → trigger properties */
export type FoodPropertyMap = Map<string, FoodProperties>;

// ─── Raw Correlation (output from analyzers) ────────────────────────────

export interface RawCorrelation {
  type: CorrelationType;
  trigger: string;
  effect: string;
  confidence: number;
  occurrences: number;
  totalOpportunities: number;

  // food-symptom specific
  avgSeverity?: number;
  timeWindow?: number;
  timeWindowDescription?: string;

  // supplement-effect specific
  severityChange?: number;
  frequencyChange?: number;

  // medication-effect specific
  totalDoses?: number;

  // sleep-supplement specific
  sleepChange?: number;
  baselineSleep?: number;
  nightsAnalyzed?: number;

  // stress-symptom specific
  stressAmplification?: number;
  highStressCount?: number;
  lowStressCount?: number;

  // food-property-pattern specific
  contributingFoods?: string[];
  propertyType?: string;
  foodCount?: number;
  patternInsight?: string;
}

// ─── Scored Insight (after scoring & description generation) ────────────

export interface Insight {
  id: string;
  type: CorrelationType;
  trigger: string;
  effect: string;
  confidence: number;
  percentage: number; // confidence as 0-100
  occurrences: number;
  opportunities: number;
  timeframe: string;
  description: string;
  recommendation: string;
  impactScore: number;

  // pattern-specific
  contributingFoods?: string[];
  propertyType?: string;
  foodCount?: number;
}

// ─── Final Output ───────────────────────────────────────────────────────

export interface InsightSummary {
  total: number;
  foodTriggers: number;
  foodPatterns: number;
  supplementEffects: number;
  medicationEffects: number;
  stressAmplifiers: number;
  sleepFactors: number;
  mealTimingFactors: number;
  exerciseEnergyFactors: number;
}

export interface InsightResult {
  triggers: Insight[];
  helpers: Insight[];
  trends: Insight[];
  summary: InsightSummary;
}

// ─── Analyzer Options ───────────────────────────────────────────────────

export interface AnalyzerOptions {
  days: number;
  minInstances?: number;
}
