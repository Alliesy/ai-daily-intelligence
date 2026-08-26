import { NextResponse } from "next/server";
import { getAnonymousVisitorStats } from "@/lib/analytics/server";

export async function GET() {
  return NextResponse.json(await getAnonymousVisitorStats(), {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}
