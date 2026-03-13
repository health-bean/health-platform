import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  date,
  time,
  serial,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ─── Domain Data Tables (seeded from existing DB) ───────────────────────

export const foodCategories = pgTable("food_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
});

export const foodSubcategories = pgTable("food_subcategories", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => foodCategories.id),
  name: varchar("name", { length: 100 }).notNull(),
});

export const foods = pgTable("foods", {
  id: uuid("id").defaultRandom().primaryKey(),
  displayName: varchar("display_name", { length: 255 }).notNull(),
  subcategoryId: integer("subcategory_id")
    .notNull()
    .references(() => foodSubcategories.id),
  properties: jsonb("properties").$type<Record<string, unknown>>(),
  displayOrder: integer("display_order").default(0),
  isCommon: boolean("is_common").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const foodTriggerProperties = pgTable(
  "food_trigger_properties",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    foodId: uuid("food_id")
      .notNull()
      .references(() => foods.id, { onDelete: "cascade" }),
    oxalate: varchar("oxalate", { length: 20 }).default("unknown"),
    histamine: varchar("histamine", { length: 20 }).default("unknown"),
    lectin: varchar("lectin", { length: 20 }).default("unknown"),
    nightshade: boolean("nightshade").default(false),
    fodmap: varchar("fodmap", { length: 20 }).default("unknown"),
    salicylate: varchar("salicylate", { length: 20 }).default("unknown"),
    amines: varchar("amines", { length: 20 }).default("unknown"),
    glutamates: varchar("glutamates", { length: 20 }).default("unknown"),
    sulfites: varchar("sulfites", { length: 20 }).default("unknown"),
    goitrogens: varchar("goitrogens", { length: 20 }).default("unknown"),
    purines: varchar("purines", { length: 20 }).default("unknown"),
    phytoestrogens: varchar("phytoestrogens", { length: 20 }).default("unknown"),
    phytates: varchar("phytates", { length: 20 }).default("unknown"),
    tyramine: varchar("tyramine", { length: 20 }).default("unknown"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [uniqueIndex("food_trigger_food_id_idx").on(table.foodId)]
);

export const protocols = pgTable("protocols", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }),
  durationWeeks: integer("duration_weeks"),
  hasPhases: boolean("has_phases").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const protocolPhases = pgTable("protocol_phases", {
  id: uuid("id").defaultRandom().primaryKey(),
  protocolId: uuid("protocol_id")
    .notNull()
    .references(() => protocols.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 50 }).notNull(),
  phaseOrder: integer("phase_order").notNull(),
  durationWeeks: integer("duration_weeks"),
  description: text("description"),
  guidance: text("guidance"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const protocolRules = pgTable("protocol_rules", {
  id: uuid("id").defaultRandom().primaryKey(),
  protocolId: uuid("protocol_id")
    .notNull()
    .references(() => protocols.id, { onDelete: "cascade" }),
  phaseId: uuid("phase_id").references(() => protocolPhases.id, {
    onDelete: "cascade",
  }),
  ruleType: varchar("rule_type", { length: 50 }).notNull(),
  propertyName: varchar("property_name", { length: 50 }),
  propertyValues: text("property_values").array(),
  status: varchar("status", { length: 20 }).notNull(),
  ruleOrder: integer("rule_order").default(0),
  notes: text("notes"),
});

export const protocolFoodOverrides = pgTable(
  "protocol_food_overrides",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    protocolId: uuid("protocol_id")
      .notNull()
      .references(() => protocols.id, { onDelete: "cascade" }),
    foodId: uuid("food_id")
      .notNull()
      .references(() => foods.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 20 }).notNull(),
    overrideReason: text("override_reason"),
    notes: text("notes"),
  },
  (table) => [
    uniqueIndex("protocol_food_override_idx").on(table.protocolId, table.foodId),
  ]
);

// Reference data tables
export const symptomsDatabase = pgTable("symptoms_database", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  description: text("description"),
  isCommon: boolean("is_common").default(false),
});

export const supplementsDatabase = pgTable("supplements_database", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  description: text("description"),
  commonDosage: varchar("common_dosage", { length: 100 }),
});

export const medicationsDatabase = pgTable("medications_database", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  description: text("description"),
});

export const detoxTypes = pgTable("detox_types", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  description: text("description"),
});

// ─── App Tables ─────────────────────────────────────────────────────────

/**
 * Profiles table — stores app-specific user data.
 * The `id` column matches the Supabase Auth user UUID.
 * Auth (email, password, sessions) is handled by Supabase Auth.
 */
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(), // matches auth.users.id
  email: varchar("email", { length: 255 }).notNull().unique(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }),
  currentProtocolId: uuid("current_protocol_id").references(() => protocols.id),
  isAdmin: boolean("is_admin").default(false),
  // Onboarding tracking
  onboardingCompleted: boolean("onboarding_completed").default(false),
  onboardingStep: varchar("onboarding_step", { length: 50 }).default("welcome"),
  healthGoals: text("health_goals").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/** @deprecated Use `profiles` instead. Alias for backward compatibility during migration. */
export const users = profiles;

