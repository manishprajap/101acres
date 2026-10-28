import { NextRequest, NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/db/db';
import { corsHeaders } from '@/lib/cors';

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin');

  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

export async function GET(req: NextRequest) {
  const origin = req.headers.get('origin');

  const { searchParams } =
    new URL(req.url);
	
  const lat = Number(
    searchParams.get('lat')
  );

  const lng = Number(
    searchParams.get('lng')
  );

  // Validate latitude / longitude
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    Math.abs(lat) > 90 ||
    Math.abs(lng) > 180
  ) {
    return NextResponse.json(
      {
        error: 'Invalid lat/lng',
      },
      {
        status: 400,
        headers: corsHeaders(origin),
      }
    );
  }

  const radius = Math.min(
    Math.max(
      Number(
        searchParams.get('radius')
      ) || 50,
      1
    ),
    100
  );

  const limit = Math.min(
    Math.max(
      Math.floor(
        Number(
          searchParams.get('limit')
        )
      ) || 10,
      1
    ),
    30
  );

 
  const offset = Math.max(
    Math.floor(
      Number(
        searchParams.get('offset')
      )
    ) || 0,
    0
  );

  const type = (
    searchParams.get('type') || ''
  )
    .toLowerCase()
    .trim();

  const typeSql =
    type === 'rent'
      ? sql`
          AND LOWER(p.property_for) = 'rent'
        `
      : type === 'sale' ||
          type === 'sell'
        ? sql`
            AND LOWER(p.property_for)
              IN ('sale', 'sell')
          `
        : sql``;

  const latDelta =
    radius / 111;

  const lngDelta =
    radius /
    (
      111 *
      Math.max(
        Math.cos(
          (lat * Math.PI) / 180
        ),
        0.01
      )
    );

  try {
    const [rows] =
      await db.execute(sql`
        SELECT
          p.id,

          p.contact_name AS contactName,

          p.title,

          p.property_for AS propertyFor,

          p.property_type AS propertyType,

          p.square_ft AS squareFt,

          p.beds,

          p.baths,

          p.price,

          p.image,

          p.premium,

          p.latitude,

          p.longitude,

          c.name AS city,

          a.name AS area,

          (
            6371 * ACOS(
              LEAST(
                1,

                COS(
                  RADIANS(${lat})
                )

                *

                COS(
                  RADIANS(p.latitude)
                )

                *

                COS(
                  RADIANS(p.longitude)
                  -
                  RADIANS(${lng})
                )

                +

                SIN(
                  RADIANS(${lat})
                )

                *

                SIN(
                  RADIANS(p.latitude)
                )
              )
            )
          ) AS distanceKm

        FROM properties p

        LEFT JOIN cities c
          ON c.id = p.city

        LEFT JOIN areas a
          ON a.id = p.area

        WHERE
          p.is_deleted = 0

          AND p.latitude BETWEEN
            ${lat - latDelta}
            AND
            ${lat + latDelta}

          AND p.longitude BETWEEN
            ${lng - lngDelta}
            AND
            ${lng + lngDelta}

          ${typeSql}

        HAVING
          distanceKm <= ${radius}

        ORDER BY
          distanceKm ASC

        LIMIT
          ${limit + 1}

        OFFSET
          ${offset}
      `);

    const list =
      rows as unknown as Record<
        string,
        unknown
      >[];

    const hasMore =
      list.length > limit;

    const data =
      list.slice(0, limit);

    return NextResponse.json(
      {
        data,
        hasMore,
        nextOffset:
          offset + limit,
      },
      {
        status: 200,
        headers: corsHeaders(origin),
      }
    );
  } catch (err) {
   
    console.error(
      'nearby error',
      err
    );

    return NextResponse.json(
      {
        error: 'Server error',
      },
      {
        status: 500,
        headers: corsHeaders(origin),
      }
    );
  }
}