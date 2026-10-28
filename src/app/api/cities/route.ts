// app/api/cities/route.ts 
import { NextRequest,NextResponse } from 'next/server';
import { db } from "@/db/db";
import { cities } from "@/db/schema";
import { eq } from "drizzle-orm";
import { corsHeaders } from "@/lib/cors";

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

export async function GET(req: NextRequest) {
  const origin = req.headers.get("origin");
  const cityIdValue = req.nextUrl.searchParams.get("id");
  const cityId = cityIdValue ? Number(cityIdValue) : null;
  const stateId = Number(req.nextUrl.searchParams.get("stateId"));
  
  try {
    if (cityIdValue !== null) {
      if (!Number.isSafeInteger(cityId) || cityId! <= 0) {
        return NextResponse.json(
          { error: "A valid city id is required" },
          { status: 400, headers: corsHeaders(origin) }
        );
      }
      const result = await db.select().from(cities).where(eq(cities.id, cityId!));
      return NextResponse.json(result, { headers: corsHeaders(origin) });
    }

    if (!Number.isSafeInteger(stateId) || stateId <= 0) {
      return NextResponse.json(
        { error: "A valid stateId is required" },
        { status: 400, headers: corsHeaders(origin) }
      );
    }
    const result = await db.select().from(cities).where(eq(cities.stateId, stateId));
    return NextResponse.json(result, { headers: corsHeaders(origin) });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch cities" },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}