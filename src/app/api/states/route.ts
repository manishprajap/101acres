// app/api/states/route.ts
import { NextRequest,NextResponse } from 'next/server';
import { db } from "@/db/db";
import { states } from "@/db/schema";
import { eq } from "drizzle-orm";
import { corsHeaders } from "@/lib/cors";

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}
export async function GET(req: NextRequest) {
  const origin = req.headers.get("origin");
  const countryId = parseInt(req.nextUrl.searchParams.get("countryId") || "0");

  try {
    const result = await db.select().from(states).where(eq(states.countryId, countryId));
    return NextResponse.json(result, { headers: corsHeaders(origin) });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch states" },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}
