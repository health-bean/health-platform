import type {
  CorrelationEntry,
  JournalData,
  RawCorrelation,
  AnalyzerOptions,
} from "./types";

// ─── Helpers ────────────────────────────────────────────────────────────

/** Parse entry date + time into epoch ms. Defaults to noon if no time. */
export function parseTimestamp(date: string, time: string | null): number {
  const timeStr = time || "12:00:00";
  return new Date(`${date}T${timeStr}`).getTime();
}

function filterByType(entries: CorrelationEntry[], type: string): CorrelationEntry[] {
  return entries.filter((e) => e.entryType === type);
}

/** Filter food entries including off-protocol meals as food-like signals */
function filterFoodLike(entries: CorrelationEntry[]): CorrelationEntry[] {
  return entries.filter(
    (e) => e.entryType === "food" || e.entryType === "off_protocol"
  );
}

// ─── 1. Food → Symptom ─────────────────────────────────────────────────

const TIME_WINDOWS = [
  { ms: 8 * 60 * 60 * 1000, label: "8 hours" },
  { ms: 24 * 60 * 60 * 1000, label: "24 hours" },
  { ms: 48 * 60 * 60 * 1000, label: "48 hours" },
] as const;

export function analyzeFoodSymptom(
  entries: CorrelationEntry[],
  options: AnalyzerOptions
): RawCorrelation[] {
  const foods = filterFoodLike(entries);
  const symptoms = filterByType(entries, "symptom");
  if (foods.length === 0 || symptoms.length === 0) return [];

  const minInstances = options.minInstances ?? 2;
  const results: RawCorrelation[] = [];

  // Count total occurrences per food (using food_id when available, falling back to name)
  const foodTotals = new Map<string, number>();
  for (const f of foods) {
    const key = f.foodId || f.name;
    foodTotals.set(key, (foodTotals.get(key) || 0) + 1);
  }

  // For each time window, find co-occurrences
  for (const window of TIME_WINDOWS) {
    // key: "foodKey||symptomName" → { count, severitySum, foodName }
    const coOccurrences = new Map<string, { count: number; severitySum: number; foodName: string }>();

    for (const symptom of symptoms) {
      for (const food of foods) {
        const diff = symptom.timestamp - food.timestamp;
        // Food must be BEFORE symptom, within window
        if (diff > 0 && diff <= window.ms) {
          const foodKey = food.foodId || food.name;
          const key = `${foodKey}||${symptom.name}`;
          const existing = coOccurrences.get(key) || { count: 0, severitySum: 0, foodName: food.name };
          existing.count++;
          existing.severitySum += symptom.severity ?? 5;
          coOccurrences.set(key, existing);
        }
      }
    }

    for (const [key, data] of coOccurrences) {
      if (data.count < minInstances) continue;

      const [foodKey, symptomName] = key.split("||");
      const totalOpportunities = foodTotals.get(foodKey) || data.count;
      const confidence = data.count / totalOpportunities;
      const avgSeverity = data.severitySum / data.count;

      results.push({
        type: "food-symptom",
        trigger: data.foodName, // Use the actual food name for display
        effect: symptomName,
        confidence: Math.min(confidence, 1.0),
        occurrences: data.count,
        totalOpportunities,
        avgSeverity,
        timeWindow: window.ms,
        timeWindowDescription: window.label,
      });
    }
  }

  // Deduplicate: keep the shortest window with highest confidence per food-symptom pair
  const best = new Map<string, RawCorrelation>();
  for (const r of results) {
    const key = `${r.trigger}||${r.effect}`;
    const existing = best.get(key);
    if (!existing || r.confidence > existing.confidence) {
      best.set(key, r);
    }
  }

  return Array.from(best.values());
}

// ─── 2. Supplement → Symptom Effect ─────────────────────────────────────

