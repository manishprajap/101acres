// src/app/api/location/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { countries, states, cities } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const countryId = searchParams.get("countryId");
  const stateId = searchParams.get("stateId");
  const cityId = searchParams.get("cityId");

  try {
    const country = countryId
      ? await db.select().from(countries).where(eq(countries.id, Number(countryId)))
      : [];
    const state = stateId
      ? await db.select().from(states).where(eq(states.id, Number(stateId)))
      : [];
    const city = cityId
      ? await db.select().from(cities).where(eq(cities.id, Number(cityId)))
      : [];

    return NextResponse.json({
      countryName: country[0]?.name || "Unknown Country",
      stateName: state[0]?.name || "Unknown State",
      cityName: city[0]?.name || "Unknown City",
    });
  } catch (error) {
    console.error("Location fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch location data" }, { status: 500 });
  }
}
