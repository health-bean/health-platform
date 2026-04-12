CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" varchar(100) NOT NULL,
	"target_type" varchar(50) NOT NULL,
	"target_id" varchar(255),
	"details" jsonb,
	"ip_address" varchar(45),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(255) DEFAULT 'New conversation',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "custom_food_properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"custom_food_id" uuid NOT NULL,
	"oxalate" varchar(20) DEFAULT 'unknown',
	"histamine" varchar(20) DEFAULT 'unknown',
	"lectin" varchar(20) DEFAULT 'unknown',
	"nightshade" boolean DEFAULT false,
	"fodmap" varchar(20) DEFAULT 'unknown',
	"salicylate" varchar(20) DEFAULT 'unknown',
	"amines" varchar(20) DEFAULT 'unknown',
	"glutamates" varchar(20) DEFAULT 'unknown',
	"sulfites" varchar(20) DEFAULT 'unknown',
	"goitrogens" varchar(20) DEFAULT 'unknown',
	"purines" varchar(20) DEFAULT 'unknown',
	"phytoestrogens" varchar(20) DEFAULT 'unknown',
	"phytates" varchar(20) DEFAULT 'unknown',
	"tyramine" varchar(20) DEFAULT 'unknown',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "custom_foods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"category" varchar(100),
	"subcategory" varchar(100),
	"is_archived" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "day_composites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"date" date NOT NULL,
	"food_count" integer DEFAULT 0 NOT NULL,
	"symptom_count" integer DEFAULT 0 NOT NULL,
	"supplement_count" integer DEFAULT 0 NOT NULL,
	"medication_count" integer DEFAULT 0 NOT NULL,
	"exposure_count" integer DEFAULT 0 NOT NULL,
	"exercise_count" integer DEFAULT 0 NOT NULL,
	"sleep_score" integer,
	"energy_score" integer,
	"mood_score" integer,
	"stress_score" integer,
	"pain_score" integer,
	"protocol_id" uuid,
	"compliance_pct" numeric(5, 2),
	"violation_count" integer DEFAULT 0 NOT NULL,
	"foods" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"symptoms" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"supplements" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"medications" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"exposures" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"exercises" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"entry_count" integer DEFAULT 0 NOT NULL,
	"has_journal" boolean DEFAULT false NOT NULL,
	"is_flare_day" boolean DEFAULT false NOT NULL,
	"has_late_meal" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "detox_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"category" varchar(50) NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "food_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	CONSTRAINT "food_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "food_subcategories" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"name" varchar(100) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "food_trigger_properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"food_id" uuid NOT NULL,
	"oxalate" varchar(20) DEFAULT 'unknown',
	"histamine" varchar(20) DEFAULT 'unknown',
	"lectin" varchar(20) DEFAULT 'unknown',
	"nightshade" boolean DEFAULT false,
	"fodmap" varchar(20) DEFAULT 'unknown',
	"salicylate" varchar(20) DEFAULT 'unknown',
	"amines" varchar(20) DEFAULT 'unknown',
	"glutamates" varchar(20) DEFAULT 'unknown',
	"sulfites" varchar(20) DEFAULT 'unknown',
	"goitrogens" varchar(20) DEFAULT 'unknown',
	"purines" varchar(20) DEFAULT 'unknown',
	"phytoestrogens" varchar(20) DEFAULT 'unknown',
	"phytates" varchar(20) DEFAULT 'unknown',
	"tyramine" varchar(20) DEFAULT 'unknown',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "foods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"subcategory_id" integer NOT NULL,
	"properties" jsonb,
	"display_order" integer DEFAULT 0,
	"is_common" boolean DEFAULT false,
	"source" varchar(20) DEFAULT 'curated',
	"usda_fdc_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "insight_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"alert_type" text NOT NULL,
	"insight_key" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"detail" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"dismissed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"dismissed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "insight_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"days_analyzed" integer NOT NULL,
	"triggers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"helpers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"patterns" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"progress" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"single_count" integer DEFAULT 0 NOT NULL,
	"two_factor_count" integer DEFAULT 0 NOT NULL,
	"three_factor_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journal_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"entry_date" date NOT NULL,
	"sleep_score" integer,
	"energy_score" integer,
	"mood_score" integer,
	"stress_score" integer,
	"pain_score" integer,
	"notes" text,
	"is_sample" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "medications_database" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"category" varchar(50) NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"role" varchar(20) NOT NULL,
	"content" text NOT NULL,
	"extracted_data" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100),
	"current_protocol_id" uuid,
	"is_admin" boolean DEFAULT false,
	"onboarding_completed" boolean DEFAULT false,
	"onboarding_step" varchar(50) DEFAULT 'welcome',
	"timezone" varchar(50) DEFAULT 'America/New_York',
	"health_goals" text[],
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "profiles_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "protocol_food_overrides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"protocol_id" uuid NOT NULL,
	"food_id" uuid NOT NULL,
	"status" varchar(20) NOT NULL,
	"override_reason" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "protocol_phases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"protocol_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(50) NOT NULL,
	"phase_order" integer NOT NULL,
	"duration_weeks" integer,
	"description" text,
	"guidance" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "protocol_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"protocol_id" uuid NOT NULL,
	"phase_id" uuid,
	"rule_type" varchar(50) NOT NULL,
	"property_name" varchar(50),
	"property_values" text[],
	"status" varchar(20) NOT NULL,
	"rule_order" integer DEFAULT 0,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "protocols" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(50),
	"duration_weeks" integer,
	"has_phases" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reintroduction_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reintroduction_id" uuid NOT NULL,
	"timeline_entry_id" uuid NOT NULL,
	"entry_phase" varchar(20) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reintroduction_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"protocol_id" uuid NOT NULL,
	"food_id" uuid,
	"food_name" varchar(255) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"outcome" text,
	"symptoms_summary" jsonb,
	"current_phase" varchar(20) DEFAULT 'testing',
	"current_day" integer DEFAULT 1,
	"last_log_date" date,
	"missed_days" integer DEFAULT 0,
	"analysis_date" date,
	"analysis_notes" text,
	"cancellation_date" date,
	"cancellation_reason" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tier" varchar(20) DEFAULT 'free' NOT NULL,
	"stripe_customer_id" varchar(255),
	"stripe_subscription_id" varchar(255),
	"stripe_price_id" varchar(255),
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"cancel_at_period_end" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "supplements_database" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"category" varchar(50) NOT NULL,
	"description" text,
	"common_dosage" varchar(100)
);
--> statement-breakpoint
CREATE TABLE "symptoms_database" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"category" varchar(50) NOT NULL,
	"description" text,
	"is_common" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "timeline_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"source_message_id" uuid,
	"entry_type" varchar(20) NOT NULL,
	"name" varchar(255) NOT NULL,
	"severity" integer,
	"structured_content" jsonb,
	"entry_date" date NOT NULL,
	"entry_time" time,
	"timezone" varchar(50),
	"exercise_type" varchar(50),
	"duration_minutes" integer,
	"intensity_level" varchar(20),
	"energy_level" integer,
	"food_id" uuid,
	"portion" varchar(100),
	"meal_type" varchar(20),
	"is_sample" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_food_reactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"food_id" uuid,
	"food_name" varchar(255) NOT NULL,
	"status" varchar(20) NOT NULL,
	"reintroduction_id" uuid,
	"confirmed_date" date NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text,
	"is_read" boolean DEFAULT false,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_protocol_state" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"protocol_id" uuid NOT NULL,
	"current_phase_id" uuid,
	"phase_start_date" date NOT NULL,
	"expected_end_date" date,
	"started_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_food_properties" ADD CONSTRAINT "custom_food_properties_custom_food_id_custom_foods_id_fk" FOREIGN KEY ("custom_food_id") REFERENCES "public"."custom_foods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_foods" ADD CONSTRAINT "custom_foods_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "day_composites" ADD CONSTRAINT "day_composites_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "day_composites" ADD CONSTRAINT "day_composites_protocol_id_protocols_id_fk" FOREIGN KEY ("protocol_id") REFERENCES "public"."protocols"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_subcategories" ADD CONSTRAINT "food_subcategories_category_id_food_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."food_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "food_trigger_properties" ADD CONSTRAINT "food_trigger_properties_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "foods" ADD CONSTRAINT "foods_subcategory_id_food_subcategories_id_fk" FOREIGN KEY ("subcategory_id") REFERENCES "public"."food_subcategories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insight_alerts" ADD CONSTRAINT "insight_alerts_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "insight_snapshots" ADD CONSTRAINT "insight_snapshots_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_current_protocol_id_protocols_id_fk" FOREIGN KEY ("current_protocol_id") REFERENCES "public"."protocols"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "protocol_food_overrides" ADD CONSTRAINT "protocol_food_overrides_protocol_id_protocols_id_fk" FOREIGN KEY ("protocol_id") REFERENCES "public"."protocols"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "protocol_food_overrides" ADD CONSTRAINT "protocol_food_overrides_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "protocol_phases" ADD CONSTRAINT "protocol_phases_protocol_id_protocols_id_fk" FOREIGN KEY ("protocol_id") REFERENCES "public"."protocols"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "protocol_rules" ADD CONSTRAINT "protocol_rules_protocol_id_protocols_id_fk" FOREIGN KEY ("protocol_id") REFERENCES "public"."protocols"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "protocol_rules" ADD CONSTRAINT "protocol_rules_phase_id_protocol_phases_id_fk" FOREIGN KEY ("phase_id") REFERENCES "public"."protocol_phases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reintroduction_entries" ADD CONSTRAINT "reintroduction_entries_reintroduction_id_reintroduction_log_id_fk" FOREIGN KEY ("reintroduction_id") REFERENCES "public"."reintroduction_log"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reintroduction_entries" ADD CONSTRAINT "reintroduction_entries_timeline_entry_id_timeline_entries_id_fk" FOREIGN KEY ("timeline_entry_id") REFERENCES "public"."timeline_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reintroduction_log" ADD CONSTRAINT "reintroduction_log_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reintroduction_log" ADD CONSTRAINT "reintroduction_log_protocol_id_protocols_id_fk" FOREIGN KEY ("protocol_id") REFERENCES "public"."protocols"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reintroduction_log" ADD CONSTRAINT "reintroduction_log_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timeline_entries" ADD CONSTRAINT "timeline_entries_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timeline_entries" ADD CONSTRAINT "timeline_entries_source_message_id_messages_id_fk" FOREIGN KEY ("source_message_id") REFERENCES "public"."messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timeline_entries" ADD CONSTRAINT "timeline_entries_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_food_reactions" ADD CONSTRAINT "user_food_reactions_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_food_reactions" ADD CONSTRAINT "user_food_reactions_food_id_foods_id_fk" FOREIGN KEY ("food_id") REFERENCES "public"."foods"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_food_reactions" ADD CONSTRAINT "user_food_reactions_reintroduction_id_reintroduction_log_id_fk" FOREIGN KEY ("reintroduction_id") REFERENCES "public"."reintroduction_log"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_notifications" ADD CONSTRAINT "user_notifications_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_protocol_state" ADD CONSTRAINT "user_protocol_state_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_protocol_state" ADD CONSTRAINT "user_protocol_state_protocol_id_protocols_id_fk" FOREIGN KEY ("protocol_id") REFERENCES "public"."protocols"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_protocol_state" ADD CONSTRAINT "user_protocol_state_current_phase_id_protocol_phases_id_fk" FOREIGN KEY ("current_phase_id") REFERENCES "public"."protocol_phases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_log_user_id_idx" ON "audit_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_log_action_idx" ON "audit_log" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_log_created_at_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "conversations_user_id_updated_at_idx" ON "conversations" USING btree ("user_id","updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "custom_food_properties_custom_food_id_unique" ON "custom_food_properties" USING btree ("custom_food_id");--> statement-breakpoint
