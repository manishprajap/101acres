// src/app/api/properties/list/route.ts
import { db } from "@/db/db";
import { properties, countries, states, cities, users } from "@/db/schema";
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
        // all properties columns (with country/state/city IDs)
        ...getTableColumns(properties),

        // names from joined tables
        countryName: countries.name,
        stateName: states.name,
        cityName: cities.name,

        // real role of the user who added the property (agent / user / dealer / builder)
        poster_role: users.role,
      })
      .from(properties)
      .leftJoin(countries, eq(properties.country, countries.id))
      .leftJoin(states, eq(properties.state, states.id))
      .leftJoin(cities, eq(properties.city, cities.id))
      .leftJoin(users, eq(properties.user_id, users.id))
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