export function analyzeSupplementEffect(
  entries: CorrelationEntry[],
  options: AnalyzerOptions
): RawCorrelation[] {
  const supplements = filterByType(entries, "supplement");
  const symptoms = filterByType(entries, "symptom");
  if (supplements.length === 0 || symptoms.length === 0) return [];

  const minInstances = options.minInstances ?? 5;
  const results: RawCorrelation[] = [];

  // Get unique supplement names
  const supplementNames = new Set(supplements.map((s) => s.name));

  for (const suppName of supplementNames) {
    const suppEntries = supplements.filter((s) => s.name === suppName);
    if (suppEntries.length < minInstances) continue;

    // Find earliest supplement date
    const suppDates = suppEntries.map((s) => s.date).sort();
    const startDate = suppDates[0];
    const startTs = new Date(startDate).getTime();

    // 4 weeks in ms
    const fourWeeks = 28 * 24 * 60 * 60 * 1000;

    // Get unique symptom names
    const symptomNames = new Set(symptoms.map((s) => s.name));

    for (const symptomName of symptomNames) {
      const symptomEntries = symptoms.filter((s) => s.name === symptomName);

      // Split symptoms into before/after supplement start
      const before = symptomEntries.filter(
        (s) => s.timestamp < startTs && s.timestamp >= startTs - fourWeeks
      );
      const after = symptomEntries.filter(
        (s) => s.timestamp >= startTs && s.timestamp <= startTs + fourWeeks
      );

      if (before.length < 2 || after.length === 0) continue;

      const avgSeverityBefore =
        before.reduce((sum, s) => sum + (s.severity ?? 5), 0) / before.length;
      const avgSeverityAfter =
        after.reduce((sum, s) => sum + (s.severity ?? 5), 0) / after.length;

      // Count frequency (entries per week)
      const freqBefore = before.length / 4; // 4 weeks
      const freqAfter = after.length / 4;

      const severityImprovement =
        avgSeverityBefore > 0
          ? (avgSeverityBefore - avgSeverityAfter) / avgSeverityBefore
          : 0;
      const frequencyImprovement =
        freqBefore > 0 ? (freqBefore - freqAfter) / freqBefore : 0;

      const confidence = Math.max(severityImprovement, frequencyImprovement);

      if (confidence <= 0) continue;

      results.push({
        type: "supplement-effect",
        trigger: suppName,
        effect: `reduced ${symptomName}`,
        confidence: Math.min(confidence, 1.0),
        occurrences: suppEntries.length,
        totalOpportunities: suppEntries.length,
        severityChange: severityImprovement,
        frequencyChange: frequencyImprovement,
      });
    }
  }

  return results;
}

// ─── 3. Medication → Symptom Effect ─────────────────────────────────────

export function analyzeMedicationEffect(
  entries: CorrelationEntry[],
  options: AnalyzerOptions
): RawCorrelation[] {
  const medications = filterByType(entries, "medication");
  const symptoms = filterByType(entries, "symptom");
  if (medications.length === 0 || symptoms.length === 0) return [];

  const minInstances = options.minInstances ?? 2;
  const windowMs = 6 * 60 * 60 * 1000; // 6 hours
  const results: RawCorrelation[] = [];

  const medNames = new Set(medications.map((m) => m.name));

  for (const medName of medNames) {
    const medEntries = medications.filter((m) => m.name === medName);
    const totalDoses = medEntries.length;

    const symptomNames = new Set(symptoms.map((s) => s.name));

    for (const symptomName of symptomNames) {
      const symptomEntries = symptoms.filter((s) => s.name === symptomName);

      // Count doses followed by symptom within window
      let correlationCount = 0;
      for (const dose of medEntries) {
        const hasSymptom = symptomEntries.some((s) => {
          const diff = s.timestamp - dose.timestamp;
          return diff > 0 && diff <= windowMs;
        });
        if (hasSymptom) correlationCount++;
      }

      if (correlationCount < minInstances) continue;

      const confidence = correlationCount / totalDoses;

      results.push({
        type: "medication-effect",
        trigger: medName,
        effect: symptomName,
        confidence: Math.min(confidence, 1.0),
        occurrences: correlationCount,
        totalOpportunities: totalDoses,
        totalDoses,
      });
    }
  }

  return results;
}

