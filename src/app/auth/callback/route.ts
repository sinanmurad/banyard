import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/supabase";

// Email confirmation link lands here: exchange the code for a session.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (code) {
    const supabase = await db();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, request.nextUrl.origin)
      );
    }
  }
  return NextResponse.redirect(new URL("/", request.nextUrl.origin));
}
