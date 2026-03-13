import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { cache } from "react";

export interface SessionData {
  userId: string;
  email: string;
  firstName: string;
  isAdmin: boolean;
}

const emptySession: SessionData = {
  userId: "",
  email: "",
  firstName: "",
  isAdmin: false,
};

/**
 * Get the current authenticated user.
 *
 * Uses getSession() which reads + verifies the JWT from cookies locally
 * (no network round-trip to Supabase). The middleware already calls
 * getUser() on every request to refresh the session, so by the time
 * API routes run, the token is fresh and verified.
 *
 * React cache() deduplicates within a single request.
 */
export const getSessionFromCookies = cache(
  async (): Promise<SessionData> => {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) return emptySession;

    const [profile] = await db
      .select({
        firstName: profiles.firstName,
        isAdmin: profiles.isAdmin,
      })
      .from(profiles)
      .where(eq(profiles.id, session.user.id))
      .limit(1);

    return {
      userId: session.user.id,
      email: session.user.email ?? "",
      firstName: profile?.firstName ?? session.user.user_metadata?.firstName ?? "",
      isAdmin: profile?.isAdmin ?? false,
    };
  }
);
