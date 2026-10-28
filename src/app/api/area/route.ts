import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/db/db";
import { area } from "@/db/schema";
import { eq } from "drizzle-orm";
import { corsHeaders } from "@/lib/cors";

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}
export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  const { searchParams } = new URL(request.url);
  const areaId = searchParams.get("id");
  const cityId = searchParams.get('cityId');

  if (areaId !== null) {
    const id = Number(areaId);
    if (!Number.isSafeInteger(id) || id <= 0) {
      return NextResponse.json(
        { error: 'A valid area id is required' },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    try {
      const result = await db.select().from(area).where(eq(area.id, id));
      return NextResponse.json(result, { headers: corsHeaders(origin) });
    } catch (error) {
      console.error("Error in /api/area route:", error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500, headers: corsHeaders(origin) }
      );
    }
  }

  if (!cityId) {
    return NextResponse.json(
      { error: 'Missing cityId parameter' },
      { status: 400, headers: corsHeaders(origin) }
    );
  }

  try {
    const areaResults = await db
      .select()
      .from(area)
      .where(eq(area.city_id, Number(cityId)))
      .execute();
    return NextResponse.json(areaResults, { headers: corsHeaders(origin) });
  } catch (error) {
    console.error("Error in /api/area route:", error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}
