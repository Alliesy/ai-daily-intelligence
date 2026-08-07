import { NextResponse, type NextRequest } from "next/server";
import { safeReturnPath } from "@/lib/auth/return-path";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = safeReturnPath(request.nextUrl.searchParams.get("next"));
  if (!code) return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(next)}&error=missing_code`, request.url));
  try {
    const { error } = await (await createSupabaseServerClient()).auth.exchangeCodeForSession(code);
    if (error) throw error;
    return NextResponse.redirect(new URL(next, request.url));
  } catch {
    return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(next)}&error=oauth_callback`, request.url));
  }
}
