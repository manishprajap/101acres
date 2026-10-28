// /app/api/properties/premium/route.ts

import { db } from "@/db/db";
import { properties } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const premiumProperties = await db
      .select()
      .from(properties)
      .where(
        and(
          eq(properties.premium, true),
          eq(properties.isDeleted, false),
          eq(properties.isBankProperty, "Yes") // ✅ only properties where is_bank_property = 'no'
        )
      );

    return NextResponse.json({ success: true, data: premiumProperties });
  } catch (error) {
    console.error("Error fetching premium properties:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch premium properties" },
      { status: 500 }
    );
  }
}
