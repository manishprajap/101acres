// src/app/api/login/route.ts
import { db } from "@/db/db";
import { users, otpVerifications } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { corsHeaders } from "@/lib/cors";
import bcrypt from "bcryptjs";
import { generateOtp, getOtpExpiry, sendOtpSms } from "@/lib/otp";

export const dynamic = "force-dynamic";

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");

  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400, headers: corsHeaders(origin) }
    );
  }

  const { email, password } = body;
  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400, headers: corsHeaders(origin) }
    );
  }

  const usersList = await db.select().from(users).where(eq(users.email, email));
  const user = usersList[0];

  if (!user) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401, headers: corsHeaders(origin) }
    );
  }

  const passwordValid = await bcrypt.compare(password, user.password);
  if (!passwordValid) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401, headers: corsHeaders(origin) }
    );
  }

  if (!user.mobile) {
    return NextResponse.json(
      { error: "No phone number on file for this account. Please contact support." },
      { status: 400, headers: corsHeaders(origin) }
    );
  }

  const isTestMode = process.env.USE_TEST_OTP === "true";
  const otp = isTestMode ? "123456" : generateOtp();
  const expiresAt = getOtpExpiry(5);

  console.log("Attempting to upsert OTP:", {
    userId: user.id,
    otp,
    expiresAt,
    testMode: isTestMode,
  });
  
  try {
    await db
      .insert(otpVerifications)
      .values({
        userId: user.id,
        otp,
        attempts: 0,
        verified: false,
        expiresAt,
      })
      .onDuplicateKeyUpdate({
        set: {
          otp,
          attempts: 0,
          verified: false,
          expiresAt,
        },
      });

    console.log("OTP upserted successfully for userId:", user.id);
  } catch (err) {
    console.error("OTP upsert failed:", err);
    return NextResponse.json(
      { error: "Failed to create OTP. Please try again." },
      { status: 500, headers: corsHeaders(origin) }
    );
  }

  if (!isTestMode) {
    const smsResult = await sendOtpSms(user.mobile, otp);
    if (!smsResult.success) {
      console.error("Failed to send OTP SMS:", smsResult.error);
    }
  } else {
    console.log("Test mode active — SMS skipped, OTP is 123456");
  }

  return NextResponse.json(
    {
      message: "OTP sent successfully",
      userId: user.id,
      phone: user.mobile,
      role: user.role,
    },
    { headers: corsHeaders(origin) }
  );
}

export async function DELETE(req: NextRequest) {
  const origin = req.headers.get("origin");

  const res = NextResponse.json(
    { message: "Logged out successfully" },
    { headers: corsHeaders(origin) }
  );

  // Login ke waqt set kiya gaya token cookie clear karo
  res.cookies.set("token", "", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: 0, // immediately expire
  });

  return res;
}