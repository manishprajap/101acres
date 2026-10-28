import { db } from '@/db/db';
import { users } from '@/db/schema';
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

// POST /api/register - Register new user
export async function POST(req: Request) {
  const { name, email, password } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  
  await db.insert(users).values({
    name,
    email, 
    password: hashedPassword,
  });

  return NextResponse.json({ message: "User registered successfully" });
}

// GET /api/register?id=123 - Get user info by id
export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (!id || isNaN(Number(id))) {
    return NextResponse.json({ error: "Valid User ID is required" }, { status: 400 });
  }

  try {
    const result = await db.select().from(users).where(eq(users.id, Number(id))).limit(1);

    if (result.length > 0) {
      return NextResponse.json({ name: result[0].name });
    } else {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
