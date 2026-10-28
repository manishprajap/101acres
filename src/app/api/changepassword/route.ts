import { db } from "@/db/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { corsHeaders } from "@/lib/cors";

export const dynamic = "force-dynamic";

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");

  // 1. Read userId directly from request body
  const { userId, currentPassword, newPassword } = await req.json();

  if (!userId) {
    return NextResponse.json(
      { error: "userId is required" },
      { status: 400, headers: corsHeaders(origin) }
    );
  }
  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: "Current password and new password are required" },
      { status: 400, headers: corsHeaders(origin) }
    );
  }
  if (newPassword.length < 6) {
    return NextResponse.json(
      { error: "New password must be at least 6 characters" },
      { status: 400, headers: corsHeaders(origin) }
    );
  }
  if (newPassword === currentPassword) {
    return NextResponse.json(
      { error: "New password must be different from the current one" },
      { status: 400, headers: corsHeaders(origin) }
    );
  }

  // 2. Look up the user's password hash
  const usersList = await db
    .select({ id: users.id, password: users.password })
    .from(users)
    .where(eq(users.id, userId));

  const existingUser = usersList[0];
  if (!existingUser) {
    return NextResponse.json(
      { error: "User not found" },
      { status: 404, headers: corsHeaders(origin) }
    );
  }

  // 3. Verify current password
  const isValid = await bcrypt.compare(currentPassword, existingUser.password);
  if (!isValid) {
    return NextResponse.json(
      { error: "Current password is incorrect" },
      { status: 400, headers: corsHeaders(origin) }
    );
  }

  // 4. Hash + save new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await db
    .update(users)
    .set({ password: hashedPassword })
    .where(eq(users.id, userId));

  return NextResponse.json(
    { message: "Password changed successfully" },
    { headers: corsHeaders(origin) }
  );
}