// ─── 4. Evening Supplement → Sleep Quality ──────────────────────────────

export function analyzeSleepSupplement(
  entries: CorrelationEntry[],
  journalData: JournalData[],
  options: AnalyzerOptions
): RawCorrelation[] {
  const supplements = filterByType(entries, "supplement");
  if (supplements.length === 0 || journalData.length === 0) return [];

  const minInstances = options.minInstances ?? 2;
  const results: RawCorrelation[] = [];

  // Filter supplements taken after 18:00
  const eveningSupps = supplements.filter((s) => {
    if (!s.time) return false;
    const hour = parseInt(s.time.split(":")[0], 10);
    return hour >= 18;
  });

  if (eveningSupps.length === 0) return [];

  // Build sleep score map by date
  const sleepByDate = new Map<string, number>();
  for (const j of journalData) {
    if (j.sleepScore != null) {
      sleepByDate.set(j.date, j.sleepScore);
    }
  }

  // Get all dates with sleep scores
  const allSleepDates = Array.from(sleepByDate.keys());
  if (allSleepDates.length === 0) return [];

  // Baseline: average sleep on days without any evening supplement
  const suppNames = new Set(eveningSupps.map((s) => s.name));

  // Dates with any evening supplement
  const eveningSuppDates = new Set(eveningSupps.map((s) => s.date));

  const baselineDates = allSleepDates.filter((d) => !eveningSuppDates.has(d));
  const baselineSleep =
    baselineDates.length > 0
      ? baselineDates.reduce((sum, d) => sum + (sleepByDate.get(d) || 0), 0) /
        baselineDates.length
      : 0;

  if (baselineSleep === 0) return [];

  for (const suppName of suppNames) {
    const thisSupp = eveningSupps.filter((s) => s.name === suppName);

    // Get next-day sleep scores
    const sleepScores: number[] = [];
    for (const s of thisSupp) {
      // Next day = supplement date + 1
      const nextDay = new Date(s.date + "T00:00:00");
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDayStr = nextDay.toISOString().split("T")[0];
      const score = sleepByDate.get(nextDayStr);
      if (score != null) {
        sleepScores.push(score);
      }
    }

    if (sleepScores.length < minInstances) continue;

    const avgSleep = sleepScores.reduce((a, b) => a + b, 0) / sleepScores.length;
    const change = avgSleep - baselineSleep;

    // Significance threshold: >= 0.5 point change
    if (Math.abs(change) < 0.5) continue;

    const confidence = Math.min(Math.abs(change) / 3, 1.0); // 3-point change = 100% confidence

    results.push({
      type: "sleep-supplement",
      trigger: suppName,
      effect: change > 0 ? "improved sleep quality" : "decreased sleep quality",
      confidence,
      occurrences: sleepScores.length,
      totalOpportunities: thisSupp.length,
      sleepChange: change,
      baselineSleep,
      nightsAnalyzed: sleepScores.length,
    });
  }

  return results;
}

// ─── 5. Stress → Symptom Amplification ──────────────────────────────────

