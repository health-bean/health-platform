import { NextResponse } from "next/server";
import { eq, asc, and, gte, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  timelineEntries,
  journalEntries,
  foods,
  customFoods,
} from "@/lib/db/schema";
import { getSessionFromCookies } from "@/lib/auth/session";
import { log } from "@/lib/logger";

/**
 * GET /api/export?format=csv&type=timeline&from=2026-01-01&to=2026-03-18
 *
 * Export user health data as CSV.
 * Types: "timeline" (default), "journal", "all"
 */
export async function GET(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") ?? "all";
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const parts: string[] = [];

    // ── Timeline entries ────────────────────────────────────────────
    if (type === "timeline" || type === "all") {
      const conditions = [eq(timelineEntries.userId, session.userId)];
      if (from) conditions.push(gte(timelineEntries.entryDate, from));
      if (to) conditions.push(lte(timelineEntries.entryDate, to));

      const entries = await db
        .select({
          entryDate: timelineEntries.entryDate,
          entryTime: timelineEntries.entryTime,
          entryType: timelineEntries.entryType,
          name: timelineEntries.name,
          severity: timelineEntries.severity,
          portion: timelineEntries.portion,
          mealType: timelineEntries.mealType,
          exerciseType: timelineEntries.exerciseType,
          durationMinutes: timelineEntries.durationMinutes,
          intensityLevel: timelineEntries.intensityLevel,
          energyLevel: timelineEntries.energyLevel,
          foodDisplayName: foods.displayName,
          customFoodName: customFoods.displayName,
          createdAt: timelineEntries.createdAt,
        })
        .from(timelineEntries)
        .leftJoin(foods, eq(timelineEntries.foodId, foods.id))
        .leftJoin(
          customFoods,
          and(
            eq(customFoods.userId, session.userId),
            eq(customFoods.displayName, timelineEntries.name)
          )
        )
        .where(and(...conditions))
        .orderBy(asc(timelineEntries.entryDate), asc(timelineEntries.entryTime));

      const header =
        "date,time,type,name,severity,portion,meal_type,exercise_type,duration_min,intensity,energy_level";
      const rows = entries.map((e) =>
        [
          e.entryDate,
          e.entryTime ?? "",
          e.entryType,
          csvEscape(e.name),
          e.severity ?? "",
          csvEscape(e.portion ?? ""),
          e.mealType ?? "",
          e.exerciseType ?? "",
          e.durationMinutes ?? "",
          e.intensityLevel ?? "",
          e.energyLevel ?? "",
        ].join(",")
      );

      parts.push("# Timeline Entries");
      parts.push(header);
      parts.push(...rows);
    }

    // ── Journal entries ─────────────────────────────────────────────
    if (type === "journal" || type === "all") {
      const conditions = [eq(journalEntries.userId, session.userId)];
      if (from) conditions.push(gte(journalEntries.entryDate, from));
      if (to) conditions.push(lte(journalEntries.entryDate, to));

      const journals = await db
        .select({
          entryDate: journalEntries.entryDate,
          sleepScore: journalEntries.sleepScore,
          energyScore: journalEntries.energyScore,
          moodScore: journalEntries.moodScore,
          stressScore: journalEntries.stressScore,
          painScore: journalEntries.painScore,
          notes: journalEntries.notes,
        })
        .from(journalEntries)
        .where(and(...conditions))
        .orderBy(asc(journalEntries.entryDate));

      const header =
        "date,sleep_score,energy_score,mood_score,stress_score,pain_score,notes";
      const rows = journals.map((j) =>
        [
          j.entryDate,
          j.sleepScore ?? "",
          j.energyScore ?? "",
          j.moodScore ?? "",
          j.stressScore ?? "",
          j.painScore ?? "",
          csvEscape(j.notes ?? ""),
        ].join(",")
      );

      if (parts.length > 0) parts.push("");
      parts.push("# Journal Entries");
      parts.push(header);
      parts.push(...rows);
    }

    const csv = parts.join("\n");
    const filename = `pico-health-export-${type}-${new Date().toISOString().split("T")[0]}.csv`;

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    log.error("GET /api/export error", { error: error as Error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/** Escape a value for CSV (wrap in quotes if it contains comma, newline, or quote) */
function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
