// src/app/api/admin/approve-plan/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { userPlans } from "@/db/schema";
import { eq } from "drizzle-orm";

// POST /api/admin/approve-plan
// body: { "userPlanId": 1 }
// Marks a pending (inactive) user_plans row as active, after admin
// has manually verified the payment screenshot shared on WhatsApp.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userPlanId } = body;

    if (!userPlanId) {
      return NextResponse.json(
        { success: false, message: "userPlanId is required" },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select()
      .from(userPlans)
      .where(eq(userPlans.id, Number(userPlanId)));

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "user_plans row not found" },
        { status: 404 }
      );
    }

    await db
      .update(userPlans)
      .set({ status: "active" })
      .where(eq(userPlans.id, Number(userPlanId)));

    return NextResponse.json({
      success: true,
      message: "Plan approved and activated",
    });
  } catch (error) {
    console.error("Failed to approve plan:", error);
    return NextResponse.json(
      { success: false, message: "Failed to approve plan" },
      { status: 500 }
    );
  }
}

// GET /api/admin/approve-plan
// Lists all pending (inactive) plans so the admin can review and approve them.
export async function GET() {
  try {
    const pending = await db
      .select()
      .from(userPlans)
      .where(eq(userPlans.status, "inactive"));

    return NextResponse.json({ success: true, pending });
  } catch (error) {
    console.error("Failed to fetch pending plans:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch pending plans" },
      { status: 500 }
    );
  }
}