CREATE INDEX "custom_foods_user_id_idx" ON "custom_foods" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "day_composites_user_date_idx" ON "day_composites" USING btree ("user_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "food_trigger_food_id_idx" ON "food_trigger_properties" USING btree ("food_id");--> statement-breakpoint
CREATE UNIQUE INDEX "journal_user_date_idx" ON "journal_entries" USING btree ("user_id","entry_date");--> statement-breakpoint
CREATE INDEX "messages_conversation_id_created_at_idx" ON "messages" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "protocol_food_override_idx" ON "protocol_food_overrides" USING btree ("protocol_id","food_id");--> statement-breakpoint
CREATE INDEX "protocol_rules_protocol_id_idx" ON "protocol_rules" USING btree ("protocol_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reintroduction_entries_timeline_entry_id_unique" ON "reintroduction_entries" USING btree ("timeline_entry_id");--> statement-breakpoint
CREATE INDEX "reintroduction_log_user_id_status_idx" ON "reintroduction_log" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "reintroduction_log_food_id_user_id_idx" ON "reintroduction_log" USING btree ("food_id","user_id");--> statement-breakpoint
CREATE INDEX "reintroduction_log_user_id_start_date_idx" ON "reintroduction_log" USING btree ("user_id","start_date");--> statement-breakpoint
CREATE UNIQUE INDEX "subscriptions_user_id_idx" ON "subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subscriptions_stripe_customer_id_idx" ON "subscriptions" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX "subscriptions_stripe_subscription_id_idx" ON "subscriptions" USING btree ("stripe_subscription_id");--> statement-breakpoint
CREATE INDEX "timeline_entries_user_id_entry_date_idx" ON "timeline_entries" USING btree ("user_id","entry_date");--> statement-breakpoint
CREATE INDEX "timeline_entries_user_id_entry_type_idx" ON "timeline_entries" USING btree ("user_id","entry_type");--> statement-breakpoint
CREATE INDEX "timeline_entries_food_id_idx" ON "timeline_entries" USING btree ("food_id");--> statement-breakpoint
CREATE INDEX "user_food_reactions_user_id_idx" ON "user_food_reactions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_food_reactions_user_food_idx" ON "user_food_reactions" USING btree ("user_id","food_name");--> statement-breakpoint
CREATE INDEX "user_notifications_user_id_read_idx" ON "user_notifications" USING btree ("user_id","is_read");--> statement-breakpoint
CREATE UNIQUE INDEX "user_protocol_state_idx" ON "user_protocol_state" USING btree ("user_id","protocol_id");