export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).default("New conversation"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 20 }).notNull(), // user | assistant
  content: text("content").notNull(),
  extractedData: jsonb("extracted_data"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const timelineEntries = pgTable("timeline_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sourceMessageId: uuid("source_message_id").references(() => messages.id),
  entryType: varchar("entry_type", { length: 20 }).notNull(), // food, symptom, supplement, medication, exposure, detox, exercise
  name: varchar("name", { length: 255 }).notNull(),
  severity: integer("severity"),
  structuredContent: jsonb("structured_content").$type<Record<string, unknown>>(),
  entryDate: date("entry_date").notNull(),
  entryTime: time("entry_time"),
  // Exercise tracking fields
  exerciseType: varchar("exercise_type", { length: 50 }),
  durationMinutes: integer("duration_minutes"),
  intensityLevel: varchar("intensity_level", { length: 20 }),
  energyLevel: integer("energy_level"),
  // Food logging fields
  foodId: uuid("food_id").references(() => foods.id),
  portion: varchar("portion", { length: 100 }),
  mealType: varchar("meal_type", { length: 20 }),
  // Sample data tracking
  isSample: boolean("is_sample").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const journalEntries = pgTable(
  "journal_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    entryDate: date("entry_date").notNull(),
    sleepScore: integer("sleep_score"),
    energyScore: integer("energy_score"),
    moodScore: integer("mood_score"),
    stressScore: integer("stress_score"),
    painScore: integer("pain_score"),
    notes: text("notes"),
    isSample: boolean("is_sample").default(false),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [uniqueIndex("journal_user_date_idx").on(table.userId, table.entryDate)]
);

export const userProtocolState = pgTable(
  "user_protocol_state",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    protocolId: uuid("protocol_id")
      .notNull()
      .references(() => protocols.id, { onDelete: "cascade" }),
    currentPhaseId: uuid("current_phase_id").references(
      () => protocolPhases.id
    ),
    phaseStartDate: date("phase_start_date").notNull(),
    expectedEndDate: date("expected_end_date"),
    startedAt: timestamp("started_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    uniqueIndex("user_protocol_state_idx").on(table.userId, table.protocolId),
  ]
);

export const reintroductionLog = pgTable("reintroduction_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  protocolId: uuid("protocol_id")
    .notNull()
    .references(() => protocols.id, { onDelete: "cascade" }),
  foodId: uuid("food_id").references(() => foods.id),
  foodName: varchar("food_name", { length: 255 }).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, passed, failed, inconclusive
  outcome: text("outcome"),
  symptomsSummary: jsonb("symptoms_summary").$type<Record<string, unknown>>(),
  // Enhanced tracking fields
  currentPhase: varchar("current_phase", { length: 20 }).default("testing"),
  currentDay: integer("current_day").default(1),
  lastLogDate: date("last_log_date"),
  missedDays: integer("missed_days").default(0),
  analysisDate: date("analysis_date"),
  analysisNotes: text("analysis_notes"),
  cancellationDate: date("cancellation_date"),
  cancellationReason: text("cancellation_reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── Reintroduction Tracking ────────────────────────────────────────────

export const reintroductionEntries = pgTable(
  "reintroduction_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reintroductionId: uuid("reintroduction_id")
      .notNull()
      .references(() => reintroductionLog.id, { onDelete: "cascade" }),
    timelineEntryId: uuid("timeline_entry_id")
      .notNull()
      .references(() => timelineEntries.id, { onDelete: "cascade" }),
    entryPhase: varchar("entry_phase", { length: 20 }).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    uniqueIndex("reintroduction_entries_timeline_entry_id_unique").on(
      table.timelineEntryId
    ),
  ]
);

// ─── Custom Foods ───────────────────────────────────────────────────────

export const customFoods = pgTable("custom_foods", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  displayName: varchar("display_name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }),
  subcategory: varchar("subcategory", { length: 100 }),
  isArchived: boolean("is_archived").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const customFoodProperties = pgTable(
  "custom_food_properties",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    customFoodId: uuid("custom_food_id")
      .notNull()
      .references(() => customFoods.id, { onDelete: "cascade" }),
    oxalate: varchar("oxalate", { length: 20 }).default("unknown"),
    histamine: varchar("histamine", { length: 20 }).default("unknown"),
    lectin: varchar("lectin", { length: 20 }).default("unknown"),
    nightshade: boolean("nightshade").default(false),
    fodmap: varchar("fodmap", { length: 20 }).default("unknown"),
    salicylate: varchar("salicylate", { length: 20 }).default("unknown"),
    amines: varchar("amines", { length: 20 }).default("unknown"),
    glutamates: varchar("glutamates", { length: 20 }).default("unknown"),
    sulfites: varchar("sulfites", { length: 20 }).default("unknown"),
    goitrogens: varchar("goitrogens", { length: 20 }).default("unknown"),
    purines: varchar("purines", { length: 20 }).default("unknown"),
    phytoestrogens: varchar("phytoestrogens", { length: 20 }).default("unknown"),
    phytates: varchar("phytates", { length: 20 }).default("unknown"),
    tyramine: varchar("tyramine", { length: 20 }).default("unknown"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    uniqueIndex("custom_food_properties_custom_food_id_unique").on(
      table.customFoodId
    ),
  ]
);
