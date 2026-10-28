// src/app/api/register/route.ts
import { db } from "@/db/db";
import { users, countries, states, cities } from "@/db/schema";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { eq, desc } from "drizzle-orm";
import { corsHeaders } from "@/lib/cors";

// Helper to save uploaded image locally
const saveImageLocally = async (image: File) => {
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const imagePath = path.join(uploadDir, image.name);
  const buffer = await image.arrayBuffer();
  fs.writeFileSync(imagePath, Buffer.from(buffer));

  return `/uploads/${image.name}`;
};

// ── Preflight request handler ──
export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

// ── POST handler to register a new user ──
export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");

  try {
    const contentType = req.headers.get("content-type") || "";

    if (
      !contentType.includes("multipart/form-data") &&
      !contentType.includes("application/x-www-form-urlencoded")
    ) {
      return NextResponse.json(
        { error: "Invalid Content-Type. Expected multipart/form-data." },
        { status: 415, headers: corsHeaders(origin) }
      );
    }

    const formData = await req.formData();

    const memberId = formData.get("memberId") as string | null;
    const name = formData.get("name") as string | null;
    const email = formData.get("email") as string | null;
    const password = formData.get("password") as string | null;
    const role = formData.get("role") as string | null;
    const mobile = formData.get("mobile") as string | null;
    const countryId = formData.get("country") as string | null;
    const stateId = formData.get("state") as string | null;
    const cityId = formData.get("city") as string | null;
    const address = formData.get("address") as string | null;
    const image = formData.get("image") as File | null;

    if (!name || !email || !password || !mobile) {
      return NextResponse.json(
        { error: "Name, email, mobile and password are required" },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    // Check if email already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let imagePath = "";
    if (image && image.size > 0) {
      imagePath = await saveImageLocally(image);
    }

    await db.insert(users).values({
      name: name ?? "",
      memberId: memberId ? parseInt(memberId) : 0,
      email: email!,
      password: hashedPassword,
      role: role ?? "user",
      mobile: mobile ? parseInt(mobile) : 0,
      country_id: countryId ? parseInt(countryId) : null,
      state_id: stateId ? parseInt(stateId) : null,
      city_id: cityId ? parseInt(cityId) : null,
      address: address ?? "",
      image: imagePath,
    });

    return NextResponse.json(
      { message: "User registered successfully" },
      { headers: corsHeaders(origin) }
    );
  } catch (err) {
    console.error("Error in user registration:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}

// ── GET handler to fetch all users ──
export async function GET(req: NextRequest) {
  const origin = req.headers.get("origin");

  try {
    const url = new URL(req.url);
    const countryId = url.searchParams.get("countryId");
    const stateId = url.searchParams.get("stateId");
    const cityId = url.searchParams.get("cityId");
    const role = url.searchParams.get("role");
    const userId = url.searchParams.get("userId");

    if (countryId && stateId && cityId) {
      const country = await db.select().from(countries).where(eq(countries.id, Number(countryId)));
      const state = await db.select().from(states).where(eq(states.id, Number(stateId)));
      const city = await db.select().from(cities).where(eq(cities.id, Number(cityId)));

      return NextResponse.json(
        {
          countryName: country[0]?.name ?? "Unknown Country",
          stateName: state[0]?.name ?? "Unknown State",
          cityName: city[0]?.name ?? "Unknown City",
        },
        { headers: corsHeaders(origin) }
      );
    }

    let allUsers;

    if (role === "admin") {
      allUsers = await db.select().from(users).orderBy(desc(users.id));
    } else if (role === "agent" && userId) {
      allUsers = await db
        .select()
        .from(users)
        .where(eq(users.memberId, Number(userId)))
        .orderBy(desc(users.id));
    } else {
      return NextResponse.json(
        { success: false, message: "Invalid role or missing userId for agent" },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    return NextResponse.json(
      { success: true, data: allUsers },
      { headers: corsHeaders(origin) }
    );
  } catch (error) {
    console.error("Error in GET handler:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}