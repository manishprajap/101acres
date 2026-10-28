// import { NextResponse } from "next/server";
// import { db } from "@/db/db";

// export async function GET() {
  // try {
    // const [rows] = await db.execute(
      // `SELECT c.name AS city, COUNT(*) as propertyCount
       // FROM properties p
       // JOIN cities c ON p.city = c.id
       // WHERE p.status = 'Active' 
       // GROUP BY c.name`
    // );

    // const data = rows as unknown as any[];

    // const cities = data.map((row) => ({
      // name: row.city,
      // slug: row.city.toLowerCase().replace(/\s+/g, "-"),
      // propertyCount: row.propertyCount,
    // }));

    // return NextResponse.json(cities);
  // } catch (error) {
    // console.error("Error fetching cities:", error);
    // return NextResponse.json({ error: "Failed to fetch cities" }, { status: 500 });
  // }
// }

// app/api/citiesarea/route.ts  (ya jahan bhi yeh route hai)

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/db';
import { corsHeaders } from '@/lib/cors';

// ── Preflight ──────────────────────────────────────────────
export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin');
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

// ── GET /api/citiesarea ────────────────────────────────────
export async function GET(req: NextRequest) {
  const origin = req.headers.get('origin');

  try {
    const [rows] = await db.execute(
      `SELECT
         c.id,
         c.name AS city,
         COALESCE(p.propertyCount, 0) + COALESCE(pa.propertyArticleCount, 0) AS propertyCount
       FROM cities c
       LEFT JOIN (
         SELECT city, COUNT(*) AS propertyCount
         FROM properties
         WHERE status = 'Active'
         GROUP BY city
       ) p ON p.city = c.id
       LEFT JOIN (
         SELECT city, COUNT(*) AS propertyArticleCount
         FROM property_article
         WHERE status = 'Active'
         GROUP BY city
       ) pa ON pa.city = c.id
       WHERE (p.propertyCount IS NOT NULL OR pa.propertyArticleCount IS NOT NULL)
       ORDER BY c.name`
    );

    const data = rows as unknown as any[];
    const cities = data.map((row) => ({
      id:            row.id,
      name:          row.city,
      slug:          row.city.toLowerCase().replace(/\s+/g, '-'),
      propertyCount: row.propertyCount,
    }));

    return NextResponse.json(cities, {
      status: 200,
      headers: corsHeaders(origin),   // ← CORS headers response pe bhi lagao
    });

  } catch (error) {
    console.error('Error fetching cities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cities' },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}