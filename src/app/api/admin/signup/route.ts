import { NextResponse } from 'next/server';
import { db } from "@/db/db";
import { admins } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { hash } from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    // Check if email already exists
    const existingAdmin = await db 
      .select()
      .from(admins)
      .where(eq(admins.email, email));

    if (existingAdmin.length > 0) {
      return NextResponse.json({ error: 'Email already registered.' }, { status: 400 });
    }

    // Hash the password
    const hashedPassword = await hash(password, 10);

    // Insert new admin
    await db.insert(admins).values({
      name,
      email,
      password: hashedPassword,
    });

    return NextResponse.json({ message: 'Admin registered successfully.' }, { status: 200 });
  } catch (error) {
    console.error('[ADMIN_SIGNUP_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
