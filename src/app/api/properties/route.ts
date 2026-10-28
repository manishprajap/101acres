// src/app/api/properties/route.ts  — matches src/app/dashboard/add-property/page.tsx
import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, sql, type SQL } from "drizzle-orm";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

import { db, pool } from "@/db/db";
import { propertyFormProperties as properties } from "@/db/schema";
import { corsHeaders } from "@/lib/cors";
import { MAX_FILE_SIZE, MAX_PHOTOS, MIME_BY_EXT, UPLOAD_DIR, UPLOAD_URL_PREFIX } from "@/lib/uploads";
import { geocodeLocation } from "@/lib/geocode";
import { notifyNewProperty } from "@/lib/notifyNewProperty";
import { persistPropertyStorageRow } from "@/lib/propertyStoragePersistence";
import { canViewAll, getRequester } from "@/lib/requester";
import { splitContactValue, storedPhone } from "@/lib/contactSplit";
import { loadPosterInfo, resolveCityName } from "@/lib/posterInfo";
import {
  buildPropertyStorageRow,
  normalizePropertyStorageStatus,
  parsePropertyFormData,
  serializePropertyStorageRow,
} from "@/lib/propertyFormStorage";

export const dynamic = "force-dynamic";

class UploadError extends Error {}

type FormInput = Record<string, unknown>;

interface CreateBody {
  formData?: FormInput;
  step?: number | string;
  currentStep?: number | string;
  current_step?: number | string;
  status?: "draft" | "active" | "published";
  userId?: number | string | null;
  propertyId?: number | string | null;
}

const isBlank = (v: unknown) => v === undefined || v === null || v === "";

