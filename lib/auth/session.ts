import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export interface SessionData {
  userId: string;
  email: string;
  firstName: string;
  isAdmin: boolean;
}

/**
 * Get the current authenticated user from Supabase Auth + profiles table.
 * Drop-in replacement for the old iron-session getSessionFromCookies().
 * Returns a SessionData-like object (empty userId if not authenticated).
 */
export async function getSessionFromCookies(): Promise<SessionData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { userId: "", email: "", firstName: "", isAdmin: false };
  }

  // Fetch profile for app-specific data
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  return {
    userId: user.id,
    email: user.email ?? "",
    firstName: profile?.firstName ?? user.user_metadata?.firstName ?? "",
    isAdmin: profile?.isAdmin ?? false,
  };
}
