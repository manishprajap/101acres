import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { eq } from "drizzle-orm";
import {  property_article } from "@/db/schema";

// Update Property
export async function PUT(
  req: NextRequest,
  context: any
) {
  const id = parseInt(context.params.id);
  const body = await req.json();

  try {
    await db
      .update(property_article)
      .set({
    
        image: body.image,
        propertyLocation: body.propertyLocation,
        propertyType: body.propertyType,
        residentialType: body.residentialType,
        propertyFor: body.propertyFor,
     
        country: body.country, 
        state: body.state,     // new
        city: body.city,       // new
   
        description: body.description,
        status: body.status, // maybe you also want to update status here?
      })
      .where(eq(property_article.id, Number(id)));

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
    await db.delete(property_article).where(eq(property_article.id, Number(id)));

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
      .update(property_article)
      .set({
        status: body.status, // "active" or "inactive"
      })
      .where(eq(property_article.id, Number(id)));

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
    const { id } = await context.params; // ✅ Await params
    const propertyId = parseInt(id);
    ///console.log("objectnumericId",propertyId)
  if (isNaN(propertyId)) {
    return NextResponse.json({ error: "Missing property ID" }, { status: 400 });
  }

  try {
    const numericId = Number(propertyId);
      
    if (isNaN(numericId)) {
      return NextResponse.json({ error: "Invalid property ID" }, { status: 400 });
    }

    const property = await db.query.property_article.findFirst({
      where: (property_article, { eq }) => eq(property_article.id, numericId),
    });

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }
///console.log('all data get:',property);
    return NextResponse.json(property, { status: 200 });
  } catch (error) {
    console.error("Error fetching property:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
