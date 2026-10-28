// src/app/api/login/route.ts
import { db } from "@/db/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { generateToken } from "@/db/utils";
import { corsHeaders } from "@/lib/cors";

export const dynamic = "force-dynamic";

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");

  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400, headers: corsHeaders(origin) }
    );
  }

  const usersList = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      password: users.password,
      role: users.role,
    })
    .from(users)
    .where(eq(users.email, email));

  const existingUser = usersList[0];

  if (!existingUser) {
    return NextResponse.json(
      { error: "User not found" },
      { status: 404, headers: corsHeaders(origin) }
    );
  }

  const isValid = await bcrypt.compare(password, existingUser.password);
  if (!isValid) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401, headers: corsHeaders(origin) }
    );
  }

  const token = generateToken(existingUser.id, existingUser.email);

  const res = NextResponse.json(
    {
      message: "Login successful",
      user: {
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.role,
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
    maxAge: 24 * 60,
    expires: new Date(Date.now() + 24 * 60 * 1000),
  });

  return res;
}

export async function DELETE(req: NextRequest) {
  const origin = req.headers.get("origin");

  const response = NextResponse.json(
    { message: "Logout successful" },
    { headers: corsHeaders(origin) }
  );

  response.cookies.set("token", "", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
    maxAge: 0,
  });

  return response;
}