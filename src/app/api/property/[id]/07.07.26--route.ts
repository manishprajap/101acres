///src/app/api/property/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { eq } from "drizzle-orm";
import { properties } from "@/db/schema";

// Update Property
export async function PUT(
  req: NextRequest,
  context: any
) {
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

  priceFor: body.priceFor ?? null, // ✅ will work now

  country: body.country ? Number(body.country) : null,
  state: body.state ? Number(body.state) : null,
  city: body.city ? Number(body.city) : null,

  googleLocation: body.googleLocation ?? null,
  landmark: body.landmark ?? null,
  address: body.address ?? null,

  status: body.status ?? null,
})
      .where(eq(properties.id, Number(id)));

    return NextResponse.json({ success: true, message: "Property updated successfully." });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update property" }, { status: 500 });
  }
}

// Delete Property
export async function DELETE(
  req: NextRequest,
  context: any
) {
  const id = parseInt(context.params.id);

  try {
    await db.delete(properties).where(eq(properties.id, Number(id)));

    return NextResponse.json({ success: true, message: "Property deleted successfully." });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete property" }, { status: 500 });
  }
}

// Change Status (Active/Inactive)
export async function PATCH(
  req: NextRequest,
  context: any
) {
  const id = parseInt(context.params.id);
  const body = await req.json();

  try {
    await db
      .update(properties)
      .set({
        status: body.status, // "active" or "inactive"
      })
      .where(eq(properties.id, Number(id)));

    return NextResponse.json({ success: true, message: "Property status updated successfully." });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to change status" }, { status: 500 });
  }
}


// GET /api/properties/:id
export async function GET(
  req: NextRequest,
  context: any
) {
  const id = parseInt(context.params.id);

  if (isNaN(id)) {
    return NextResponse.json({ error: "Missing property ID" }, { status: 400 });
  }

  try {
    const numericId = Number(id);

    if (isNaN(numericId)) {
      return NextResponse.json({ error: "Invalid property ID" }, { status: 400 });
    }

    const property = await db.query.properties.findFirst({
      where: (properties, { eq }) => eq(properties.id, numericId),
    });

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    return NextResponse.json(property, { status: 200 });
  } catch (error) {
    console.error("Error fetching property:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
