// src/app/api/resend-otp/route.ts
import { db } from "@/db/db";
import { users, otpVerifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { corsHeaders } from "@/lib/cors";
import { generateOtp, getOtpExpiry, sendOtpSms } from "@/lib/otp";

export const dynamic = "force-dynamic";

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");

  let body: { userId?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400, headers: corsHeaders(origin) }
    );
  }

  const { userId } = body;
  if (!userId) {
    return NextResponse.json(
      { error: "userId is required" },
      { status: 400, headers: corsHeaders(origin) }
    );
  }

  const usersList = await db.select().from(users).where(eq(users.id, userId));
  const user = usersList[0];

  if (!user || !user.mobile) {
    return NextResponse.json(
      { error: "User not found or no phone on file" },
      { status: 404, headers: corsHeaders(origin) }
    );
  }

  // ---- TEST OTP TOGGLE (login route jaisa hi) ----
  const isTestMode = process.env.USE_TEST_OTP === "true";
  const otp = isTestMode ? "123456" : generateOtp();
  const expiresAt = getOtpExpiry(5);

  console.log("Resend OTP attempt:", { userId: user.id, otp, expiresAt, testMode: isTestMode });

  try {
    const existing = await db
      .select({ id: otpVerifications.id })
      .from(otpVerifications)
      .where(eq(otpVerifications.userId, user.id))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(otpVerifications)
        .set({
          otp,
          attempts: 0,
          verified: false,
          expiresAt,
        })
        .where(eq(otpVerifications.id, existing[0].id));

      console.log("Existing OTP row updated on resend, id:", existing[0].id);
    } else {
      const result = await db
        .insert(otpVerifications)
        .values({
          userId: user.id,
          otp,
          attempts: 0,
          verified: false,
          expiresAt,
        })
        .$returningId();

      console.log("New OTP row inserted on resend:", result);

      if (!result || result.length === 0) {
        console.error("Resend insert returned no id — silent failure suspected");
        return NextResponse.json(
          { error: "Failed to create OTP. Please try again." },
          { status: 500, headers: corsHeaders(origin) }
        );
      }
    }
  } catch (err) {
    console.error("Resend OTP upsert failed:", err);
    return NextResponse.json(
      { error: "Failed to create OTP. Please try again." },
      { status: 500, headers: corsHeaders(origin) }
    );
  }

  if (!isTestMode) {
    const smsResult = await sendOtpSms(user.mobile, otp);
    if (!smsResult?.success) {
      console.error("Failed to resend OTP SMS:", smsResult?.error);
    }
  } else {
    console.log("Test mode active — SMS skipped, OTP is 123456");
  }

  return NextResponse.json(
    { message: "OTP resent successfully" },
    { headers: corsHeaders(origin) }
  );
}
