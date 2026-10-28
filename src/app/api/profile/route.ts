import { db } from "@/db/db";
import { users } from "@/db/schema";
import { and, eq, ne } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { corsHeaders } from "@/lib/cors";

export const dynamic = "force-dynamic";

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

// GET expects ?userId=123 in the query string
export async function GET(req: NextRequest) {
  const origin = req.headers.get("origin");
  const userId = req.nextUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json(
      { error: "userId is required" },
      { status: 400, headers: corsHeaders(origin) }
    );
  }

  const usersList = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      mobile: users.mobile,
      address: users.address,
      image: users.image,
    })
    .from(users)
    .where(eq(users.id, Number(userId)));

  const existingUser = usersList[0];
  if (!existingUser) {
    return NextResponse.json(
      { error: "User not found" },
      { status: 404, headers: corsHeaders(origin) }
    );
  }

  return NextResponse.json(existingUser, { headers: corsHeaders(origin) });
}

export async function PUT(req: NextRequest) {
  return updateProfile(req);
}

// Frontend's apiPost() only ever sends POST, so accept that too.
export async function POST(req: NextRequest) {
  return updateProfile(req);
}

async function updateProfile(req: NextRequest) {
  const origin = req.headers.get("origin");
  const { userId, name, email, phone } = await req.json();

  if (!userId) {
    return NextResponse.json(
      { error: "userId is required" },
      { status: 400, headers: corsHeaders(origin) }
    );
  }
  if (!name || !name.trim()) {
    return NextResponse.json(
      { error: "Name cannot be empty" },
      { status: 400, headers: corsHeaders(origin) }
    );
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Please provide a valid email address" },
      { status: 400, headers: corsHeaders(origin) }
    );
  }

  // email has a unique constraint in the schema — block collisions with other users
  if (email) {
    const clashList = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, email), ne(users.id, userId)));
    if (clashList[0]) {
      return NextResponse.json(
        { error: "That email is already in use" },
        { status: 409, headers: corsHeaders(origin) }
      );
    }
  }

  // schema defines mobile as a non-null int
  const mobileValue = phone ? parseInt(String(phone).replace(/\D/g, ""), 10) : 0;

  await db
    .update(users)
    .set({
      name: name.trim(),
      ...(email ? { email } : {}),
      mobile: isNaN(mobileValue) ? 0 : mobileValue,
    })
    .where(eq(users.id, userId));

  // MySQL's drizzle driver doesn't support .returning(), so re-fetch the row
  const updatedList = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      mobile: users.mobile,
      address: users.address,
      image: users.image,
    })
    .from(users)
    .where(eq(users.id, userId));

  return NextResponse.json(
    { message: "Profile updated successfully", user: updatedList[0] },
    { headers: corsHeaders(origin) }
  );
}