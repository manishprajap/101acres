import { NextResponse } from "next/server";
import { db } from "@/db/db";
import { users } from "@/db/schema"; 

export async function GET() {
  try {
    const result = await db.select().from(users);
    return NextResponse.json({ data: result });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