export function analyzeStressSymptom(
  entries: CorrelationEntry[],
  journalData: JournalData[],
  _options: AnalyzerOptions // eslint-disable-line @typescript-eslint/no-unused-vars
): RawCorrelation[] {
  const symptoms = filterByType(entries, "symptom");
  if (symptoms.length === 0 || journalData.length === 0) return [];

  const results: RawCorrelation[] = [];

  // Build stress score map by date
  const stressByDate = new Map<string, number>();
  for (const j of journalData) {
    if (j.stressScore != null) {
      stressByDate.set(j.date, j.stressScore);
    }
  }

  // Group days
  const highStressDates = new Set<string>();
  const lowStressDates = new Set<string>();
  for (const [date, score] of stressByDate) {
    if (score >= 7) highStressDates.add(date);
    if (score <= 4) lowStressDates.add(date);
  }

  if (highStressDates.size < 3 || lowStressDates.size < 3) return [];

  // For each symptom, compare severity on high vs low stress days
  const symptomNames = new Set(symptoms.map((s) => s.name));

  for (const symptomName of symptomNames) {
    const symptomEntries = symptoms.filter((s) => s.name === symptomName);

    const highStressSymptoms = symptomEntries.filter((s) =>
      highStressDates.has(s.date)
    );
    const lowStressSymptoms = symptomEntries.filter((s) =>
      lowStressDates.has(s.date)
    );

    if (highStressSymptoms.length < 2 || lowStressSymptoms.length < 2) continue;

    const avgHigh =
      highStressSymptoms.reduce((sum, s) => sum + (s.severity ?? 5), 0) /
      highStressSymptoms.length;
    const avgLow =
      lowStressSymptoms.reduce((sum, s) => sum + (s.severity ?? 5), 0) /
      lowStressSymptoms.length;

    if (avgLow === 0) continue;
    const amplification = avgHigh / avgLow;

    if (amplification <= 1) continue;

    // Confidence based on amplification magnitude and sample size
    const sampleConfidence = Math.min(
      (highStressSymptoms.length + lowStressSymptoms.length) / 20,
      1.0
    );
    const ampConfidence = Math.min((amplification - 1) / 1.5, 1.0);
    const confidence = (sampleConfidence + ampConfidence) / 2;

    results.push({
      type: "stress-symptom",
      trigger: "high stress",
      effect: symptomName,
      confidence: Math.min(confidence, 1.0),
      occurrences: highStressSymptoms.length,
      totalOpportunities: highStressDates.size,
      stressAmplification: amplification,
      highStressCount: highStressDates.size,
      lowStressCount: lowStressDates.size,
      avgSeverity: avgHigh,
    });
  }

  return results;
}

// ─── 6. Meal Timing → Symptoms ──────────────────────────────────────────

export function analyzeMealTiming(
  entries: CorrelationEntry[],
  options: AnalyzerOptions
): RawCorrelation[] {
  const foods = filterFoodLike(entries);
  const symptoms = filterByType(entries, "symptom");
  if (foods.length === 0 || symptoms.length === 0) return [];

  const minInstances = options.minInstances ?? 3;
  const windowMs = 12 * 60 * 60 * 1000; // 12 hours
  const results: RawCorrelation[] = [];

  // Late meals: after 20:00
  const lateMeals = foods.filter((f) => {
    if (!f.time) return false;
    const hour = parseInt(f.time.split(":")[0], 10);
    return hour >= 20;
  });

  if (lateMeals.length === 0) return [];

  const symptomNames = new Set(symptoms.map((s) => s.name));
  const totalLateMeals = lateMeals.length;

  for (const symptomName of symptomNames) {
    const symptomEntries = symptoms.filter((s) => s.name === symptomName);

    let correlationCount = 0;
    let severitySum = 0;

    for (const meal of lateMeals) {
      const matched = symptomEntries.find((s) => {
        const diff = s.timestamp - meal.timestamp;
        return diff > 0 && diff <= windowMs;
      });
      if (matched) {
        correlationCount++;
        severitySum += matched.severity ?? 5;
      }
    }

    if (correlationCount < minInstances) continue;

    const confidence = correlationCount / totalLateMeals;

    results.push({
      type: "meal-timing",
      trigger: "late meals (after 8 PM)",
      effect: symptomName,
      confidence: Math.min(confidence, 1.0),
      occurrences: correlationCount,
      totalOpportunities: totalLateMeals,
      avgSeverity: severitySum / correlationCount,
    });
  }

  return results;
}

// ─── 7. Exercise → Energy Correlation ───────────────────────────────────

