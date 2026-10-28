import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { countries } from "@/db/schema";
import { corsHeaders } from "@/lib/cors";

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

export async function GET(req: NextRequest) {
  const origin = req.headers.get("origin");
  try {
    const result = await db.select().from(countries);
    return NextResponse.json(result, { headers: corsHeaders(origin) });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch countries" },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}