// src/app/api/login/route.ts
import { db } from "@/db/db";
import { admins } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { generateToken } from "@/db/utils";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const adminList = await db
    .select({
      id: admins.id,
      name: admins.name,
      email: admins.email,
      password: admins.password,
    })
    .from(admins)
    .where(eq(admins.email, email));

  const existingUser = adminList[0];

  if (!existingUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const isValid = await bcrypt.compare(password, existingUser.password);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = generateToken(existingUser.id, existingUser.email);

  const res = NextResponse.json({
    message: "Login successful",
    user: {
      id: existingUser.id,
      name: existingUser.name,
      email: existingUser.email,
    },
    token,
  });

  res.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 24 * 60, // 1440 seconds
    expires: new Date(Date.now() + 24 * 60 * 1000), // 24 minutes from now
  });

  return res;
}

export async function DELETE(req: NextRequest) {
  const response = NextResponse.redirect(new URL("/landing/auth-login", req.url)); // ⬅️ Redirect after logout

  // Clear token cookie
  response.cookies.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}