function textValue(v: unknown): string | null {
  if (isBlank(v)) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function parsePositiveInt(v: unknown): number | null {
  if (isBlank(v)) return null;
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function parseStep(v: unknown): number {
  const n = Number(v ?? 1);
  if (!Number.isFinite(n)) return 1;
  return Math.min(Math.max(Math.trunc(n), 1), 5);
}

function toStringArray(v: unknown): string[] {
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

function validCoord(v: unknown, limit: number): string | null {
  if (isBlank(v)) return null;
  const n = Number(v);
  return Number.isFinite(n) && Math.abs(n) <= limit ? n.toFixed(7) : null;
}

/** Login user's name from the users table. Returns null when missing / empty. */
async function getUserName(userId: number): Promise<string | null> {
  try {
    const [rows] = await pool.query("SELECT `name` FROM `users` WHERE `id` = ? LIMIT 1", [userId]);
    const found = (rows as { name?: string | null }[])[0]?.name;
    const name = found ? String(found).trim() : "";
    return name ? name.slice(0, 100) : null;
  } catch (error) {
    console.error("[properties] user name lookup failed:", error);
    return null;
  }
}

/* ============================================================
   NUMERIC COLUMNS — MySQL rejects '' in decimal/int columns
============================================================ */

const NUMERIC_KEYS = [
  // decimal columns
  "carpet_area", "carpetArea",
  "built_up_area", "builtUpArea",
  "super_built_up_area", "superBuiltUpArea",
  // int columns
  "area",
  "amount",
  "price",
  "square_ft", "squareFt",
  "total_floors", "totalFloors",
  "beds", "bedrooms",
  "baths", "bathrooms",
  "covered_parking", "coveredParking",
  "open_parking", "openParking",
  "open_sides", "openSides",
  "road_width", "roadWidth",
];

/** Returns a copy where blank/whitespace/non-numeric values of numeric columns become null. */
function blankToNull(data: FormInput): FormInput {
  const out: FormInput = { ...data };
  for (const key of NUMERIC_KEYS) {
    if (!(key in out)) continue;
    const v = out[key];
    if (v === null || v === undefined) continue;
    if (typeof v === "number") {
      if (!Number.isFinite(v)) out[key] = null;
      continue;
    }
    if (typeof v === "string") {
      const s = v.trim().replace(/,/g, "");
      out[key] = s !== "" && Number.isFinite(Number(s)) ? s : null;
    }
  }
  return out;
}

/* ============================================================
   IMAGES
============================================================ */

const extOf = (file: File) => file.name.split(".").pop()?.toLowerCase() || "";

function validateImages(files: File[]) {
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

async function removeFiles(paths: string[]) {
  await Promise.all(paths.map((p) => unlink(p).catch(() => undefined)));
}

async function saveImages(files: File[]) {
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

/* ============================================================
   OPTIONS  (CORS comes from the shared @/lib/cors helper)
============================================================ */

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get("origin")) });
}

/* ============================================================
   POST /api/properties  (create, or update when propertyId is sent)
   No plan required: any user can add / publish properties.
============================================================ */

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const json = (body: unknown, status = 200) =>
    NextResponse.json(body, { status, headers: corsHeaders(origin) });

  let savedPaths: string[] = [];

  try {
    let body: CreateBody;
    let pendingImageFiles: File[] = [];

    if ((request.headers.get("content-type") || "").includes("multipart/form-data")) {
      const form = await request.formData();

      pendingImageFiles = form
        .getAll("images")
        .filter((i): i is File => i instanceof File)
        .filter((f) => f.size > 0);

      const str = (k: string) => {
        const v = form.get(k);
        return typeof v === "string" ? v : undefined;
      };

      let nested: unknown;
      try {
        nested = JSON.parse(str("formData") ?? "{}");
      } catch {
        return json({ success: false, error: "Invalid formData JSON" }, 400);
      }

      const requestedStatus = str("status");
      body = {
        userId: str("userId"),
        propertyId: str("propertyId"),
        step: str("step") ?? str("currentStep") ?? str("current_step"),
        currentStep: str("currentStep") ?? str("current_step") ?? str("step"),
        current_step: str("current_step") ?? str("currentStep") ?? str("step"),
        status:
          requestedStatus === "draft"
            ? "draft"
            : requestedStatus === "active" || requestedStatus === "published"
              ? "active"
              : undefined,
        formData: nested && typeof nested === "object" && !Array.isArray(nested) ? (nested as FormInput) : {},
      };

      // photos already saved on the server (sent as JSON string)
      if (body.formData && str("photos") !== undefined) body.formData.photos = str("photos");
    } else {
      try {
        body = (await request.json()) as CreateBody;
      } catch {
        return json({ success: false, error: "Invalid JSON body" }, 400);
      }
    }

    /* Who is saving? A valid Bearer token wins; otherwise the userId sent by the form. */
    const requester = await getRequester(request, body.userId);
    const userId = requester.userId;
    if (userId === null) return json({ success: false, error: "Valid numeric userId or login token is required" }, 400);

    const propertyId = parsePositiveInt(body.propertyId);
    const input: FormInput = body.formData ?? {};
    const step = parseStep(body.step ?? body.currentStep ?? body.current_step);

    /* ---- existing property (owner only) ---- */
    let existing: typeof properties.$inferSelect | undefined;

    if (propertyId !== null) {
      const rows = await db
        .select()
        .from(properties)
        .where(and(eq(properties.id, propertyId), eq(properties.user_id, userId)))
        .limit(1);
      existing = rows[0];
      if (!existing) {
        return json({ success: false, error: "Property not found or does not belong to this user" }, 404);
      }
    }
    const existingFormData = parsePropertyFormData(existing?.form_data);

    const status =
      normalizePropertyStorageStatus(body.status) ??
      normalizePropertyStorageStatus(existing?.status) ??
      (existing ? "draft" : "active");

    // true for a brand new active listing AND for a draft that is being published now
    // (only used to decide whether to send the push notification)
    const isPublishing =
      status === "active" &&
      normalizePropertyStorageStatus(existing?.status) !== "active";

    /* ---- coordinates: Google values from the form first, city geocode as fallback ---- */
    let latitude: string | null = validCoord(input.latitude, 90);
    let longitude: string | null = validCoord(input.longitude, 180);
    let geocodedAddress: string | null = textValue(input.formattedAddress) ?? textValue(input.city);
    let geocodeStatus: "client" | "reused" | "generated" | "failed" | "no_city" = "client";

    if (latitude === null || longitude === null) {
      latitude = validCoord(existingFormData.latitude, 90);
      longitude = validCoord(existingFormData.longitude, 180);
      geocodedAddress =
        textValue(existingFormData.geocodedAddress) ??
        textValue(existingFormData.formattedAddress);
      geocodeStatus = latitude && longitude ? "reused" : "no_city";

      const city = textValue(input.city) ?? textValue(existingFormData.city);
      if (city && !(latitude && longitude)) {
        const coords = await geocodeLocation({ ...existingFormData, ...input, city } as never);
        if (coords) {
          latitude = coords.lat.toFixed(7);
          longitude = coords.lng.toFixed(7);
          geocodedAddress = city;
          geocodeStatus = "generated";
        } else {
          geocodeStatus = "failed";
        }
      }
    }

    /* ---- images ---- */
    const existingPhotos = toStringArray(input.photos ?? existingFormData.photos);
    if (existingPhotos.length + pendingImageFiles.length > MAX_PHOTOS) {
      return json({ success: false, error: `Maximum ${MAX_PHOTOS} photos allowed` }, 400);
    }

    validateImages(pendingImageFiles);
    const saved = await saveImages(pendingImageFiles);
    savedPaths = saved.paths;

    const allPhotos = [...existingPhotos, ...saved.urls];

    /* ---- row ---- */
    const savedFormData: FormInput = {
      ...existingFormData,
      ...input,
      step,
      status,
      photos: allPhotos,
      latitude,
      longitude,
      geocodedAddress,
    };

    // Blank numeric fields ('' from empty inputs) must be NULL for decimal/int columns.
    // Use the cleaned copy for BOTH the row builder and the persistence call.
    const cleanFormData = blankToNull(savedFormData);

    // The row builder can fill MISSING numeric fields with '' (e.g. carpet_area on step 1,
    // when the form never sent carpetArea), so sanitize the built row (snake_case keys) as well.
    type StorageRow = ReturnType<typeof buildPropertyStorageRow>;
    const rowData = blankToNull(
      buildPropertyStorageRow(userId, status, cleanFormData) as unknown as FormInput
    ) as unknown as StorageRow;

    /* ---- contact ----
       mobile  -> contact_number (+91...), empty => NULL
       email   -> contact_email
       name    -> login user's name from the users table, missing => NULL
                  (a phone number / email is never saved as the name) */
    const rawContactNumber = textValue(cleanFormData.contactNumber);
    const contact: { phone?: string | null; email?: string | null } = rawContactNumber
      ? splitContactValue(rawContactNumber)
      : { phone: null, email: null };
    const explicitEmail = textValue(cleanFormData.contactEmail) ?? "";
    const row = rowData as unknown as Record<string, unknown>;

    row.contact_number = contact.phone ? storedPhone(contact.phone) : null; // column must allow NULL
    row.contact_email = contact.email || explicitEmail || null;
    row.contact_name = await getUserName(userId);

    const finalId = await persistPropertyStorageRow(rowData, cleanFormData, existing?.id);

    const savedRows = await db.select().from(properties).where(eq(properties.id, finalId)).limit(1);
    const property = savedRows[0];
    if (!property) return json({ success: false, error: "Property was saved but could not be retrieved" }, 500);

    const serializedProperty = serializePropertyStorageRow(property as Record<string, unknown>);

    /* ---- push notification: only when the property goes live (new active listing or draft -> active) ----
       Fire and forget: the response must not wait for Firebase. Edits of an already active
       property never reach this block, so nobody is notified twice. */
    if (isPublishing) {
      const savedValues = serializedProperty as unknown as Record<string, unknown>;
      const cityText = textValue(cleanFormData.city) ?? textValue(savedValues.city);

      void notifyNewProperty({
        propertyId: finalId,
        title: textValue(cleanFormData.title) ?? textValue(savedValues.title) ?? undefined,
        // the city column can hold a numeric id, never show that in a notification
        city: cityText && !/^\d+$/.test(cityText) ? cityText : undefined,
        price: textValue(cleanFormData.price) ?? textValue(savedValues.price) ?? undefined,
        ownerId: userId,
      }).catch((pushError) => console.error("[properties] new property push failed:", pushError));
    }

    return json(
      {
        success: true,
        message: "Property saved successfully",
        id: finalId,
        property: serializedProperty,
        status,
        currentStep: step,
        geocode: { status: geocodeStatus },
        uploadedImages: saved.urls,
      },
      existing ? 200 : 201
    );
  } catch (error) {
    await removeFiles(savedPaths);

    if (error instanceof UploadError) return json({ success: false, error: error.message }, 400);

    console.error("POST /api/properties error:", error);
    return json(
      {
        success: false,
        error: "Failed to save property",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
}

/* ============================================================
   GET /api/properties
   - no userId / no token -> public published/active listings
   - login (token/userId) -> that user's properties
   - scope=all (admin)    -> every user's properties (all statuses unless ?status= is given)

   Every item also carries:
     poster_role -> users.role of the person who added it (agent / user / dealer / builder)
     city_name   -> real city name (the city column only stores an id)
============================================================ */

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");
  const json = (body: unknown, status = 200) =>
    NextResponse.json(body, { status, headers: corsHeaders(origin) });

  try {
    const sp = new URL(request.url).searchParams;

    const statusParam = sp.get("status");
    const city = sp.get("city");
    const locality = sp.get("locality");
    const propertyType = sp.get("propertyType");
    const userIdParam = sp.get("userId");

    const requester = await getRequester(request, userIdParam);

    const wantsAll = sp.get("scope") === "all";
    if (wantsAll && !canViewAll(requester)) {
      return json({ success: false, error: "Only admin can view all properties" }, 403);
    }

    // A verified token always decides whose properties are returned; ?userId= is only a legacy fallback.
    const userId = requester.verified ? requester.userId : parsePositiveInt(userIdParam);

    // admin scope=all shows every status by default; public/user default stays published+active
    const status = statusParam ?? (wantsAll ? "all" : null);

    const limitValue = Number(sp.get("limit"));
    const offsetValue = Number(sp.get("offset"));
    const limit = Number.isFinite(limitValue) && limitValue > 0 ? Math.min(Math.trunc(limitValue), 100) : 20;
    const offset = Number.isFinite(offsetValue) && offsetValue >= 0 ? Math.trunc(offsetValue) : 0;

    const conditions: SQL[] = [sql`COALESCE(${properties.isDeleted}, false) = false`];

    if (status === "published") {
      conditions.push(sql`LOWER(${properties.status}) IN ('published', 'active')`);
    } else if (status && status !== "all") {
      const normalizedStatus = normalizePropertyStorageStatus(status);
      conditions.push(
        normalizedStatus === "active"
          ? sql`LOWER(${properties.status}) IN ('published', 'active')`
          : eq(properties.status, normalizedStatus ?? status)
      );
    } else if (status !== "all") {
      conditions.push(sql`LOWER(${properties.status}) IN ('published', 'active')`);
    }

    if (city) {
      conditions.push(sql`JSON_UNQUOTE(JSON_EXTRACT(${properties.form_data}, '$.city')) = ${city}`);
    }
    if (locality) {
      conditions.push(sql`JSON_UNQUOTE(JSON_EXTRACT(${properties.form_data}, '$.locality')) = ${locality}`);
    }
    if (propertyType) conditions.push(eq(properties.propertyType, propertyType));

    if (!wantsAll) {
      if (userId !== null) conditions.push(eq(properties.user_id, userId));
      else if (userIdParam) return json({ success: false, error: "userId must be a valid integer" }, 400);
    }

    const where = and(...conditions);

    const rows = await db.select().from(properties).where(where).orderBy(desc(properties.id)).limit(limit).offset(offset);
    const countRows = await db.select({ count: sql<number>`count(*)` }).from(properties).where(where);
    const total = Number(countRows[0]?.count ?? 0);

    const rawRows = rows as unknown as Record<string, unknown>[];
    const serializedRows = rawRows.map(
      (r) => serializePropertyStorageRow(r) as unknown as Record<string, unknown>
    );

    // One batched lookup for all poster roles and city names (no N+1 queries).
    const info = await loadPosterInfo(
      rawRows.map((r) => r.user_id),
      rawRows.flatMap((r, i) => [r.city, serializedRows[i].city, serializedRows[i].cityId])
    );

    const items = serializedRows.map((item, i) => {
      const raw = rawRows[i];
      return {
        ...item,
        poster_role: info.roles.get(Number(raw.user_id)) || null,
        city_name: resolveCityName(info, item.cityName, item.city, item.cityId, raw.city),
      };
    });

    return json({
      success: true,
      items,
      total,
      limit,
      offset,
      hasMore: offset + rows.length < total,
    });
  } catch (error) {
    console.error("GET /api/properties error:", error);
    return json(
      {
        success: false,
        error: "Failed to fetch properties",
        details: error instanceof Error ? error.message : "Unknown database error",
      },
      500
    );
  }
}