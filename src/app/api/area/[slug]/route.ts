// import { NextRequest, NextResponse } from "next/server";
// import { db } from "@/db/db";
// import { properties, area, property_article } from "@/db/schema";
// import { and, eq, sql } from "drizzle-orm";
// import { corsHeaders } from "@/lib/cors";

// export async function OPTIONS(_req: NextRequest) {
//   const origin = _req.headers.get("origin");
//   return new NextResponse(null, {
//     status: 200,                      // ← 204 ki jagah 200
//     headers: corsHeaders(origin),
//   });
// }

// export async function GET(
//   _req: NextRequest,
//   context: { params: Promise<{ slug: string }> }
// ) {
//   const origin = _req.headers.get("origin");
//   const { slug } = await context.params;

//   if (!slug) {
//     return NextResponse.json(
//       { error: "Missing slug parameter" },
//       { status: 400, headers: corsHeaders(origin) }
//     );
//   }

//   try {
//     const propertyResults = await db
//       .select({
//         id: area.id,
//         areaName: area.name,
//         propertyCount: sql<number>`COUNT(DISTINCT ${properties.id})`.mapWith(Number),
//       })
//       .from(properties)
//       .leftJoin(area, eq(area.id, properties.area))
//       .where(and(eq(properties.slug, slug), eq(properties.status, "Active")))
//       .groupBy(area.id, area.name)
//       .execute();

//     const articleResults = await db
//       .select({
//         id: area.id,
//         areaName: area.name,
//         articleCount: sql<number>`COUNT(DISTINCT ${property_article.id})`.mapWith(Number),
//       })
//       .from(property_article)
//       .leftJoin(area, eq(area.id, property_article.area))
//       .where(and(eq(property_article.slug, slug), eq(property_article.status, "Active")))
//       .groupBy(area.id, area.name)
//       .execute();

//     const combinedMap = new Map<
//       number,
//       { id: number; areaName: string; propertyCount: number; articleCount: number }
//     >();

//     for (const res of propertyResults) {
//       if (!res.id || !res.areaName) continue;
//       combinedMap.set(res.id, {
//         id: res.id,
//         areaName: res.areaName,
//         propertyCount: res.propertyCount || 0,
//         articleCount: 0,
//       });
//     }

//     for (const res of articleResults) {
//       if (!res.id || !res.areaName) continue;
//       const existing = combinedMap.get(res.id);
//       if (existing) {
//         existing.articleCount = res.articleCount || 0;
//       } else {
//         combinedMap.set(res.id, {
//           id: res.id,
//           areaName: res.areaName,
//           propertyCount: 0,
//           articleCount: res.articleCount || 0,
//         });
//       }
//     }

//     const combinedResult = Array.from(combinedMap.values()).map((item) => ({
//       id: item.id,
//       areaName: item.areaName,
//       propertyCount: (item.propertyCount || 0) + (item.articleCount || 0),
//     }));

//     return NextResponse.json(combinedResult, {
//       status: 200,
//       headers: corsHeaders(origin),
//     });
//   } catch (error) {
//     console.error("Error fetching properties for slug:", slug, error);
//     return NextResponse.json(
//       { error: "Internal server error" },
//       { status: 500, headers: corsHeaders(origin) }
//     );
//   }
// }