// src/app/api/plans/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { plans } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

// Don't let Next.js cache this at build time
export const dynamic = "force-dynamic";

const ALLOWED_ORIGINS = [
  "http://localhost:8100",
  "http://localhost:5173",
  "capacitor://localhost",
  "https://localhost",
  "http://localhost",
];

function corsHeaders(req: NextRequest) {
  const origin = req.headers.get("origin") ?? "";
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
    "Vary": "Origin",
  };
}

// Preflight
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}

// GET /api/plans -> list all plans
export async function GET(req: NextRequest) {
  try {
    const allPlans = await db
      .select()
      .from(plans)
      .orderBy(desc(plans.createdAt));

    const formatted = allPlans.map((plan) => ({
      ...plan,
      _id: plan.id.toString(),
    }));

    return NextResponse.json(
      { success: true, plans: formatted },
      { headers: corsHeaders(req) }
    );
  } catch (error) {
    console.error("Failed to fetch plans:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch plans" },
      { status: 500, headers: corsHeaders(req) }
    );
  }
}

// POST /api/plans -> create a new plan
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, price, duration, features, listingLimit } = body;

    if (!name || !price || !duration) {
      return NextResponse.json(
        { success: false, message: "name, price and duration are required" },
        { status: 400, headers: corsHeaders(req) }
      );
    }

    const parsedListingLimit =
      listingLimit === "" || listingLimit === undefined || listingLimit === null
        ? null
        : Number(listingLimit);

    const [result] = await db.insert(plans).values({
      name,
      price,
      duration,
      listingLimit: parsedListingLimit,
      features: Array.isArray(features) ? features : [],
    });

    const insertId = (result as { insertId: number }).insertId;
    const [newPlan] = await db.select().from(plans).where(eq(plans.id, insertId));

    return NextResponse.json(
      { success: true, plan: { ...newPlan, _id: newPlan.id.toString() } },
      { headers: corsHeaders(req) }
    );
  } catch (error) {
    console.error("Failed to add plan:", error);
    return NextResponse.json(
      { success: false, message: "Failed to add plan" },
      { status: 500, headers: corsHeaders(req) }
    );
  }
}