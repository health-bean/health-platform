import { createClient } from "@supabase/supabase-js";

/**
 * Admin Supabase client using the service_role key.
 * Use ONLY in server-side code for admin operations (creating users, etc.).
 * Never expose this to the client.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
