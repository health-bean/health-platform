import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth/session";
import {
  startReintroductionTrial,
  completeReintroductionTrial,
  getActiveTrials,
  getTrialHistory,
} from "@/lib/protocols/reintroduction";

// ── GET /api/protocols/reintroduction?protocolId=uuid ────────────────

export async function GET(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const protocolId = searchParams.get("protocolId");

    if (protocolId) {
      const trials = await getTrialHistory(session.userId, protocolId);
      return NextResponse.json({ trials });
    }

    // Default: return active trials across all protocols
    const trials = await getActiveTrials(session.userId);
    return NextResponse.json({ trials });
  } catch (error) {
    console.error("GET /api/protocols/reintroduction error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ── POST /api/protocols/reintroduction ───────────────────────────────
// Start a new reintroduction trial

export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { protocolId, foodName, foodId } = (await request.json()) as {
      protocolId: string;
      foodName: string;
      foodId?: string;
    };

    if (!protocolId || !foodName) {
      return NextResponse.json(
        { error: "protocolId and foodName are required" },
        { status: 400 }
      );
    }

    const trial = await startReintroductionTrial(
      session.userId,
      protocolId,
      foodName,
      foodId
    );

    return NextResponse.json({ trial }, { status: 201 });
  } catch (error) {
    console.error("POST /api/protocols/reintroduction error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ── PATCH /api/protocols/reintroduction ──────────────────────────────
// Complete a reintroduction trial

export async function PATCH(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { trialId, status, outcome, symptomsSummary } =
      (await request.json()) as {
        trialId: string;
        status: "passed" | "failed" | "inconclusive";
        outcome?: string;
        symptomsSummary?: Record<string, unknown>;
      };

    if (!trialId || !status) {
      return NextResponse.json(
        { error: "trialId and status are required" },
        { status: 400 }
      );
    }

    const trial = await completeReintroductionTrial(
      trialId,
      session.userId,
      status,
      outcome,
      symptomsSummary
    );

    if (!trial) {
      return NextResponse.json(
        { error: "Trial not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ trial });
  } catch (error) {
    console.error("PATCH /api/protocols/reintroduction error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
