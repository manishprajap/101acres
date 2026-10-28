
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import {userPlans, plans } from "@/db/schema";
import { desc, eq  } from "drizzle-orm";


export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 });
  }

  const plan = await db
    .select()
    .from(userPlans)
    .where(eq(userPlans.user_id, Number(userId)))
    .limit(1);

  return NextResponse.json(plan[0] || null);
}