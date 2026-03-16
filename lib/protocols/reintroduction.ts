import { db } from "@/lib/db";
import { reintroductionLog } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * Start a new reintroduction trial for a food.
 */
export async function startReintroductionTrial(
  userId: string,
  protocolId: string,
  foodName: string,
  foodId?: string
) {
  const today = new Date().toISOString().split("T")[0];

  const [trial] = await db
    .insert(reintroductionLog)
    .values({
      userId,
      protocolId,
      foodId: foodId ?? null,
      foodName,
      startDate: today,
      status: "active",
    })
    .returning();

  return trial;
}

/**
 * Complete a reintroduction trial with an outcome.
 */
export async function completeReintroductionTrial(
  logId: string,
  userId: string,
  status: "passed" | "failed" | "inconclusive",
  outcome?: string,
  symptomsSummary?: Record<string, unknown>
) {
  const today = new Date().toISOString().split("T")[0];

  const [updated] = await db
    .update(reintroductionLog)
    .set({
      status,
      outcome: outcome ?? null,
      symptomsSummary: symptomsSummary ?? null,
      endDate: today,
    })
    .where(
      and(eq(reintroductionLog.id, logId), eq(reintroductionLog.userId, userId))
    )
    .returning();

  return updated;
}

/**
 * Get all active reintroduction trials for a user.
 */
export async function getActiveTrials(userId: string) {
  return db
    .select()
    .from(reintroductionLog)
    .where(
      and(
        eq(reintroductionLog.userId, userId),
        eq(reintroductionLog.status, "active")
      )
    )
    .orderBy(desc(reintroductionLog.createdAt));
}

/**
 * Get reintroduction trial history for a user+protocol.
 */
export async function getTrialHistory(userId: string, protocolId: string) {
  return db
    .select()
    .from(reintroductionLog)
    .where(
      and(
        eq(reintroductionLog.userId, userId),
        eq(reintroductionLog.protocolId, protocolId)
      )
    )
    .orderBy(desc(reintroductionLog.createdAt));
}
