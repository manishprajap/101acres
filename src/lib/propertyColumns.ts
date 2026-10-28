// src/lib/propertyColumns.ts
// Single source of truth used by BOTH:
//   - src/app/api/properties/route.ts
//   - src/app/api/properties/[id]/route.ts
// Maps PropertyFormData keys -> MySQL (Drizzle) columns + value types.
// Server-only (uses fs). Do not import from client components.

import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import type { NextRequest } from "next/server";


/* ============================================================
   CONFIG
============================================================ */

// process.cwd() = D:\101acres1  ->  D:\101acres1\uploads
export const uploadsDir = path.join(process.cwd(), "uploads");

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

/* ============================================================
   COLUMN MAP
============================================================ */

export type DbColumn = string;

/**
 * text    -> varchar / text            (empty string -> NULL)
 * decimal -> decimal(...)              (Drizzle expects a STRING)
 * int     -> smallint / int            (number)
 * boolean -> tinyint(1)
 * list    -> LONGTEXT holding a JSON array string
 * photos  -> LONGTEXT JSON array of saved filenames (handled by mergePhotos)
 */
export type ColumnType =
  | "text"
  | "decimal"
  | "int"
  | "boolean"
  | "list"
  | "photos";

export interface ColumnDef {
  column: DbColumn;
  type: ColumnType;
}

export const COLUMN_MAP: Record<string, ColumnDef> = {
  // Step 1
  lookingTo: { column: "looking_to", type: "text" },
  propertyCategory: { column: "property_category", type: "text" },
  propertyType: { column: "property_type", type: "text" },
  retailSpaceType: { column: "retail_space_type", type: "text" },
  locatedInside: { column: "located_inside", type: "text" },

  // Step 2
  city: { column: "city", type: "text" },
  locality: { column: "locality", type: "text" },
  subLocality: { column: "sub_locality", type: "text" },
  mallName: { column: "mall_name", type: "text" },

  // Step 3
  carpetArea: { column: "carpet_area", type: "decimal" },
  carpetAreaUnit: { column: "carpet_area_unit", type: "text" },
  washroom: { column: "washroom", type: "text" },
  totalFloors: { column: "total_floors", type: "int" },
  propertyOnFloor: { column: "property_on_floor", type: "text" },
  parking: { column: "parking", type: "text" },
  availability: { column: "availability", type: "text" },
  propertyAge: { column: "property_age", type: "text" },
  entranceWidth: { column: "entrance_width", type: "decimal" },
  entranceWidthUnit: { column: "entrance_width_unit", type: "text" },
  ceilingHeight: { column: "ceiling_height", type: "decimal" },
  ceilingHeightUnit: { column: "ceiling_height_unit", type: "text" },
  expectedPrice: { column: "expected_price", type: "decimal" },
  pricePerSqft: { column: "price_per_sqft", type: "decimal" },
  taxExcluded: { column: "tax_excluded", type: "boolean" },
  priceNegotiable: { column: "price_negotiable", type: "boolean" },
  maintenance: { column: "maintenance", type: "decimal" },
  bookingAmount: { column: "booking_amount", type: "decimal" },
  preLeased: { column: "pre_leased", type: "text" }, // "Yes" | "No"
  currentRent: { column: "current_rent", type: "decimal" },
  leaseTenure: { column: "lease_tenure", type: "int" },
  annualRentIncrease: { column: "annual_rent_increase", type: "decimal" },
  leasedToType: { column: "leased_to_type", type: "text" },
  expectedReturns: { column: "expected_returns", type: "decimal" },
  hideReturns: { column: "hide_returns", type: "boolean" },

  // Step 4
  youtubeLink: { column: "youtube_link", type: "text" },
  photos: { column: "photos", type: "photos" },
  description: { column: "description", type: "text" },

  // Step 5
  amenities: { column: "amenities", type: "list" },
  propertyFeatures: { column: "property_features", type: "list" },
  societyFeatures: { column: "society_features", type: "list" },
  additionalFeatures: { column: "additional_features", type: "list" },
  mainRoadFacing: { column: "main_road_facing", type: "boolean" },
  cornerProperty: { column: "corner_property", type: "boolean" },
  fireSafety: { column: "fire_safety", type: "list" },
  ownership: { column: "ownership", type: "text" },
  propertyFacing: { column: "property_facing", type: "text" },
  facingRoadWidth: { column: "facing_road_width", type: "decimal" },
  facingRoadWidthUnit: { column: "facing_road_width_unit", type: "text" },
  locatedNear: { column: "located_near", type: "list" },
  suitableBusinessType: { column: "suitable_business_type", type: "text" },
  locationAdvantages: { column: "location_advantages", type: "list" },
  latitude: {
    column: "latitude",
    type: "decimal",
  },

  longitude: {
    column: "longitude",
    type: "decimal",
  },

  geocoded_address: {
    column: "geocoded_address",
    type: "text",
  },
};

