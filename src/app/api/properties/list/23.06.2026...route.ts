import { db } from "@/db/db";
import { properties } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { corsHeaders } from "@/lib/cors";

// Preflight request
export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");

  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

export async function GET(req: NextRequest) {
  try {
    const origin = req.headers.get("origin");

    const allProperties = await db
      .select()
      .from(properties)
      .where(
        and(
          eq(properties.isDeleted, false),
          eq(properties.isBankProperty, "no")
        )
      )
      .orderBy(desc(properties.id));

    return NextResponse.json(
      {
        success: true,
        data: allProperties,
      },
      {
        headers: corsHeaders(origin),
      }
    );
  } catch (error) {
    console.error("Error fetching properties:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch properties",
      },
      {
        status: 500,
        headers: corsHeaders("*"),
      }
    );
  }
}