import { NextResponse } from "next/server";

export async function POST() {
  // Signup disabled — accounts are created via admin/Supabase dashboard
  return NextResponse.json(
    { error: "Signup is currently disabled. Please contact the administrator." },
    { status: 403 }
  );
}
