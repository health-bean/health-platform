import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSessionFromCookies } from "@/lib/auth/session";
import { log } from "@/lib/logger";

// GET /api/onboarding - Get onboarding status
export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session.userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const [user] = await db
      .select({
        onboardingCompleted: profiles.onboardingCompleted,
        currentProtocolId: profiles.currentProtocolId,
      })
      .from(profiles)
      .where(eq(profiles.id, session.userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      completed: user.onboardingCompleted || false,
      hasProtocol: !!user.currentProtocolId,
    });
  } catch (error) {
    log.error("GET /api/onboarding error", { error: error as Error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/onboarding - Complete onboarding
export async function POST(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session.userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { protocolId } = body;

    // Update user onboarding status
    await db
      .update(profiles)
      .set({
        onboardingCompleted: true,
        ...(protocolId && { currentProtocolId: protocolId }),
      })
      .where(eq(profiles.id, session.userId));

    return NextResponse.json({
      success: true,
      message: "Onboarding completed",
    });
  } catch (error) {
    log.error("POST /api/onboarding error", { error: error as Error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
