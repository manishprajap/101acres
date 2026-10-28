import { db } from "@/db/db";
import { properties, countries, states, cities } from "@/db/schema";
import { eq, and, desc, getTableColumns } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { corsHeaders } from "@/lib/cors";

// Preflight request
export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");

  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

export async function GET(req: NextRequest) {
  try {
    const origin = req.headers.get("origin");

    const allProperties = await db
      .select({
        // properties ke saare columns (country/state/city ID ke saath)
        ...getTableColumns(properties),

        // names from joined tables
        countryName: countries.name,
        stateName: states.name,
        cityName: cities.name,
      })
      .from(properties)
      .leftJoin(countries, eq(properties.country, countries.id))
      .leftJoin(states, eq(properties.state, states.id))
      .leftJoin(cities, eq(properties.city, cities.id))
      .where(
        and(
          eq(properties.isDeleted, false),
          eq(properties.isBankProperty, "no"),
          eq(properties.status, "Active")
        )
      )
      .orderBy(desc(properties.id));

    return NextResponse.json(
      {
        success: true,
        data: allProperties,
      },
      {
        headers: corsHeaders(origin),
      }
    );
  } catch (error) {
    console.error("Error fetching properties:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch properties",
      },
      {
        status: 500,
        headers: corsHeaders("*"),
      }
    );
  }
}