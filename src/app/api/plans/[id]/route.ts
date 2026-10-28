//src/app/api/plans/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { plans } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

type RouteParams = { params: { id: string } };

// GET /api/plans/:id -> fetch a single plan
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const id = Number(params.id);
    if (Number.isNaN(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid plan id" },
        { status: 400 }
      );
    }
    const [plan] = await db.select().from(plans).where(eq(plans.id, id));
    if (!plan) {
      return NextResponse.json(
        { success: false, message: "Plan not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      plan: { ...plan, _id: plan.id.toString() },
    });
  } catch (error) {
    console.error("Failed to fetch plan:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch plan" },
      { status: 500 }
    );
  }
}

// PUT /api/plans/:id -> update a plan
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const id = Number(params.id);
    if (Number.isNaN(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid plan id" },
        { status: 400 }
      );
    }
    const body = await req.json();
    const { name, price, duration, features, listingLimit } = body;

    if (!name || !price || !duration) {
      return NextResponse.json(
        { success: false, message: "name, price and duration are required" },
        { status: 400 }
      );
    }

    // listingLimit: empty string / undefined / null => unlimited (NULL in DB)
    const parsedListingLimit =
      listingLimit === "" || listingLimit === undefined || listingLimit === null
        ? null
        : Number(listingLimit);

    await db
      .update(plans)
      .set({
        name,
        price,
        duration,
        listingLimit: parsedListingLimit,
        features: Array.isArray(features) ? features : [],
      })
      .where(eq(plans.id, id));

    const [updated] = await db.select().from(plans).where(eq(plans.id, id));
    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Plan not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: true,
      plan: { ...updated, _id: updated.id.toString() },
    });
  } catch (error) {
    console.error("Failed to update plan:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update plan" },
      { status: 500 }
    );
  }
}

// DELETE /api/plans/:id -> delete a plan
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const id = Number(params.id);
    if (Number.isNaN(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid plan id" },
        { status: 400 }
      );
    }
    await db.delete(plans).where(eq(plans.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete plan:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete plan" },
      { status: 500 }
    );
  }
}