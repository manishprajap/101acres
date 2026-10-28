// app/api/property-detail/[id]/route.ts

import { NextResponse } from "next/server";

import { eq } from "drizzle-orm";
import { propertyFormProperties as properties } from "@/db/schema";
import { db } from "../../../../db/db";
import { parsePropertyFormData } from "@/lib/propertyFormStorage";

/* ============================================================
   Types
============================================================ */

/* ============================================================
   Helpers
============================================================ */

/**
 * Parse photos from the `photos` LONGTEXT column.
 *
 * Expected examples:
 *
 * ["image1.jpg","image2.jpg"]
 *
 * or
 *
 * [{"url":"image1.jpg"}]
 *
 * or a single image URL.
 */
function parsePhotos(value: string | null | undefined): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);

    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => {
          if (typeof item === "string") {
            return item;
          }

          if (
            typeof item === "object" &&
            item !== null &&
            "url" in item &&
            typeof item.url === "string"
          ) {
            return item.url;
          }

          if (
            typeof item === "object" &&
            item !== null &&
            "image" in item &&
            typeof item.image === "string"
          ) {
            return item.image;
          }

          return null;
        })
        .filter(
          (item): item is string =>
            typeof item === "string" && item.trim().length > 0
        );
    }

    if (typeof parsed === "string" && parsed.trim()) {
      return [parsed];
    }

    return [];
  } catch {
    // If the DB contains a plain URL/string instead of JSON
    if (value.trim()) {
      return [value.trim()];
    }

    return [];
  }
}

/**
 * Convert decimal DB values into numbers where possible.
 *
 * MySQL DECIMAL values are commonly returned as strings.
 */
function parseDecimal(
  value: string | number | null | undefined
): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

/* ============================================================
   GET
============================================================ */

export async function GET(
  _request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    /* --------------------------------------------------------
       Resolve route params
    -------------------------------------------------------- */

    const params = await context.params;

    const id = Number(params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid property ID",
        },
        { status: 400 }
      );
    }

    /* --------------------------------------------------------
       Fetch property
    -------------------------------------------------------- */

    const result = await db
      .select()
      .from(properties)
      .where(eq(properties.id, id))
      .limit(1);

    /* --------------------------------------------------------
       Property not found
    -------------------------------------------------------- */

    if (result.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Property not found",
        },
        { status: 404 }
      );
    }

    const row = result[0];
    const formData = parsePropertyFormData(row.form_data);
    const photos = parsePhotos(
      Array.isArray(formData.photos)
        ? JSON.stringify(formData.photos)
        : typeof row.image === "string"
          ? row.image
          : null
    );
    const property = {
      ...formData,
      id: row.id,
      userId: row.user_id,
      status: row.status,
      currentStep: Number(formData.step ?? formData.currentStep ?? 1),
      lookingTo: formData.lookingTo ?? row.propertyFor,
      propertyCategory: formData.propertyCategory ?? row.residentialType,
      propertyType: formData.propertyType ?? row.propertyType,
      city: formData.city ?? row.city,
      locality: formData.locality ?? null,
      subLocality: formData.subLocality ?? row.landmark,
      mallName: formData.society ?? null,
      carpetArea:
        parseDecimal(String(formData.carpetArea ?? row.squareFt ?? "")) ??
        parseDecimal(String(formData.plotArea ?? "")),
      carpetAreaUnit: formData.carpetAreaUnit ?? row.priceFor,
      totalFloors: formData.totalFloors ?? null,
      propertyOnFloor: formData.propertyOnFloor ?? null,
      availability: formData.availability ?? null,
      expectedPrice: parseDecimal(
        String(formData.expectedPrice ?? row.price ?? "")
      ),
      taxExcluded: formData.taxExcluded ?? false,
      priceNegotiable: formData.priceNegotiable ?? false,
      maintenance: parseDecimal(String(formData.maintenance ?? "")),
      bookingAmount: parseDecimal(String(formData.bookingAmount ?? "")),
      description: formData.description ?? null,
      youtubeLink: formData.youtubeLink ?? null,
      ownership: formData.ownership ?? null,
      propertyFacing: formData.propertyFacing ?? formData.facing ?? null,
      facingRoadWidth: parseDecimal(
        String(formData.facingRoadWidth ?? formData.roadWidth ?? "")
      ),
      photos,
      amenities: formData.amenities ?? null,
      propertyFeatures: formData.propertyFeatures ?? null,
      fireSafety: formData.fireSafety ?? null,
      locatedNear: formData.locatedNear ?? null,
      locationAdvantages: formData.locationAdvantages ?? null,
      createdAt: row.createdAt,
    };

    /* --------------------------------------------------------
       Return formatted property
    -------------------------------------------------------- */

    return NextResponse.json(
      {
        success: true,

        property,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("GET /api/property-detail/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}