/** LONGTEXT columns that hold JSON arrays (parsed in API responses). */
export const JSON_COLUMNS = [
  "photos",
  "amenities",
  "property_features",
  "society_features",
  "additional_features",
  "fire_safety",
  "located_near",
  "location_advantages",
] as const;

export const ALL_DB_COLUMNS: string[] = [
  "id",
  "user_id",
  "status",
  "current_step",
  ...Object.values(COLUMN_MAP).map((c) => c.column as string),
  "created_at",
  "updated_at",
];

/* ============================================================
   CONVERTERS
============================================================ */

export function toStr(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "string") {
    const t = v.trim();
    return t === "" ? null : t;
  }
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return null;
}

/** Drizzle decimal columns are strings. */
export function toDec(v: unknown): string | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? String(n) : null;
}

export function toInt(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : null;
}

/** Fixes Boolean("false") === true. */
export function toBool(v: unknown): boolean {
  if (typeof v === "string") {
    return ["true", "1", "yes"].includes(v.trim().toLowerCase());
  }
  return v === true || v === 1;
}

/** array (or JSON-array string) -> JSON string for LONGTEXT, empty -> NULL */
export function toListJson(v: unknown): string | null {
  let arr: unknown = v;

  if (typeof v === "string") {
    try {
      arr = JSON.parse(v);
    } catch {
      arr = v.trim() ? [v.trim()] : [];
    }
  }

  if (!Array.isArray(arr)) return null;

  const clean = arr.filter(
    (i): i is string | number => typeof i === "string" || typeof i === "number"
  );

  return clean.length ? JSON.stringify(clean) : null;
}

export function castValue(type: ColumnType, value: unknown): unknown {
  switch (type) {
    case "decimal":
      return toDec(value);
    case "int":
      return toInt(value);
    case "boolean":
      return toBool(value);
    case "list":
      return toListJson(value);
    case "photos":
      return toListJson(value);
    default:
      return toStr(value);
  }
}

/* ============================================================
   BUILD DB ROW  (only fields that were actually sent)
   Accepts camelCase form keys OR snake_case column names.
============================================================ */

export function buildRow(fields: Record<string, unknown>) {
  const row: Record<string, unknown> = {};

  for (const [formKey, def] of Object.entries(COLUMN_MAP) as [
    string,
    ColumnDef
  ][]) {
    if (def.type === "photos") continue; // handled by mergePhotos()

    const raw =
      fields[formKey] !== undefined ? fields[formKey] : fields[def.column];

    if (raw === undefined) continue;
    row[def.column] = castValue(def.type, raw);
  }

  const stepRaw =
    fields.step ?? fields.currentStep ?? fields.current_step;
  if (stepRaw !== undefined) {
    const n = toInt(stepRaw);
    row.current_step = n ? Math.min(Math.max(n, 1), 5) : 1;
  }

  if (fields.status !== undefined) {
    row.status = fields.status === "published" ? "published" : "draft";
  }

  // auto price per sq.ft when not sent
  if (row.price_per_sqft === undefined || row.price_per_sqft === null) {
    const price = Number(row.expected_price);
    const area = Number(row.carpet_area);
    if (
      Number.isFinite(price) &&
      Number.isFinite(area) &&
      price > 0 &&
      area > 0
    ) {
      row.price_per_sqft = String(Math.round((price / area) * 100) / 100);
    }
  }

  return row;
}

/* ============================================================
   PHOTOS
============================================================ */

