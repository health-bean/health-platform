import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSessionFromCookies } from "@/lib/auth/session";

export async function GET() {
  try {
    const session = await getSessionFromCookies();
    if (!session.userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const [profile] = await db
      .select({
        id: profiles.id,
        email: profiles.email,
        firstName: profiles.firstName,
        isAdmin: profiles.isAdmin,
        currentProtocolId: profiles.currentProtocolId,
        onboardingCompleted: profiles.onboardingCompleted,
        healthGoals: profiles.healthGoals,
      })
      .from(profiles)
      .where(eq(profiles.id, session.userId))
      .limit(1);

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: profile });
  } catch (error) {
    console.error("GET /api/users/me error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSessionFromCookies();
    if (!session.userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { firstName, currentProtocolId, healthGoals } = body;

    await db
      .update(profiles)
      .set({
        ...(firstName !== undefined && { firstName }),
        ...(currentProtocolId !== undefined && { currentProtocolId }),
        ...(healthGoals !== undefined && { healthGoals }),
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, session.userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/users/me error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
