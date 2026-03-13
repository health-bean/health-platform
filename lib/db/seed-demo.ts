/**
 * Demo data seed for testing the correlation engine.
 *
 * Creates a user "Sarah" with 90 days of realistic timeline + journal data
 * that produces known correlations:
 *
 *  - Food property pattern: high oxalate foods → headaches (spinach, almonds)
 *  - Food property pattern: high histamine foods → headaches (aged cheese, sauerkraut)
 *  - Food property pattern: nightshade foods → joint pain (tomatoes, bell peppers)
 *  - Individual food-symptom: chocolate → brain fog
 *  - Supplement effect: magnesium → reduced headaches
 *  - Stress amplification: high stress → worse joint pain
 *  - Meal timing: late meals → bloating
 *
 * Run:  npx tsx lib/db/seed-demo.ts
 */

import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is required.");
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { max: 1 });

const DEMO_USER_ID = "dd000000-0000-0000-0000-000000000001";
const AIP_PROTOCOL_ID = "a80be547-6db1-4722-a5a4-60930143a2d9";

function log(msg: string) {
  console.log(`[seed-demo] ${msg}`);
}

/** Random integer between min and max (inclusive) */
function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Random float between min and max */
function randf(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/** Pick a random item from an array */
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Format date as YYYY-MM-DD */
function fmtDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

/** Format time as HH:MM:SS */
function fmtTime(hour: number, min: number): string {
  return `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}:00`;
}

// ─── Data Design ────────────────────────────────────────────────────────

// Foods the user regularly eats (must match food display_name in DB)
const TRIGGER_FOODS = {
  // High oxalate → headaches
  "Spinach": { freq: 0.35, mealHour: [7, 12] },
  "Almonds": { freq: 0.3, mealHour: [10, 15] },
  // High histamine → headaches
  "Aged Cheese": { freq: 0.25, mealHour: [12, 18] },
  "Sauerkraut": { freq: 0.2, mealHour: [12, 18] },
  // Nightshade → joint pain
  "Tomatoes": { freq: 0.4, mealHour: [12, 19] },
  "Bell Peppers": { freq: 0.3, mealHour: [12, 19] },
  // Brain fog trigger (individual, not pattern)
  "Chocolate": { freq: 0.25, mealHour: [14, 20] },
};

const SAFE_FOODS = [
  "Chicken Breast", "White Rice", "Sweet Potato", "Broccoli",
  "Salmon", "Olive Oil", "Blueberries", "Avocado",
  "Coconut Oil", "Ground Turkey",
];

const SUPPLEMENTS = [
  { name: "Magnesium", freq: 0.85, hour: 21 },   // Evening, high compliance
  { name: "Vitamin D", freq: 0.8, hour: 8 },
  { name: "Omega-3", freq: 0.7, hour: 8 },
  { name: "Turmeric", freq: 0.6, hour: 12 },
];

const MEDICATION = { name: "LDN (Low Dose Naltrexone)", freq: 0.9, hour: 22 };

// ─── Seed Logic ─────────────────────────────────────────────────────────

async function seedDemoUser() {
  log("Creating demo user Sarah profile...");

  await sql`
    INSERT INTO profiles (id, email, first_name, current_protocol_id)
    VALUES (${DEMO_USER_ID}, 'sarah@demo.com', 'Sarah', ${AIP_PROTOCOL_ID})
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      first_name = EXCLUDED.first_name,
      current_protocol_id = EXCLUDED.current_protocol_id
  `;

  log("Profile created for sarah@demo.com");
}

async function clearDemoData() {
  log("Clearing existing demo data...");
  await sql`DELETE FROM journal_entries WHERE user_id = ${DEMO_USER_ID}`;
  await sql`DELETE FROM timeline_entries WHERE user_id = ${DEMO_USER_ID}`;
  log("Cleared.");
}

async function seedTimelineAndJournal() {
  const now = new Date();
  const days = 90;

  // Magnesium start date: 45 days ago (so we have before/after data)
  const magStartDay = 45;

  const timelineRows: {
    userId: string;
    entryType: string;
    name: string;
    severity: number | null;
    entryDate: string;
    entryTime: string;
  }[] = [];

  const journalRows: {
    userId: string;
    entryDate: string;
    sleepScore: number;
    energyScore: number;
    moodScore: number;
    stressScore: number;
  }[] = [];

  for (let dayOffset = days; dayOffset >= 0; dayOffset--) {
    const date = new Date(now);
    date.setDate(date.getDate() - dayOffset);
    const dateStr = fmtDate(date);

    // ── Stress cycle: high stress roughly every 5-7 days, lasting 2-3 days
    const stressCycle = Math.sin(dayOffset * 0.9) * 0.5 + 0.5; // 0-1
    const baseStress = stressCycle > 0.75 ? rand(7, 9) : rand(2, 5);
    const isHighStress = baseStress >= 7;

    // ── Journal entry
    const baseSleep = rand(5, 8);
    // Magnesium evening → better sleep next day (handled by supplement timing)
    journalRows.push({
      userId: DEMO_USER_ID,
      entryDate: dateStr,
      sleepScore: baseSleep,
      energyScore: rand(4, 8),
      moodScore: rand(4, 8),
      stressScore: baseStress,
    });

    // ── Foods: 3-5 safe foods daily
    const numSafeFoods = rand(3, 5);
    const todaySafe = [...SAFE_FOODS].sort(() => Math.random() - 0.5).slice(0, numSafeFoods);
    for (const food of todaySafe) {
      const hour = pick([7, 8, 12, 13, 18, 19]);
      timelineRows.push({
        userId: DEMO_USER_ID,
        entryType: "food",
        name: food,
        severity: null,
        entryDate: dateStr,
        entryTime: fmtTime(hour, rand(0, 45)),
      });
    }

    // ── Trigger foods (probabilistic)
    for (const [foodName, config] of Object.entries(TRIGGER_FOODS)) {
      if (Math.random() < config.freq) {
        const hour = rand(config.mealHour[0], config.mealHour[1]);
        timelineRows.push({
          userId: DEMO_USER_ID,
          entryType: "food",
          name: foodName,
          severity: null,
          entryDate: dateStr,
          entryTime: fmtTime(hour, rand(0, 45)),
        });
      }
    }

    // ── Late meals for meal-timing correlation (2-3x per week)
    if (Math.random() < 0.35) {
      const lateFoodName = pick(["White Rice", "Sweet Potato", "Chicken Breast"]);
      timelineRows.push({
        userId: DEMO_USER_ID,
        entryType: "food",
        name: lateFoodName,
        severity: null,
        entryDate: dateStr,
        entryTime: fmtTime(rand(20, 22), rand(0, 45)),
      });
    }

    // ── Supplements
    const magnesiumTaken = dayOffset <= magStartDay;
    for (const supp of SUPPLEMENTS) {
      if (supp.name === "Magnesium" && !magnesiumTaken) continue;
      if (Math.random() < supp.freq) {
        timelineRows.push({
          userId: DEMO_USER_ID,
          entryType: "supplement",
          name: supp.name,
          severity: null,
          entryDate: dateStr,
          entryTime: fmtTime(supp.hour, rand(0, 30)),
        });
      }
    }

    // ── Medication
    if (Math.random() < MEDICATION.freq) {
      timelineRows.push({
        userId: DEMO_USER_ID,
        entryType: "medication",
        name: MEDICATION.name,
        severity: null,
        entryDate: dateStr,
        entryTime: fmtTime(MEDICATION.hour, rand(0, 30)),
      });
    }

    // ── Symptoms (correlated with triggers)

    // Check what trigger foods were eaten today
    const todayFoods = timelineRows
      .filter((r) => r.entryDate === dateStr && r.entryType === "food")
      .map((r) => r.name);

    const ateOxalate = todayFoods.includes("Spinach") || todayFoods.includes("Almonds");
    const ateHistamine = todayFoods.includes("Aged Cheese") || todayFoods.includes("Sauerkraut");
    const ateNightshade = todayFoods.includes("Tomatoes") || todayFoods.includes("Bell Peppers");
    const ateChocolate = todayFoods.includes("Chocolate");
    const ateLateMeal = timelineRows.some(
      (r) => r.entryDate === dateStr && r.entryType === "food" &&
        parseInt(r.entryTime.split(":")[0], 10) >= 20
    );

    // Headaches: triggered by oxalate + histamine foods
    // Before magnesium: ~70% chance after trigger foods
    // After magnesium: ~30% chance (supplement helps)
    const headacheBaseChance = magnesiumTaken ? 0.30 : 0.70;
    if (ateOxalate && Math.random() < headacheBaseChance) {
      const foodHour = todayFoods.includes("Spinach")
        ? rand(7, 12)
        : rand(10, 15);
      timelineRows.push({
        userId: DEMO_USER_ID,
        entryType: "symptom",
        name: "Headache",
        severity: rand(4, 8),
        entryDate: dateStr,
        entryTime: fmtTime(foodHour + rand(2, 6), rand(0, 59)),
      });
    }
    if (ateHistamine && Math.random() < headacheBaseChance * 0.8) {
      timelineRows.push({
        userId: DEMO_USER_ID,
        entryType: "symptom",
        name: "Headache",
        severity: rand(3, 7),
        entryDate: dateStr,
        entryTime: fmtTime(rand(15, 21), rand(0, 59)),
      });
    }

    // Joint pain: triggered by nightshades, amplified by stress
    if (ateNightshade) {
      const jointPainChance = isHighStress ? 0.75 : 0.5;
      if (Math.random() < jointPainChance) {
        const baseSeverity = isHighStress ? rand(6, 9) : rand(3, 6);
        timelineRows.push({
          userId: DEMO_USER_ID,
          entryType: "symptom",
          name: "Joint Pain",
          severity: baseSeverity,
          entryDate: dateStr,
          entryTime: fmtTime(rand(14, 22), rand(0, 59)),
        });
      }
    }
    // Stress-only joint pain (without nightshades, lower rate)
    if (!ateNightshade && isHighStress && Math.random() < 0.3) {
      timelineRows.push({
        userId: DEMO_USER_ID,
        entryType: "symptom",
        name: "Joint Pain",
        severity: rand(4, 7),
        entryDate: dateStr,
        entryTime: fmtTime(rand(14, 22), rand(0, 59)),
      });
    }

    // Brain fog: triggered by chocolate
    if (ateChocolate && Math.random() < 0.6) {
      timelineRows.push({
        userId: DEMO_USER_ID,
        entryType: "symptom",
        name: "Brain Fog",
        severity: rand(3, 7),
        entryDate: dateStr,
        entryTime: fmtTime(rand(16, 22), rand(0, 59)),
      });
    }

    // Bloating: triggered by late meals
    if (ateLateMeal && Math.random() < 0.65) {
      timelineRows.push({
        userId: DEMO_USER_ID,
        entryType: "symptom",
        name: "Bloating",
        severity: rand(3, 6),
        entryDate: dateStr,
        entryTime: fmtTime(rand(21, 23), rand(0, 59)),
      });
    }

    // Random noise: occasional symptoms without clear trigger
    if (Math.random() < 0.08) {
      timelineRows.push({
        userId: DEMO_USER_ID,
        entryType: "symptom",
        name: pick(["Fatigue", "Nausea", "Brain Fog"]),
        severity: rand(2, 5),
        entryDate: dateStr,
        entryTime: fmtTime(rand(8, 20), rand(0, 59)),
      });
    }
  }

  // ── Fix sleep scores: magnesium evening → better sleep next day
  for (let i = 1; i < journalRows.length; i++) {
    const prevDate = journalRows[i - 1].entryDate;
    const tookMagnesiumEvening = timelineRows.some(
      (r) =>
        r.entryDate === prevDate &&
        r.entryType === "supplement" &&
        r.name === "Magnesium" &&
        parseInt(r.entryTime.split(":")[0], 10) >= 18
    );
    if (tookMagnesiumEvening) {
      // Boost sleep by 1-2 points (capped at 10), round to integer for DB
      journalRows[i].sleepScore = Math.min(Math.round(journalRows[i].sleepScore + randf(1, 2.5)), 10);
    }
  }

  // ── Insert timeline entries in batches
  log(`Inserting ${timelineRows.length} timeline entries...`);
  const BATCH_SIZE = 50;
  for (let i = 0; i < timelineRows.length; i += BATCH_SIZE) {
    const batch = timelineRows.slice(i, i + BATCH_SIZE);
    for (const r of batch) {
      await sql`
        INSERT INTO timeline_entries (user_id, entry_type, name, severity, entry_date, entry_time)
        VALUES (${r.userId}, ${r.entryType}, ${r.name}, ${r.severity}, ${r.entryDate}, ${r.entryTime})
      `;
    }
  }

  // ── Insert journal entries
  log(`Inserting ${journalRows.length} journal entries...`);
  for (const r of journalRows) {
    await sql`
      INSERT INTO journal_entries (user_id, entry_date, sleep_score, energy_score, mood_score, stress_score)
      VALUES (${r.userId}, ${r.entryDate}, ${r.sleepScore}, ${r.energyScore}, ${r.moodScore}, ${r.stressScore})
      ON CONFLICT (user_id, entry_date) DO UPDATE SET
        sleep_score = EXCLUDED.sleep_score,
        energy_score = EXCLUDED.energy_score,
        mood_score = EXCLUDED.mood_score,
        stress_score = EXCLUDED.stress_score
    `;
  }

  // Stats
  const foodCount = timelineRows.filter((r) => r.entryType === "food").length;
  const symptomCount = timelineRows.filter((r) => r.entryType === "symptom").length;
  const suppCount = timelineRows.filter((r) => r.entryType === "supplement").length;
  const medCount = timelineRows.filter((r) => r.entryType === "medication").length;

  log(`Timeline: ${foodCount} foods, ${symptomCount} symptoms, ${suppCount} supplements, ${medCount} medications`);
  log(`Journal: ${journalRows.length} daily entries`);
}

// ─── Main ───────────────────────────────────────────────────────────────

async function main() {
  try {
    await seedDemoUser();
    await clearDemoData();
    await seedTimelineAndJournal();
    log("Done! Login as sarah@demo.com / demo123");
  } catch (err) {
    console.error("[seed-demo] Error:", err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// ─── Export for Onboarding ─────────────────────────────────────────────

/**
 * Generate sample data for a user during onboarding.
 * Creates 30 days of realistic timeline + journal data.
 */
export async function generateSampleData(userId: string) {
  const { db } = await import("@/lib/db");
  const { timelineEntries, journalEntries } = await import("@/lib/db/schema");
  const { eq } = await import("drizzle-orm");

  // Clear existing data
  await db.delete(journalEntries).where(eq(journalEntries.userId, userId));
  await db.delete(timelineEntries).where(eq(timelineEntries.userId, userId));

  const now = new Date();
  const days = 30;

  for (let dayOffset = days; dayOffset >= 0; dayOffset--) {
    const date = new Date(now);
    date.setDate(date.getDate() - dayOffset);
    const dateStr = fmtDate(date);

    // Journal entry
    await db.insert(journalEntries).values({
      userId,
      entryDate: dateStr,
      sleepScore: rand(5, 8),
      energyScore: rand(4, 8),
      moodScore: rand(4, 8),
      stressScore: rand(2, 7),
      isSample: true,
    });

    // Safe foods (2-4 per day)
    const numFoods = rand(2, 4);
    const todayFoods = [...SAFE_FOODS].sort(() => Math.random() - 0.5).slice(0, numFoods);
    for (const food of todayFoods) {
      const hour = pick([7, 8, 12, 13, 18, 19]);
      await db.insert(timelineEntries).values({
        userId,
        entryType: "food",
        name: food,
        entryDate: dateStr,
        entryTime: fmtTime(hour, rand(0, 45)),
        isSample: true,
      });
    }

    // Occasional trigger foods
    if (Math.random() < 0.3) {
      const triggerFood = pick(Object.keys(TRIGGER_FOODS));
      const config = TRIGGER_FOODS[triggerFood as keyof typeof TRIGGER_FOODS];
      const hour = rand(config.mealHour[0], config.mealHour[1]);
      await db.insert(timelineEntries).values({
        userId,
        entryType: "food",
        name: triggerFood,
        entryDate: dateStr,
        entryTime: fmtTime(hour, rand(0, 45)),
        isSample: true,
      });

      // Correlated symptom
      if (Math.random() < 0.5) {
        await db.insert(timelineEntries).values({
          userId,
          entryType: "symptom",
          name: pick(["Headache", "Joint Pain", "Brain Fog", "Bloating"]),
          severity: rand(3, 7),
          entryDate: dateStr,
          entryTime: fmtTime(hour + rand(2, 6), rand(0, 59)),
          isSample: true,
        });
      }
    }

    // Supplements (1-2 per day)
    if (Math.random() < 0.7) {
      const supp = pick(SUPPLEMENTS);
      await db.insert(timelineEntries).values({
        userId,
        entryType: "supplement",
        name: supp.name,
        entryDate: dateStr,
        entryTime: fmtTime(supp.hour, rand(0, 30)),
        isSample: true,
      });
    }
  }
}

if (require.main === module) {
  main();
}
