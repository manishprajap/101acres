// /app/api/cities/search/route.ts
import { db } from "@/db/db";
import { cities, area } from "@/db/schema";
import { like, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { corsHeaders } from "@/lib/cors";

export async function OPTIONS(_req: NextRequest) {
  const origin = _req.headers.get("origin");
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(origin),
  });
}

export async function GET(req: NextRequest) {
  const origin = req.headers.get("origin");
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return NextResponse.json(
      { success: true, data: [] },
      { status: 200, headers: corsHeaders(origin) }
    );
  }

  try {
    const pattern = `%${q}%`;

    // Cities aur areas dono me parallel search
    const [cityMatches, areaMatches] = await Promise.all([
      db.select().from(cities).where(like(cities.name, pattern)).limit(5),
      db.select().from(area).where(like(area.name, pattern)).limit(5),
    ]);

    // areas ke against parent city ka naam chahiye (frontend ko "Locality"
    // suggestion ke saath city bhi dikhana/store karna hota hai)
    const cityIds = [
      ...new Set(areaMatches.map((a) => a.city_id).filter((id): id is number => id != null)),
    ];

    const cityLookup = cityIds.length
      ? await db.select().from(cities).where(inArray(cities.id, cityIds))
      : [];
    const cityNameById = new Map(cityLookup.map((c) => [c.id, c.name]));

    const results = [
      ...cityMatches.map((c) => ({
        id: c.id,
        name: c.name,
        city: c.name,
        type: "City",
      })),
      ...areaMatches.map((a) => ({
        id: a.id,
        name: a.name,
        city: a.city_id != null ? cityNameById.get(a.city_id) ?? "" : "",
        cityId: a.city_id ?? undefined,
        type: "Locality",
      })),
    ];

    return NextResponse.json(
      { success: true, data: results },
      { status: 200, headers: corsHeaders(origin) }
    );
  } catch (error) {
    console.error("Error searching cities/areas:", error);
    return NextResponse.json(
      { success: false, message: "Failed to search locations" },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}