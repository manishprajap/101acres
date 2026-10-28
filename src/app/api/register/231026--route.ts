// src/app/api/register/route.ts
import { db } from "@/db/db";
import { users, countries, states, cities, plans, userPlans } from "@/db/schema";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { eq, desc, sql } from "drizzle-orm";
import { corsHeaders } from "@/lib/cors";

// Plan names treated as free (compared after trim + lowercase).
const FREE_PLAN_NAMES = ["free", "basic"];

// Helper to save uploaded image locally (unique file name so uploads never overwrite each other)
const saveImageLocally = async (image: File) => {
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const ext = path.extname(image.name || "").toLowerCase() || ".jpg";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  const imagePath = path.join(uploadDir, fileName);
  const buffer = await image.arrayBuffer();
  fs.writeFileSync(imagePath, Buffer.from(buffer));

  return `/uploads/${fileName}`;
};

// Helper: compute expiry from plan duration text.
// "4 Days" / "15 Days" -> days, "1 month" / "2 months" -> months, "1 year" -> years.
// Falls back to 30 days if it can't be parsed.
const calcExpiryDate = (start: Date, duration: string | null | undefined) => {
  const d = new Date(start);
  const m = (duration || "")
    .trim()
    .toLowerCase()
    .match(/^(\d+)\s*(day|days|month|months|year|years)$/);

  if (!m) {
    d.setDate(d.getDate() + 30);
    return d;
  }

  const n = parseInt(m[1], 10);
  if (m[2].startsWith("day")) d.setDate(d.getDate() + n);
  else if (m[2].startsWith("month")) d.setMonth(d.getMonth() + n);
  else d.setFullYear(d.getFullYear() + n);
  return d;
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
    const planName = ((formData.get("plan") as string | null) || "").trim(); // e.g. "Silver"

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

    // If a plan was selected, make sure it exists before creating the user.
    // Lookup ignores case and leading/trailing spaces in both the DB and the request.
    let selectedPlan: {
      id: number;
      name: string;
      duration: string | null;
      price: string | null;
    } | null = null;

    if (planName) {
      const [foundPlan] = await db
        .select()
        .from(plans)
        .where(sql`LOWER(TRIM(${plans.name})) = ${planName.toLowerCase()}`)
        .limit(1);

      if (!foundPlan) {
        return NextResponse.json(
          { error: `Selected plan "${planName}" not found` },
          { status: 400, headers: corsHeaders(origin) }
        );
      }

      selectedPlan = {
        id: foundPlan.id,
        name: foundPlan.name,
        duration: foundPlan.duration,
        price: foundPlan.price,
      };
    }

    // Free plan (price 0, or name is free/basic) => active immediately.
    // Any other plan (Silver / Gold / Diamond) => inactive until admin approves payment.
    const isFreePlan = selectedPlan
      ? Number(selectedPlan.price) === 0 ||
        FREE_PLAN_NAMES.includes(selectedPlan.name.trim().toLowerCase())
      : true;
    const isPaidPlan = !!selectedPlan && !isFreePlan;

    const hashedPassword = await bcrypt.hash(password, 10);

    let imagePath = "";
    if (image && image.size > 0) {
      imagePath = await saveImageLocally(image);
    }

    // Insert user and capture the new user's id
    const [userResult] = await db.insert(users).values({
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

    const newUserId = (userResult as { insertId: number }).insertId;

    // Link the selected plan to this user in user_plans
    if (selectedPlan && newUserId) {
      const startDate = new Date();
      const expiryDate = calcExpiryDate(startDate, selectedPlan.duration);

      await db.insert(userPlans).values({
        user_id: newUserId,
        plan_id: selectedPlan.id,
        start_date: startDate,
        expiry_date: expiryDate,
        status: isPaidPlan ? "inactive" : "active",
      });
    }

    return NextResponse.json(
      {
        message: "User registered successfully",
        requiresPayment: isPaidPlan,
        planName: selectedPlan?.name ?? null,
      },
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