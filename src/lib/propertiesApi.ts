// src/lib/propertyForm.ts — shared by app/api/properties/route.ts and app/api/properties/[id]/route.ts
import { NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

import { db } from "@/db/db";
import { properties, plans, userPlans } from "@/db/schema";
import { MAX_FILE_SIZE, MIME_BY_EXT, UPLOAD_DIR, UPLOAD_URL_PREFIX } from "@/lib/uploads";
import { geocodeLocation } from "@/lib/geocode";

/* ============================================================
   FIELD LISTS (camelCase from the form -> snake_case DB column)
============================================================ */

export const TEXT_KEYS = [
  "propertyType", "contactNumber", "contactEmail", "country", "state", "city",
  "locality", "subLocality", "society", "placeId", "formattedAddress",
  "beds", "baths", "balconies", "boundaryWall", "constructionDone", "carpetAreaUnit",
  "propertyOnFloor", "availability", "propertyAge", "possessionBy", "reraId", "availableFrom",
  "entranceWidthUnit", "ceilingHeightUnit", "maintenancePeriod", "securityDepositType",
  "preLeased", "leasedToType", "pgSuitableFor", "pgFoodIncluded", "pgNoticePeriod",
  "locatedInside", "zoneType", "washrooms", "pantry", "furnishing", "youtubeLink", "description",
  "ownership", "propertyFacing", "facingRoadWidthUnit", "openSides", "powerBackup",
  "flooring", "suitableBusinessType",
] as const;

export const DECIMAL_KEYS = [
  "plotArea", "plotLength", "plotBreadth", "carpetArea", "builtUpArea", "superBuiltUpArea",
  "entranceWidth", "ceilingHeight", "expectedPrice", "pricePerSqft", "maintenance",
  "bookingAmount", "securityDeposit", "currentRent", "annualRentIncrease",
  "expectedReturns", "facingRoadWidth",
] as const;

export const INT_KEYS = [
  "countryId", "stateId", "cityId", "areaId",
  "floorsAllowed", "totalFloors", "leaseTenure", "pgTotalBeds",
  "minSeats", "maxSeats", "cabins", "meetingRooms", "coveredParking", "openParking",
] as const;

export const BOOL_KEYS = [
  "taxExcluded", "priceNegotiable", "allInclusive", "hideReturns", "duplex", "sendViaWhatsapp",
] as const;

export const ARR_KEYS = [
  "preferredTenants", "pgSharing", "otherRooms", "amenities", "propertyFeatures",
  "overlooking", "fireSafety", "locatedNear", "locationAdvantages",
] as const;

const LOOKING_TO = ["sell", "rent", "pg"] as const;
const CATEGORIES = ["Residential", "Commercial"] as const;

export const toSnake = (key: string) => key.replace(/[A-Z]/g, (m) => "_" + m.toLowerCase());

/* ============================================================
   SCALAR HELPERS
============================================================ */

export type FormInput = Record<string, unknown>;
export class UploadError extends Error {}

const isBlank = (v: unknown) => v === undefined || v === null || v === "";

export function textValue(v: unknown): string | null {
  if (isBlank(v)) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

export function numberValue(v: unknown): number | null {
  if (isBlank(v)) return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

export function decimalValue(v: unknown): string | null {
  if (isBlank(v)) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n.toString() : null;
}

export function booleanValue(v: unknown): boolean {
  return v === true || v === 1 || v === "1" || v === "true" || v === "yes";
}

export function parsePositiveInt(v: unknown): number | null {
  if (isBlank(v)) return null;
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export function parseStep(v: unknown): number {
  const n = Number(v ?? 1);
  if (!Number.isFinite(n)) return 1;
  return Math.min(Math.max(Math.trunc(n), 1), 5);
}

export function toStringArray(v: unknown): string[] {
  if (isBlank(v)) return [];
  if (Array.isArray(v)) return v.filter((i): i is string => typeof i === "string");
  if (typeof v === "string") {
    try {
      const parsed: unknown = JSON.parse(v);
      if (Array.isArray(parsed)) return parsed.filter((i): i is string => typeof i === "string");
    } catch {
      /* single value */
    }
    return [v];
  }
  return [];
}

export function parseJson(v: unknown): unknown {
  if (typeof v !== "string" || v === "") return v ?? null;
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
}

function validCoord(v: unknown, limit: number): string | null {
  if (isBlank(v)) return null;
  const n = Number(v);
  return Number.isFinite(n) && Math.abs(n) <= limit ? n.toFixed(7) : null;
}

/* ============================================================
   FORM <-> DB ROW
============================================================ */

/** DB row -> API response (parses every JSON column the page reads back) */
export function serializePropertyRow(row: Record<string, unknown>) {
  const out: Record<string, unknown> = { ...row };

  out.latitude = row.latitude != null ? Number(row.latitude) : null;
  out.longitude = row.longitude != null ? Number(row.longitude) : null;

  for (const k of ARR_KEYS) {
    const col = toSnake(k);
    const parsed = parseJson(row[col]);
    out[col] = Array.isArray(parsed) ? parsed : [];
  }

  const photos = parseJson(row.photos);
  out.photos = Array.isArray(photos) ? photos : [];

  const items = parseJson(row.furnishing_items);
  out.furnishing_items = items && typeof items === "object" ? items : {};

  return out;
}

/** Form values -> DB row (snake_case) */
export function buildRow(f: FormInput) {
  const row: Record<string, unknown> = {};

  row.looking_to = LOOKING_TO.find((x) => x === f.lookingTo) ?? null;
  row.property_category = CATEGORIES.find((x) => x === f.propertyCategory) ?? null;

  TEXT_KEYS.forEach((k) => (row[toSnake(k)] = textValue(f[k])));
  DECIMAL_KEYS.forEach((k) => (row[toSnake(k)] = decimalValue(f[k])));
  INT_KEYS.forEach((k) => (row[toSnake(k)] = numberValue(f[k])));
  BOOL_KEYS.forEach((k) => (row[toSnake(k)] = booleanValue(f[k])));
  ARR_KEYS.forEach((k) => {
    const list = toStringArray(f[k]);
    row[toSnake(k)] = list.length > 0 ? JSON.stringify(list) : null;
  });

  const items = f.furnishingItems;
  row.furnishing_items =
    items && typeof items === "object" && Object.keys(items as object).length > 0
      ? JSON.stringify(items)
      : null;

  if (!row.carpet_area_unit) row.carpet_area_unit = "sq.ft.";
  if (!row.entrance_width_unit) row.entrance_width_unit = "ft.";
  if (!row.ceiling_height_unit) row.ceiling_height_unit = "ft.";
  if (!row.facing_road_width_unit) row.facing_road_width_unit = "Feet";

  return row;
}

/** Google coordinates from the form first; then saved ones; then geocode by city */
export async function resolveCoords(
  input: FormInput,
  existing?: { latitude: string | null; longitude: string | null; geocoded_address: string | null }
) {
  let latitude = validCoord(input.latitude, 90);
  let longitude = validCoord(input.longitude, 180);

  if (latitude !== null && longitude !== null) {
    return {
      latitude,
      longitude,
      geocodedAddress: textValue(input.formattedAddress) ?? textValue(input.city),
      status: "client" as const,
    };
  }

  latitude = existing?.latitude ?? null;
  longitude = existing?.longitude ?? null;
  let geocodedAddress = existing?.geocoded_address ?? null;
  let status: "reused" | "generated" | "failed" | "no_city" = latitude && longitude ? "reused" : "no_city";

  const city = textValue(input.city);
  if (city && !(latitude && longitude)) {
    const coords = await geocodeLocation(input as never);
    if (coords) {
      latitude = coords.lat.toFixed(7);
      longitude = coords.lng.toFixed(7);
      geocodedAddress = city;
      status = "generated";
    } else {
      status = "failed";
    }
  }

  return { latitude, longitude, geocodedAddress, status };
}

/* ============================================================
   PLAN CHECK (only when a listing is being published)
============================================================ */

export async function checkPublishPlan(userId: number) {
  try {
    const active = await db
      .select({ userPlan: userPlans, plan: plans })
      .from(userPlans)
      .leftJoin(plans, eq(userPlans.plan_id, plans.id))
      .where(eq(userPlans.user_id, userId))
      .orderBy(desc(userPlans.expiry_date))
      .limit(1);

    if (active.length === 0) return null;
    const { plan, userPlan } = active[0];

    if (userPlan?.expiry_date && new Date(userPlan.expiry_date).getTime() < Date.now()) {
      return { status: 403, body: { success: false, error: "Your subscription has expired", code: "PLAN_EXPIRED" } };
    }

    const listingLimit = Number(plan?.listingLimit ?? 0);
    if (Number.isFinite(listingLimit) && listingLimit > 0) {
      const count = await db
        .select({ count: sql<number>`count(*)` })
        .from(properties)
        .where(and(eq(properties.user_id, userId), eq(properties.status, "published")));
      const usedListings = Number(count[0]?.count ?? 0);

      if (usedListings >= listingLimit) {
        return {
          status: 403,
          body: {
            success: false,
            error: "Your property listing limit has been reached",
            code: "LISTING_LIMIT_REACHED",
            listingLimit,
            usedListings,
          },
        };
      }
    }
  } catch (error) {
    console.error("Property plan check error:", error);
  }
  return null;
}

/* ============================================================
   IMAGES
============================================================ */

const extOf = (file: File) => file.name.split(".").pop()?.toLowerCase() || "";

export function validateImages(files: File[]) {
  for (const file of files) {
    if (!MIME_BY_EXT[extOf(file)]) {
      throw new UploadError(
        `"${file.name}" is not a supported image format. Allowed: ${Object.keys(MIME_BY_EXT).join(", ")}`
      );
    }
    if (file.type && !file.type.startsWith("image/")) throw new UploadError(`"${file.name}" is not an image file`);
    if (file.size > MAX_FILE_SIZE) throw new UploadError(`Image "${file.name}" exceeds maximum allowed size of 10MB`);
  }
}

export async function removeFiles(paths: string[]) {
  await Promise.all(paths.map((p) => unlink(p).catch(() => undefined)));
}

export async function saveImages(files: File[]) {
  const urls: string[] = [];
  const paths: string[] = [];
  if (files.length === 0) return { urls, paths };

  await mkdir(UPLOAD_DIR, { recursive: true });
  try {
    for (const file of files) {
      const filename = `${randomUUID()}.${extOf(file)}`;
      const filepath = path.join(UPLOAD_DIR, filename);
      await writeFile(filepath, Buffer.from(await file.arrayBuffer()));
      paths.push(filepath);
      urls.push(`${UPLOAD_URL_PREFIX}/${filename}`);
    }
  } catch (error) {
    await removeFiles(paths);
    throw error;
  }
  return { urls, paths };
}

/** stored photo url/name -> absolute path inside UPLOAD_DIR (never outside it) */
export const photoDiskPath = (photo: string) => path.join(UPLOAD_DIR, path.basename(photo));
export const photoBase = (photo: string) => path.basename(photo);

/* ============================================================
   CORS
============================================================ */

export function corsHeaders(origin: string | null): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  };
}

export const makeJson = (origin: string | null) => (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: corsHeaders(origin) });