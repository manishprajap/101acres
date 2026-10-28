// src/app/api/verify-otp/route.ts
import { db } from "@/db/db";
import { users, otpVerifications } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { generateToken } from "@/db/utils";
import { corsHeaders } from "@/lib/cors";

export const dynamic = "force-dynamic";

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

const MAX_ATTEMPTS = 5;

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");

  let body: { userId?: number; otp?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400, headers: corsHeaders(origin) }
    );
  }

  const { userId, otp } = body;
  if (!userId || !otp) {
    return NextResponse.json(
      { error: "userId and otp are required" },
      { status: 400, headers: corsHeaders(origin) }
    );
  }

  // Latest OTP record sabse pehle (descending order + limit 1)
  const records = await db
    .select()
    .from(otpVerifications)
    .where(eq(otpVerifications.userId, userId))
    .orderBy(desc(otpVerifications.id))
    .limit(1);

  const record = records[0];

  if (!record) {
    return NextResponse.json(
      { error: "No OTP request found. Please login again." },
      { status: 404, headers: corsHeaders(origin) }
    );
  }

  if (record.verified) {
    return NextResponse.json(
      { error: "OTP already used. Please login again." },
      { status: 400, headers: corsHeaders(origin) }
    );
  }

  if (new Date() > new Date(record.expiresAt)) {
    return NextResponse.json(
      { error: "OTP expired. Please login again to get a new OTP." },
      { status: 400, headers: corsHeaders(origin) }
    );
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: "Too many incorrect attempts. Please login again." },
      { status: 429, headers: corsHeaders(origin) }
    );
  }

  // String() se compare kar rahe hain — DB column "otp" number ya string,
  // dono type me sahi se match ho jaaye isliye
  if (String(record.otp) !== String(otp)) {
    // Galat OTP -> attempt count badhao
    await db
      .update(otpVerifications)
      .set({ attempts: record.attempts + 1 })
      .where(eq(otpVerifications.id, record.id));

    return NextResponse.json(
      { error: "Invalid OTP. Please try again." },
      { status: 401, headers: corsHeaders(origin) }
    );
  }

  // OTP sahi hai — verified mark karo
  await db
    .update(otpVerifications)
    .set({ verified: true })
    .where(eq(otpVerifications.id, record.id));

  // User details fetch karo
  const usersList = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      mobile: users.mobile,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, userId));

  const user = usersList[0];

  if (!user) {
    return NextResponse.json(
      { error: "User not found" },
      { status: 404, headers: corsHeaders(origin) }
    );
  }

  // Login complete — token banao, cookie set karo
  const token = generateToken(user.id, user.email);

  const res = NextResponse.json(
    {
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.mobile, // DB column "mobile" hai, response me "phone" naam se bhej rahe
        role: user.role,
      },
      token,
    },
    { headers: corsHeaders(origin) }
  );

  res.cookies.set("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: 24 * 60 * 60, // 24 ghante (seconds me)
  });

  return res;
}