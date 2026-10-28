import { db } from "@/db/db";
import { properties } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { corsHeaders } from "@/lib/cors";

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Missing userId parameter" },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    const props = await db
      .select()
      .from(properties)
      .where(
        and(
          eq(properties.user_id, parseInt(userId)),
          eq(properties.premium, false)
        )
      );

    return NextResponse.json(
      { success: true, data: props },
      { headers: corsHeaders(origin) }
    );
  } catch (error) {
    console.error("Drizzle select error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch user properties" },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}