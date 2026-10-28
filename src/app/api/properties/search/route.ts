import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, sql, type SQL } from "drizzle-orm";
import { db } from "@/db/db";
import {
  propertyFormProperties as properties,
  users, // NOTE: adjust the export name / path if your users table is named differently
} from "@/db/schema";
import {
  normalizePropertyStorageStatus,
  serializePropertyStorageRow,
} from "@/lib/propertyFormStorage";
import { getPropertyRequestActor } from "@/lib/propertyRequestAuth";

export const dynamic = "force-dynamic";

const positiveInt = (value: string | null, fallback: number) => {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;

    /* ---------- Auth ---------- */
    const actor = await getPropertyRequestActor(request);
    if (!actor) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const isAdmin = actor.role === "admin";
    const wantsAll = params.get("scope") === "all";

    // Only admins may request every property in the table
    if (wantsAll && !isAdmin) {
      return NextResponse.json(
        { success: false, message: "Only admin can view all properties" },
        { status: 403 }
      );
    }

    /* ---------- Scope: all (admin) or one user ---------- */
    const conditions: SQL[] = [sql`COALESCE(${properties.isDeleted}, false) = false`];

    if (!wantsAll) {
      const userId = positiveInt(params.get("userId"), 0);
      if (!userId) {
        return NextResponse.json(
          { success: false, message: "A valid userId is required" },
          { status: 400 }
        );
      }
      if (!isAdmin && actor.id !== userId) {
        return NextResponse.json(
          { success: false, message: "You can only view your own properties" },
          { status: 403 }
        );
      }
      conditions.push(eq(properties.user_id, userId));
    }

    /* ---------- Filters ---------- */
    const query = (params.get("q") ?? "").trim().slice(0, 100);
    const status = (params.get("status") ?? "").trim();
    const limit = Math.min(positiveInt(params.get("limit"), 10), 100);
    const page = positiveInt(params.get("page"), 1);
    const offset = (page - 1) * limit;

    if (status) {
      const normalizedStatus = normalizePropertyStorageStatus(status);
      conditions.push(
        normalizedStatus === "active"
          ? sql`LOWER(${properties.status}) IN ('active', 'published')`
          : eq(properties.status, normalizedStatus ?? status)
      );
    }

    for (const token of query.split(/\s+/).filter(Boolean).slice(0, 5)) {
      const pattern = `%${token.replace(/[\\%_]/g, "\\$&")}%`;
      conditions.push(
        sql`(
          ${properties.title} LIKE ${pattern}
          OR ${properties.propertyType} LIKE ${pattern}
          OR ${properties.propertyLocation} LIKE ${pattern}
          OR ${properties.form_data} LIKE ${pattern}
          OR ${users.name} LIKE ${pattern}
          OR CAST(${properties.id} AS CHAR) LIKE ${pattern}
          OR CAST(${properties.user_id} AS CHAR) LIKE ${pattern}
        )`
      );
    }

    const where = and(...conditions);

    /* ---------- Count (joined, because the filter references users) ---------- */
    const [count] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(properties)
      .leftJoin(users, eq(users.id, properties.user_id))
      .where(where);
    const total = Number(count?.count ?? 0);

    /* ---------- Rows + owner name ---------- */
    const rows = await db
      .select({
        property: properties,
        userName: users.name,
      })
      .from(properties)
      .leftJoin(users, eq(users.id, properties.user_id))
      .where(where)
      .orderBy(desc(properties.id))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      items: rows.map(({ property, userName }) => ({
        ...serializePropertyStorageRow(property as Record<string, unknown>),
        user_name: userName ?? null,
      })),
      total,
      limit,
      offset,
      page,
      hasMore: offset + rows.length < total,
    });
  } catch (error) {
    console.error("Property search error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch properties",
        details: error instanceof Error ? error.message : "Unknown database error",
      },
      { status: 500 }
    );
  }
}