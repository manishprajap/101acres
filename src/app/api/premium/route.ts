// import { db } from "@/db/db";
// import { properties } from "@/db/schema";
// import { and, eq } from "drizzle-orm";
// import { NextResponse } from "next/server";

// export async function GET(req: Request) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const userId = searchParams.get("userId");
//     const role = searchParams.get("role");

//     if (!userId || isNaN(Number(userId))) {
//       return NextResponse.json(
//         { success: false, message: "Missing or invalid userId" },
//         { status: 400 }
//       );
//     }

//     let result;

//     if (role === "admin") {
//       // Admin sees all premium properties
//       result = await db
//         .select()
//         .from(properties)
//         .where(eq(properties.premium, true));
//     } else {
//       // Normal user sees only their own premium properties
//       result = await db
//         .select()
//         .from(properties)
//         .where(
//           and(
//             eq(properties.premium, true),
//             eq(properties.user_id, Number(userId))
//           )
//         );
//     }

//     return NextResponse.json({ success: true, data: result });
//   } catch (error) {
//     console.error("Error fetching premium properties:", error);
//     return NextResponse.json(
//       { success: false, message: "Failed to fetch premium properties" },
//       { status: 500 }
//     );
//   }
// }
