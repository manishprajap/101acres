import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/db";
import { properties } from "@/db/schema";

export async function PATCH(
  req: NextRequest,
  context: any
) {
  const id = parseInt(context.params.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }
    console.log("id",id)
  try {
    const body = await req.json();
    const { premium, paymentType, amount, remark } = body;

    if (!paymentType || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const result = await db
      .update(properties)
      .set({
        premium: premium ?? true,
        paymentType,
        amount: Number(amount),
        remark: remark || "",
        paymentstatus: "Paid",
      })
      .where(eq(properties.id, id));

    return NextResponse.json({ success: true, message: "Property updated to premium", result });
  } catch (error) {
    console.error("PATCH /api/property/:id/premium error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
