import { db } from "@/db/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const agents = await db
      .select()
      .from(users)
      .where(eq(users.role, "agent")); // or whatever field denotes "agent"

    return NextResponse.json({ success: true, data: agents });
  } catch (error) {
    console.error("Error fetching agents:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch agents" }, { status: 500 });
  }
}