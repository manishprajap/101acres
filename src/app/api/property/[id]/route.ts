///src/app/api/property/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { eq } from "drizzle-orm";
import { properties, area } from "@/db/schema"; // ✅ "area" hi export ka naam hai
import { corsHeaders } from "@/lib/cors";
import { sendBulkNotification } from "@/lib/sendBulkNotification";

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

export async function PUT(req: NextRequest, context: any) {
  const origin = req.headers.get("origin");
  const id = parseInt(context.params.id);
  const body = await req.json();
  try {
    await db
      .update(properties)
      .set({
        title: body.title ?? null,
        squareFt: body.squareFt ? Number(body.squareFt) : null,
        beds: body.beds ? Number(body.beds) : null,
        baths: body.baths ? Number(body.baths) : null,
        price: body.price ? body.price.toString() : null,
        image: body.image ?? null,
        propertyLocation: body.propertyLocation ?? null,
        propertyType: body.propertyType ?? null,
        residentialType: body.residentialType ?? null,
        propertyFor: body.propertyFor ?? null,
        priceFor: body.priceFor ?? null,
        country: body.country ? Number(body.country) : null,
        state: body.state ? Number(body.state) : null,
        city: body.city ? Number(body.city) : null,
        googleLocation: body.googleLocation ?? null,
        landmark: body.landmark ?? null,
        address: body.address ?? null,
        status: body.status ?? null,
      })
      .where(eq(properties.id, Number(id)));

    return NextResponse.json(
      { success: true, message: "Property updated successfully." },
      { headers: corsHeaders(origin) }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update property" },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}

export async function DELETE(req: NextRequest, context: any) {
  const origin = req.headers.get("origin");
  const id = parseInt(context.params.id);
  try {
    await db.delete(properties).where(eq(properties.id, Number(id)));
    return NextResponse.json(
      { success: true, message: "Property deleted successfully." },
      { headers: corsHeaders(origin) }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete property" },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}

// Change Status (Active/Inactive) — Approve happens here
export async function PATCH(req: NextRequest, context: any) {
  const origin = req.headers.get("origin");
  const id = parseInt(context.params.id);
  const body = await req.json();

  try {
    const existing = await db.query.properties.findFirst({
      where: (properties, { eq }) => eq(properties.id, Number(id)),
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404, headers: corsHeaders(origin) }
      );
    }

    const previousStatus = (existing.status || "").toLowerCase();
    const newStatus = (body.status || "").toLowerCase();

    console.log(`🔄 Property ${id} status: "${previousStatus}" → "${newStatus}"`);

    await db
      .update(properties)
      .set({
        status: body.status,
      })
      .where(eq(properties.id, Number(id)));

    const isNewApproval = previousStatus !== "active" && newStatus === "active";
    console.log(`🔔 isNewApproval: ${isNewApproval}`);

    if (isNewApproval) {
      try {
        let imagePaths: string[] = [];
        try {
          imagePaths = existing.image ? JSON.parse(existing.image) : [];
        } catch {
          imagePaths = [];
        }

        const imageUrl =
          imagePaths.length > 0
            ? `https://101acres.com/uploads/${imagePaths[0]}`
            : undefined;

        // ✅ Area ka naam fetch karo (agar area ID set hai)
        let areaName = "";
        if (existing.area) {
          const areaResult = await db.query.area.findFirst({
            where: (area, { eq }) => eq(area.id, existing.area as number),
          });
          areaName = areaResult?.name || "";
        }

        // Fallback agar area name na mile — landmark ya property location use karo
        const locationText =
          areaName || existing.landmark || existing.propertyLocation || "";

        const messageBody = locationText
          ? `${existing.title} new add this area, ${locationText}`
          : `${existing.title} new add this area`;

        const result = await sendBulkNotification({
          title: "New Property Listed! 🏡",
          body: messageBody,
          data: {
            propertyId: String(existing.id),
            type: "new_property",
          },
          imageUrl,
        });

        console.log("🔔 Notification result:", result);
      } catch (notifyErr) {
        console.error("Bulk notification error:", notifyErr);
      }
    }

    return NextResponse.json(
      { success: true, message: "Property status updated successfully." },
      { headers: corsHeaders(origin) }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to change status" },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}

// GET /api/properties/:id
export async function GET(req: NextRequest, context: any) {
  const origin = req.headers.get("origin");
  const id = parseInt(context.params.id);

  if (isNaN(id)) {
    return NextResponse.json(
      { error: "Missing property ID" },
      { status: 400, headers: corsHeaders(origin) }
    );
  }

  try {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      return NextResponse.json(
        { error: "Invalid property ID" },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    const property = await db.query.properties.findFirst({
      where: (properties, { eq }) => eq(properties.id, numericId),
    });

    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404, headers: corsHeaders(origin) }
      );
    }

    return NextResponse.json(property, { status: 200, headers: corsHeaders(origin) });
  } catch (error) {
    console.error("Error fetching property:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}