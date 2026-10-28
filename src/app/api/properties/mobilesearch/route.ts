// /app/api/properties/mobilesearch/route.ts
import { db } from "@/db/db";
import { properties, cities, area as areaTable } from "@/db/schema";
import { and, eq, or, like, desc } from "drizzle-orm";
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

    // city/area are int FKs on the properties table, so we join in the
    // actual cities/areas tables to get their display names — the
    // frontend expects `city` and `area` to be name strings, not IDs.
    const results = await db
      .select({
        id: properties.id,
        title: properties.title,
        contactName: properties.contactName,
        slug: properties.slug,
        image: properties.image,
        propertyLocation: properties.propertyLocation,
        city: cities.name,
        area: areaTable.name,
      })
      .from(properties)
      .leftJoin(cities, eq(properties.city, cities.id))
      .leftJoin(areaTable, eq(properties.area, areaTable.id))
      .where(
        and(
          eq(properties.isDeleted, false),
          or(
            like(properties.title, pattern),
            like(properties.contactName, pattern),
            like(properties.propertyLocation, pattern),
            like(properties.address, pattern),
            like(properties.landmark, pattern)
          )
        )
      )
      .orderBy(desc(properties.id))
      .limit(8);

    return NextResponse.json(
      { success: true, data: results },
      { status: 200, headers: corsHeaders(origin) }
    );
  } catch (error) {
    console.error("Error searching properties:", error);
    return NextResponse.json(
      { success: false, message: "Failed to search properties" },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}