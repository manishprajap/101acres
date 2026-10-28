// app/api/areamaster/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db/db';
import { area, countries, states, cities } from '@/db/schema';
import { eq,desc } from 'drizzle-orm';

// GET all areas
export async function GET() {
  try {
    const result = await db
      .select({
        id: area.id,
        areaName: area.name,
        countryName: countries.name,
        stateName: states.name,
        cityName: cities.name,
      })
      .from(area)
      .innerJoin(countries, eq(area.country_id, countries.id))
      .innerJoin(states, eq(area.state_id, states.id))
      .innerJoin(cities, eq(area.city_id, cities.id))
     .orderBy(desc(area.id));

    return NextResponse.json(result);
  } catch (err) {
    console.error('GET /areamaster error:', err);
    return NextResponse.json([], { status: 500 });
  }
}

// POST to add a new area
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, country_id, state_id, city_id } = body;

    if (!name || !country_id || !state_id || !city_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await db.insert(area).values({
      name,
      country_id,
      state_id,
      city_id,
    });

    return NextResponse.json({ message: 'Area added successfully' });
  } catch (error) {
    console.error('POST /areamaster error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