const ENERGY_TIME_WINDOWS = [
  { hours: 2, ms: 2 * 60 * 60 * 1000, label: "2h" },
  { hours: 4, ms: 4 * 60 * 60 * 1000, label: "4h" },
  { hours: 8, ms: 8 * 60 * 60 * 1000, label: "8h" },
  { hours: 24, ms: 24 * 60 * 60 * 1000, label: "24h" },
] as const;

export function analyzeExerciseEnergy(
  entries: CorrelationEntry[],
  options: AnalyzerOptions
): RawCorrelation[] {
  const exercises = filterByType(entries, "exercise");
  const energyLogs = entries.filter((e) => e.structuredContent?.energyLevel != null);

  if (exercises.length === 0) return [];

  const minInstances = options.minInstances ?? 5;
  const results: RawCorrelation[] = [];

  // Group exercises by type and intensity
  const exerciseGroups = new Map<string, CorrelationEntry[]>();
  for (const ex of exercises) {
    const exerciseType = ex.structuredContent?.exerciseType as string | undefined;
    const intensityLevel = ex.structuredContent?.intensityLevel as string | undefined;

    if (!exerciseType || !intensityLevel) continue;

    const key = `${exerciseType}:${intensityLevel}`;
    if (!exerciseGroups.has(key)) {
      exerciseGroups.set(key, []);
    }
    exerciseGroups.get(key)!.push(ex);
  }

  // Analyze each exercise group
  for (const [key, exGroup] of exerciseGroups) {
    if (exGroup.length < minInstances) continue;

    const [exerciseType, intensity] = key.split(":");

    // Track energy changes for each time window
    const windowChanges = new Map<number, number[]>();

    for (const ex of exGroup) {
      const exTime = ex.timestamp;
      const energyBefore = ex.structuredContent?.energyLevel as number | undefined;

      // Try each time window
      for (const window of ENERGY_TIME_WINDOWS) {
        const windowEnd = exTime + window.ms;

        // Find energy logs within this window after exercise
        const energyAfter = energyLogs.find(
          (e) => e.timestamp > exTime && e.timestamp <= windowEnd
        );

        if (energyAfter && energyBefore != null) {
          const afterLevel = energyAfter.structuredContent?.energyLevel as number;
          const change = afterLevel - energyBefore;

          // Only track significant changes (>= 2 points)
          if (Math.abs(change) >= 2) {
            if (!windowChanges.has(window.hours)) {
              windowChanges.set(window.hours, []);
            }
            windowChanges.get(window.hours)!.push(change);
          }
        }
      }
    }

    // Find the most significant time window
    let bestWindow: { hours: number; label: string; ms: number } | null = null;
    let bestChanges: number[] = [];
    let maxSignificance = 0;

    for (const window of ENERGY_TIME_WINDOWS) {
      const changes = windowChanges.get(window.hours);
      if (!changes || changes.length < 3) continue;

      // Calculate significance: average absolute change * sample size
      const avgAbsChange =
        changes.reduce((sum, c) => sum + Math.abs(c), 0) / changes.length;
      const significance = avgAbsChange * changes.length;

      if (significance > maxSignificance) {
        maxSignificance = significance;
        bestWindow = window;
        bestChanges = changes;
      }
    }

    // Create correlation if we found significant changes
    if (bestWindow && bestChanges.length >= 3) {
      const avgChange =
        bestChanges.reduce((sum, c) => sum + c, 0) / bestChanges.length;
      const confidence = Math.min((bestChanges.length / exGroup.length) * 100, 95);

      results.push({
        type: "exercise-energy",
        trigger: `${exerciseType} (${intensity})`,
        effect: avgChange > 0 ? "energy_boost" : "energy_drain",
        confidence: confidence / 100, // Convert to 0-1 range
        occurrences: bestChanges.length,
        totalOpportunities: exGroup.length,
        avgSeverity: Math.abs(avgChange),
        timeWindow: bestWindow.ms,
        timeWindowDescription: `within ${bestWindow.label}`,
      });
    }
  }

  return results;
}
