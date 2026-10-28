// src/app/api/admin/users-with-plans/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { users, userPlans, plans } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const allUsers = await db.select().from(users).orderBy(desc(users.id));
    const allUserPlans = await db.select().from(userPlans);
    const allPlanDefs = await db.select().from(plans);

    const planDefMap = new Map(allPlanDefs.map((p) => [p.id, p]));

    // Pick the most recent (highest id) user_plans row per user
    const latestPlanByUser = new Map<number, (typeof allUserPlans)[number]>();
    for (const up of allUserPlans) {
      const existing = latestPlanByUser.get(up.user_id);
      if (!existing || up.id > existing.id) {
        latestPlanByUser.set(up.user_id, up);
      }
    }

    const enriched = allUsers.map((u) => {
      const up = latestPlanByUser.get(u.id);
      const planDef = up ? planDefMap.get(up.plan_id) : undefined;

      return {
        ...u,
        planRowId: up?.id ?? null,
        planStatus: up?.status ?? null,
        planExpiry: up?.expiry_date ?? null,
        planName: planDef?.name ?? null,
      };
    });

    return NextResponse.json({ success: true, data: enriched });
  } catch (error) {
    console.error("Failed to fetch users with plans:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch users" },
      { status: 500 }
    );
  }
}