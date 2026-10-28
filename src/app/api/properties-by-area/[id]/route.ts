// // // /src/app/api/properties-by-area/[id]/route.ts

// // import { NextRequest, NextResponse } from "next/server";
// // import { db } from "@/db/db";
// // import { area, properties, property_article } from "@/db/schema";
// // import { eq, and, sql } from "drizzle-orm";

// // export async function GET(_req: NextRequest, context: any) {
// //   const idParam = context?.params?.id;
// //   const areaId = Number(idParam);

// //   if (isNaN(areaId)) {
// //     return NextResponse.json({ error: "Invalid area ID" }, { status: 400 });
// //   }

// //   try {
// //     // Get properties for area
// //     const propsData = await db
// //       .select()
// //       .from(properties)
// //       .where(
// //         and(eq(properties.area, areaId), eq(properties.status, "Active"))
// //       )
// //       .execute();

// //        // ✅ Get property articles for area + area name
// //        const articleResults = await db
// //        .select()
// //       .from(property_article)
// //       .where(
// //         and(eq(property_article.area, areaId), eq(property_article.status, "Active"))
// //       )
// //       .execute();
// // console.log("articleResults",articleResults)
// //     return NextResponse.json({
// //       properties: propsData,
// //       propertyArticles: articleResults
// //     });
// //   } catch (error) {
// //     console.error("DB Error:", error);
// //     return NextResponse.json({ error: "Server Error" }, { status: 500 });
// //   }
// // }


// // /src/app/api/properties-by-area/[id]/route.ts

// import { NextRequest, NextResponse } from "next/server";
// import { db } from "@/db/db";
// import { area, cities, countries, properties, property_article, states } from "@/db/schema";
// import { eq, and } from "drizzle-orm";
// import { corsHeaders } from "@/lib/cors";

// export async function OPTIONS(_req: NextRequest) {
//   const origin = _req.headers.get("origin");
//   return new NextResponse(null, {
//     status: 200,                      // ← 204 ki jagah 200
//     headers: corsHeaders(origin),
//   });
// }

// export async function GET(_req: NextRequest, context: any) {
//   const idParam = context?.params?.id;
//   const areaId = Number(idParam);
// const origin = _req.headers.get("origin");

//   if (isNaN(areaId)) {
//     return NextResponse.json({ error: "Invalid area ID" }, { status: 400 });
//   }

//   try {
//     // Fetch properties with area and active status
//     const propertiesData = await db
//       .select()
//       .from(properties)
      
//       .where(and(eq(properties.area, areaId), eq(properties.status, "Active")))
//       .execute();
//      /// console.log("objectpropertiesData",propertiesData);
//     // Fetch property articles with area and active status
//     const propertyArticlesData = await db
//       .select( {  id: property_article.id,
//         country_name: countries.name,
//               state_name: states.name,
//               city_name: cities.name,
//               area_name: area.name,
//               user_id: property_article.user_id,
//               image: property_article.image,
//               propertyLocation: property_article.propertyLocation,
//               propertyType: property_article.propertyType,
//               residentialType: property_article.residentialType,
//               propertyFor: property_article.propertyFor,
//               country_id: property_article.country,
//               state_id: property_article.state,
//               city_id: property_article.city,
//               area_id: property_article.area,
//               description: property_article.description,
//               status: property_article.status} )
//       .from(property_article)
//       .leftJoin(countries, eq(countries.id, property_article.country))
//       .leftJoin(states, eq(states.id, property_article.state))
//       .leftJoin(cities, eq(cities.id, property_article.city))
//       .leftJoin(area, eq(area.id, property_article.area))
//       .where(and(eq(property_article.area, areaId), eq(property_article.status, "Active")))
//       .execute();
// ///console.log("objectpropertyArticlesData",propertyArticlesData);

//     // Convert arrays to objects keyed by id, add `type` to each item
//     const propertiesById = Object.fromEntries(
//       propertiesData.map((item) => [item.id, { ...item, type: "property" }])
//     );

//     const articlesById = Object.fromEntries(
//       propertyArticlesData.map((item) => [item.id, { ...item, type: "propertyArticle" }])
//     );

//     // Merge both objects (if duplicate keys, articles overwrite properties)
//     const combinedData = { ...propertiesById, ...articlesById };
//     ///console.log("combinedData",combinedData)
//     return NextResponse.json(combinedData,{
//       status: 200,
//       headers: corsHeaders(origin),
//     });
//   } catch (error) {
//     console.error("DB Error:", error);
//     return NextResponse.json({ error: "Server Error" }, { status: 500 , headers: corsHeaders(origin)});
//   }
// }
