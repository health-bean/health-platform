import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { rateLimit, getClientIp, SIGNUP_RATE_LIMIT } from "@/lib/rate-limit";
import { log } from "@/lib/logger";

const signupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rl = await rateLimit(`signup:${ip}`, SIGNUP_RATE_LIMIT);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many signup attempts. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
        }
      );
    }

    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { firstName, email, password } = parsed.data;

    // Create auth user via admin client (server-side)
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: { firstName },
    });

    if (error) {
      if (error.message?.includes("already been registered")) {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 409 }
        );
      }
      log.error("signup error", { error: error as Error });
      return NextResponse.json(
        { error: "Failed to create account" },
        { status: 500 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { error: "Failed to create account" },
        { status: 500 }
      );
    }

    // Create profile
    await db.insert(profiles).values({
      id: data.user.id,
      email: email.toLowerCase(),
      firstName,
    });

    // Sign in the user so they have a session
    const supabase = await createClient();
    await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password,
    });

    return NextResponse.json(
      {
        user: {
          id: data.user.id,
          email: email.toLowerCase(),
          firstName,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    log.error("Signup error", { error: error as Error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
