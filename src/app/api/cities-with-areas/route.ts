import { NextResponse } from "next/server";
import { db } from "@/db/db";
import { area, cities } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const rows = await db
      .select({
        cityId:   cities.id,
        cityName: cities.name,
        areaId:   area.id,
        areaName: area.name,
      })
      .from(area)
      .innerJoin(cities, eq(cities.id, area.city_id))
      .orderBy(cities.name, area.name)
      .execute();

    // City ke hisaab se group karo
    const cityMap: Record<number, {
      cityId: number;
      cityName: string;
      localities: { areaId: number; name: string }[];
    }> = {};

    for (const row of rows) {
      if (!cityMap[row.cityId]) {
        cityMap[row.cityId] = {
          cityId:     row.cityId,
          cityName:   row.cityName,
          localities: [],
        };
      }
      cityMap[row.cityId].localities.push({
        areaId: row.areaId,
        name:   row.areaName ?? '',
      });
    }

    return NextResponse.json(Object.values(cityMap));
  } catch (error) {
    console.error("DB Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}