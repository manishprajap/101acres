import { NextRequest, NextResponse } from "next/server";
import { and, desc, inArray, sql, type SQL } from "drizzle-orm";
import { db } from "@/db/db";
import { propertyFormProperties as properties } from "@/db/schema";
import { serializePropertyStorageRow } from "@/lib/propertyFormStorage";

export const dynamic = "force-dynamic";

const positiveInt = (value: string | null, fallback: number) => {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const search = (params.get("search") ?? params.get("query") ?? "")
      .trim()
      .slice(0, 100);
    const lookingTo = (params.get("looking_to") ?? "").trim().toLowerCase();
    const category = (params.get("category") ?? "").trim().toLowerCase();
    const latitudeParam = params.get("latitude");
    const longitudeParam = params.get("longitude");
    const radiusParam = params.get("radius");
    const latitude = latitudeParam === null ? null : Number(latitudeParam);
    const longitude = longitudeParam === null ? null : Number(longitudeParam);
    const radius = radiusParam === null ? 5 : Number(radiusParam);
    const hasCoordinates =
      latitude !== null &&
      longitude !== null &&
      Number.isFinite(latitude) &&
      Math.abs(latitude) <= 90 &&
      Number.isFinite(longitude) &&
      Math.abs(longitude) <= 180;

    if ((latitudeParam !== null || longitudeParam !== null) && !hasCoordinates) {
      return NextResponse.json(
        { success: false, message: "Valid latitude and longitude are required" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(radius) || radius <= 0 || radius > 100) {
      return NextResponse.json(
        { success: false, message: "Radius must be between 0 and 100 kilometres" },
        { status: 400 }
      );
    }

    const requestedTypes = (params.get("types") ?? "")
      .split(",")
      .map((type) => type.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 30);
    const limit = Math.min(positiveInt(params.get("limit"), 10), 50);
    const page = positiveInt(params.get("page"), 1);
    const offset = (page - 1) * limit;

    const formLookingTo = sql`LOWER(COALESCE(
      JSON_UNQUOTE(JSON_EXTRACT(${properties.form_data}, '$.lookingTo')),
      ${properties.propertyFor},
      ''
    ))`;
    const formCategory = sql`LOWER(COALESCE(
      JSON_UNQUOTE(JSON_EXTRACT(${properties.form_data}, '$.propertyCategory')),
      ${properties.residentialType},
      ''
    ))`;
    const formType = sql`LOWER(COALESCE(
      JSON_UNQUOTE(JSON_EXTRACT(${properties.form_data}, '$.propertyType')),
      ${properties.propertyType},
      ''
    ))`;
    const propertyLatitude = sql`CAST(JSON_UNQUOTE(JSON_EXTRACT(${properties.form_data}, '$.latitude')) AS DECIMAL(10,7))`;
    const propertyLongitude = sql`CAST(JSON_UNQUOTE(JSON_EXTRACT(${properties.form_data}, '$.longitude')) AS DECIMAL(10,7))`;
    const distanceKm = hasCoordinates
      ? sql<number>`6371 * 2 * ASIN(SQRT(
          POWER(SIN(RADIANS(${propertyLatitude} - ${latitude}) / 2), 2) +
          COS(RADIANS(${latitude})) * COS(RADIANS(${propertyLatitude})) *
          POWER(SIN(RADIANS(${propertyLongitude} - ${longitude}) / 2), 2)
        ))`
      : null;

    const conditions: SQL[] = [
      sql`COALESCE(${properties.isDeleted}, false) = false`,
      sql`LOWER(COALESCE(
        JSON_UNQUOTE(JSON_EXTRACT(${properties.form_data}, '$.status')),
        ${properties.status},
        ''
      )) IN ('published', 'active')`,
    ];

    if (hasCoordinates && distanceKm) {
      conditions.push(sql`${propertyLatitude} IS NOT NULL`);
      conditions.push(sql`${propertyLongitude} IS NOT NULL`);
      conditions.push(sql`${distanceKm} <= ${radius}`);
    }

    if (lookingTo === "rent" || lookingTo === "lease") {
      conditions.push(inArray(formLookingTo, ["rent", "lease"]));
    } else if (lookingTo === "sell" || lookingTo === "sale" || lookingTo === "buy") {
      conditions.push(inArray(formLookingTo, ["sell", "sale", "buy"]));
    }

    if (category === "residential" || category === "commercial") {
      conditions.push(sql`${formCategory} = ${category}`);
    } else if (category === "plot" || category === "plots" || category === "land") {
      conditions.push(sql`${formType} LIKE '%plot%' OR ${formType} LIKE '%land%'`);
    }

    if (requestedTypes.length > 0) {
      conditions.push(
        sql`(${sql.join(
          requestedTypes.map((type) => sql`${formType} LIKE ${`%${type}%`}`),
          sql` OR `
        )})`
      );
    }

    for (const token of search.split(/\s+/).filter(Boolean).slice(0, 5)) {
      const pattern = `%${token.replace(/[\\%_]/g, "\\$&")}%`;
      conditions.push(
        sql`(
          ${properties.title} LIKE ${pattern}
          OR ${properties.propertyLocation} LIKE ${pattern}
          OR ${formLookingTo} LIKE ${pattern}
          OR ${formCategory} LIKE ${pattern}
          OR ${formType} LIKE ${pattern}
          OR JSON_UNQUOTE(JSON_EXTRACT(${properties.form_data}, '$.city')) LIKE ${pattern}
          OR JSON_UNQUOTE(JSON_EXTRACT(${properties.form_data}, '$.locality')) LIKE ${pattern}
          OR JSON_UNQUOTE(JSON_EXTRACT(${properties.form_data}, '$.subLocality')) LIKE ${pattern}
          OR JSON_UNQUOTE(JSON_EXTRACT(${properties.form_data}, '$.society')) LIKE ${pattern}
          OR CAST(${properties.id} AS CHAR) LIKE ${pattern}
        )`
      );
    }

    const where = and(...conditions);
    const [count] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(properties)
      .where(where);
    const total = Number(count?.count ?? 0);

    const rows = await db
      .select(distanceKm ? { property: properties, distanceKm } : { property: properties })
      .from(properties)
      .where(where)
      .orderBy(
        ...(distanceKm
          ? [sql`${distanceKm} ASC`, desc(properties.id)]
          : [desc(properties.id)])
      )
      .limit(limit)
      .offset(offset);

    const results = rows.map((row) => {
      const source = "property" in row ? row.property : row;
      const property = serializePropertyStorageRow(
        source as Record<string, unknown>
      );

      return {
        ...property,
        name: property.title,
        ...(distanceKm && "distanceKm" in row
          ? { distanceKm: Number(row.distanceKm) }
          : {}),
        price: property.expected_price ?? property.price,
        video: property.youtube_link ?? property.youtubeLink ?? null,
      };
    });

    return NextResponse.json({
      success: true,
      results,
      items: results,
      total,
      limit,
      page,
      hasMore: offset + results.length < total,
    });
  } catch (error) {
    console.error("Public property search error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to search properties",
        details: error instanceof Error ? error.message : "Unknown database error",
      },
      { status: 500 }
    );
  }
}