export function parsePhotos(value: unknown): string[] {
  let arr: unknown = value;

  if (typeof value === "string") {
    try {
      arr = JSON.parse(value);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(arr)) return [];

  return arr
    .map((v) => {
      if (typeof v === "string") return v;
      // { name, size, saved: "uuid.png" }  -> already stored on server
      if (v && typeof v === "object") {
        const saved = (v as { saved?: unknown }).saved;
        if (typeof saved === "string") return saved;
      }
      // { name, size } only = browser metadata, NOT a stored file -> ignored
      return "";
    })
    .filter((v) => v.trim() !== "");
}

/** number of entries in a photos value (array or JSON string of array) */
function rawPhotoCount(value: unknown): number {
  let arr: unknown = value;
  if (typeof value === "string") {
    try {
      arr = JSON.parse(value);
    } catch {
      return 0;
    }
  }
  return Array.isArray(arr) ? arr.length : 0;
}

/**
 * Returns the value to store in `photos`:
 *  - undefined -> do not touch the column
 *  - null      -> clear it
 *  - string    -> JSON array of filenames
 */
export function mergePhotos(
  fields: Record<string, unknown>,
  existingPhotosColumn: unknown,
  uploaded: string[]
): string | null | undefined {
  const sent = fields.photos !== undefined;
  const sentNames = sent ? parsePhotos(fields.photos) : [];

  // Client sent only browser metadata ({name,size}) and no real filenames:
  // treat it as "photos not sent" so existing photos are never wiped.
  const onlyUnsavedMeta =
    sent && rawPhotoCount(fields.photos) > 0 && sentNames.length === 0;

  const photosSent = sent && !onlyUnsavedMeta;
  if (!photosSent && uploaded.length === 0) return undefined;

  const base = photosSent ? sentNames : parsePhotos(existingPhotosColumn);

  const all = [...base, ...uploaded];
  return all.length ? JSON.stringify(all) : null;
}

export async function saveImages(files: File[]): Promise<string[]> {
  const valid = files.filter((f) => f && f.size > 0);
  if (!valid.length) return [];

  // validate everything first, then write
  for (const image of valid) {
    if (!ALLOWED_IMAGE_TYPES.includes(image.type)) {
      throw new ApiError(`Invalid image type: ${image.type || image.name}`);
    }
    if (image.size > MAX_IMAGE_SIZE) {
      throw new ApiError(`Image size exceeds 10MB: ${image.name}`);
    }
  }

  await mkdir(uploadsDir, { recursive: true });

  const saved: string[] = [];

  for (const image of valid) {
    const buffer = Buffer.from(await image.arrayBuffer());
    const extension = path.extname(image.name).toLowerCase() || ".jpg";
    const filename = `${uuidv4()}${extension}`;

    await writeFile(path.join(uploadsDir, filename), buffer);
    saved.push(filename);
  }

  return saved;
}

/** Best-effort cleanup when a property is deleted. */
export async function deleteImageFiles(photosColumn: unknown) {
  const names = parsePhotos(photosColumn);

  await Promise.all(
    names.map(async (name) => {
      try {
        await unlink(path.join(uploadsDir, path.basename(name)));
      } catch {
        // file already missing / old path style -> ignore
      }
    })
  );
}

/* ============================================================
   REQUEST BODY
   JSON supports both:
     { userId, step, status, formData: { ... } }   (old PATCH style)
     { userId, step, status, city: "...", ... }    (flat)
   multipart/form-data supports real files under key "images".
============================================================ */

export async function readBody(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const json = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;

    let fields: Record<string, unknown> = { ...json };

    if (json.formData && typeof json.formData === "object") {
      fields = { ...(json.formData as Record<string, unknown>) };
      for (const key of ["userId", "propertyId", "step", "status", "photos"]) {
        if (json[key] !== undefined && fields[key] === undefined) {
          fields[key] = json[key];
        }
      }
    }

    return { fields, files: [] as File[] };
  }

  if (
    contentType.includes("multipart/form-data") ||
    contentType.includes("application/x-www-form-urlencoded")
  ) {
    const formData = await request.formData();
    const fields: Record<string, unknown> = {};

    formData.forEach((value, key) => {
      if (typeof value === "string") fields[key] = value;
    });

    const files = formData
      .getAll("images")
      .filter((f): f is File => f instanceof File);

    return { fields, files };
  }

  throw new ApiError(
    "Unsupported Content-Type. Use application/json or multipart/form-data."
  );
}

/* ============================================================
   RESPONSE SERIALIZER (LONGTEXT JSON -> real arrays)
============================================================ */

function parseJsonColumn(value: unknown): unknown {
  if (!value || typeof value !== "string") return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export function serializePropertyRow<T extends Record<string, unknown>>(
  row: T
) {
  const out: Record<string, unknown> = { ...row };
  for (const col of JSON_COLUMNS) out[col] = parseJsonColumn(row[col]);
  return out;
}