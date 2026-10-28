// /app/api/properties/list/route.ts
import { db } from "@/db/db";
import { properties } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const allProperties = await db
      .select()
      .from(properties)
      .where(
        and(
          eq(properties.isDeleted, false),
          eq(properties.isBankProperty, "no")
        )
      )
      .orderBy(desc(properties.id)); // ✅ fixed - plain properties.id, no brackets

    return NextResponse.json({ success: true, data: allProperties });
  } catch (error) {
    console.error("Error fetching properties:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch properties" },
      { status: 500 }
    );
  }
}