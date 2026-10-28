// src/app/api/properties/[id]/route.ts
// Self-contained (no import from src/lib/*). Drop-in replacement.
import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import type { RowDataPacket } from "mysql2";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { corsHeaders } from "@/lib/cors";

import { db, pool } from "@/db/db";
import { propertyFormProperties as properties, users } from "@/db/schema";
import { resolvePropertyGeocode } from "@/lib/property-geocode";
import { getPropertyRequestActor } from "@/lib/propertyRequestAuth";
import { UPLOAD_DIR } from "@/lib/uploads";
import { persistPropertyStorageRow } from "@/lib/propertyStoragePersistence";
import { splitContactValue, storedPhone } from "@/lib/contactSplit";
import {
  buildPropertyStorageRow,
  normalizePropertyStorageStatus,
  parsePropertyFormData,
  serializePropertyStorageRow,
} from "@/lib/propertyFormStorage";

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

// Keep edit uploads in the shared directory used by create and serve routes.
const uploadsDir = UPLOAD_DIR;

const ALLOWED_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "webp", "heic", "heif"];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_PHOTOS = 50;

class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

/* ============================================================
   PHOTOS  (DB stores a JSON array of saved FILENAMES)
============================================================ */

function asArray(value: unknown): unknown[] {
  let arr: unknown = value;
  if (typeof value === "string") {
    try {
      arr = JSON.parse(value);
    } catch {
      return [];
    }
  }
  return Array.isArray(arr) ? arr : [];
}

/** Only real stored filenames. Old {name,size} browser metadata is ignored. */
function parsePhotos(value: unknown): string[] {
  return asArray(value)
    .map((v) => {
      if (typeof v === "string") return path.basename(v.trim());
      if (v && typeof v === "object") {
        const saved = (v as { saved?: unknown }).saved;
        if (typeof saved === "string") return path.basename(saved.trim());
      }
      return "";
    })
    .filter((v) => v !== "");
}

/**
 * undefined -> do not touch photos column
 * null      -> clear it
 * string    -> JSON array of filenames
 */
function mergePhotos(
  fields: Record<string, unknown>,
  existingColumn: unknown,
  uploaded: string[]
): string | null | undefined {
  const sent = fields.photos !== undefined;
  const sentNames = sent ? parsePhotos(fields.photos) : [];

  // Only old metadata sent -> treat as "not sent" (never wipe photos)
  const onlyUnsavedMeta =
    sent && asArray(fields.photos).length > 0 && sentNames.length === 0;

  const photosSent = sent && !onlyUnsavedMeta;
  if (!photosSent && uploaded.length === 0) return undefined;

  const base = photosSent ? sentNames : parsePhotos(existingColumn);
  const all = [...base, ...uploaded];

  if (all.length > MAX_PHOTOS) {
    throw new ApiError(`Maximum ${MAX_PHOTOS} photos allowed`);
  }

  return all.length ? JSON.stringify(all) : null;
}

function extensionOf(file: File): string {
  return path.extname(file.name).slice(1).toLowerCase();
}

async function removeFiles(names: string[]) {
  await Promise.all(
    names.map(async (name) => {
      try {
        await unlink(path.join(uploadsDir, path.basename(name)));
      } catch {
        // already missing -> ignore
      }
    })
  );
}

/** Rows added from the mobile app keep their photos in the `image` column only. */
async function getLegacyImage(id: number): Promise<unknown> {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT `image` FROM `properties` WHERE `id` = ? LIMIT 1",
      [id]
    );
    return rows[0]?.image;
  } catch {
    return undefined; // column missing -> nothing to fall back to
  }
}

/** Validate every file first, then write. Returns saved filenames. */
async function saveImages(files: File[]): Promise<string[]> {
  const valid = files.filter((f) => f && f.size > 0);
  if (!valid.length) return [];

  for (const image of valid) {
    if (!ALLOWED_EXTENSIONS.includes(extensionOf(image))) {
      throw new ApiError(
        `"${image.name}" is not supported. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`
      );
    }
    // some browsers send an empty type for HEIC, so only check when present
    if (image.type && !image.type.startsWith("image/")) {
      throw new ApiError(`"${image.name}" is not an image file`);
    }
    if (image.size > MAX_IMAGE_SIZE) {
      throw new ApiError(`Image size exceeds 10MB: ${image.name}`);
    }
  }

  await mkdir(uploadsDir, { recursive: true });

  const saved: string[] = [];

  try {
    for (const image of valid) {
      const buffer = Buffer.from(await image.arrayBuffer());
      const filename = `${uuidv4()}.${extensionOf(image)}`;

      await writeFile(path.join(uploadsDir, filename), buffer);
      saved.push(filename);
    }
  } catch (error) {
    await removeFiles(saved);
    throw error;
  }

  return saved;
}

/**
 * The mobile app sends new photos as JSON:
 *   imagesPayload = [{ name, type, data: <base64 without data: prefix> }]
 * Validate everything first, then write. Returns saved filenames.
 */
async function saveBase64Images(payload: unknown): Promise<string[]> {
  const list = asArray(payload);
  if (!list.length) return [];

  const decoded: { ext: string; buffer: Buffer }[] = [];

  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const { name, data } = item as { name?: unknown; data?: unknown };
    if (typeof name !== "string" || typeof data !== "string" || !data) continue;

    const ext = path.extname(name).slice(1).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new ApiError(
        `"${name}" is not supported. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`
      );
    }

    // tolerate a "data:image/jpeg;base64," prefix if one slips through
    const raw = data.includes(",") ? data.slice(data.indexOf(",") + 1) : data;
    const buffer = Buffer.from(raw, "base64");

    if (buffer.length === 0) continue;
    if (buffer.length > MAX_IMAGE_SIZE) {
      throw new ApiError(`Image size exceeds 10MB: ${name}`);
    }

    decoded.push({ ext, buffer });
  }

  if (!decoded.length) return [];

  await mkdir(uploadsDir, { recursive: true });

  const saved: string[] = [];

  try {
    for (const { ext, buffer } of decoded) {
      const filename = `${uuidv4()}.${ext}`;
      await writeFile(path.join(uploadsDir, filename), buffer);
      saved.push(filename);
    }
  } catch (error) {
    await removeFiles(saved);
    throw error;
  }

  return saved;
}

/* ============================================================
   COORDINATES
============================================================ */

/** Valid coordinate -> string, anything else -> null. */
function toCoord(value: unknown, min: number, max: number): string | null {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= min && n <= max ? String(n) : null;
}

type GeoInfo = {
  latitude: string | null;
  longitude: string | null;
  geocodedAddress: string | null;
  status: string;
};

/* ============================================================
   PRICE
   Parses "1,50,000" / 150000 / "150000" -> number.
   undefined -> price not sent (leave existing value alone)
   throws    -> sent but invalid
============================================================ */

function parsePriceInput(fields: Record<string, unknown>): number | undefined {
  const raw = fields.price ?? fields.expectedPrice ?? fields.expected_price;
  if (raw === undefined || raw === null) return undefined;

  const text = String(raw).replace(/,/g, "").trim();
  if (text === "") return undefined;

  const parsed = Number(text);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new ApiError("Invalid price");
  }
  return parsed;
}

/* ============================================================
   PROPERTY FOR  (Sale / Rent / Paying Guest)
   Accepts propertyFor / property_for / lookingTo / looking_to.
   undefined -> not sent (leave existing value alone)
   throws    -> sent but not a recognised value
============================================================ */

type PropertyForValue = "Sale" | "Rent" | "Paying Guest";

function normalizePropertyFor(raw: unknown): PropertyForValue | undefined {
  if (raw === undefined || raw === null) return undefined;

  const text = String(raw).trim().toLowerCase();
  if (text === "") return undefined;

  if (text.includes("guest") || text === "pg" || text.startsWith("pg ")) {
    return "Paying Guest";
  }
  if (text.includes("rent") || text.includes("lease")) return "Rent";
  if (text.includes("sale") || text.includes("sell") || text === "buy") {
    return "Sale";
  }

  throw new ApiError(`Invalid propertyFor: ${String(raw)}`);
}

function parsePropertyForInput(
  fields: Record<string, unknown>
): PropertyForValue | undefined {
  // propertyFor wins, lookingTo is the fallback
  const direct = normalizePropertyFor(fields.propertyFor ?? fields.property_for);
  if (direct !== undefined) return direct;
  return normalizePropertyFor(fields.lookingTo ?? fields.looking_to);
}

/** Label the form uses for its "looking to" chips. */
function lookingToLabel(value: PropertyForValue): string {
  if (value === "Rent") return "Rent / Lease";
  return value; // "Sale" | "Paying Guest"
}

/* ============================================================
   COLUMN LOOKUPS (information_schema, cached)
============================================================ */

const NUMERIC_TYPES = new Set([
  "decimal",
  "numeric",
  "float",
  "double",
  "tinyint",
  "smallint",
  "mediumint",
  "int",
  "bigint",
]);

type NumericColumn = { nullable: boolean };
let numericColumnsCache: Map<string, NumericColumn> | null = null;

async function getNumericColumns(): Promise<Map<string, NumericColumn>> {
  if (numericColumnsCache) return numericColumnsCache;

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT COLUMN_NAME AS name, DATA_TYPE AS type, IS_NULLABLE AS nullable
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties'`
  );

  const map = new Map<string, NumericColumn>();
  for (const row of rows) {
    if (NUMERIC_TYPES.has(String(row.type).toLowerCase())) {
      map.set(String(row.name), {
        nullable: String(row.nullable).toUpperCase() === "YES",
      });
    }
  }

  numericColumnsCache = map;
  return map;
}

let allColumnNamesCache: Set<string> | null = null;

/** Every real column name of the `properties` table. */
async function getPropertiesColumnNames(): Promise<Set<string>> {
  if (allColumnNamesCache) return allColumnNamesCache;

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT COLUMN_NAME AS name
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'properties'`
  );

  allColumnNamesCache = new Set(rows.map((row) => String(row.name)));
  return allColumnNamesCache;
}

/**
 * The column that really stores "property for".
 * The real column name is `property_For` (capital F), so the lookup must ignore
 * case and underscores. An exact-case match never found it, which meant the
 * new value was never written and edits left "Rent / Lease" / old values behind.
 */
async function getPropertyForColumn(): Promise<string | null> {
  const columns = await getPropertiesColumnNames();
  for (const name of columns) {
    if (name.toLowerCase().replace(/_/g, "") === "propertyfor") return name;
  }
  return null;
}

/**
 * Direct UPDATE so the column is ALWAYS correct, even if the row builder
 * ignores the new value or re-derives it from an old saved lookingTo.
 */
async function forcePropertyFor(
  id: number,
  value: PropertyForValue
): Promise<void> {
  const column = await getPropertyForColumn();
  if (!column) {
    console.warn("[PATCH properties] property_for column not found, skipped");
    return;
  }

  // `column` comes from information_schema, never from the request
  await pool.query(`UPDATE \`properties\` SET \`${column}\` = ? WHERE \`id\` = ?`, [
    value,
    id,
  ]);
}

/* ============================================================
   NUMERIC / JSON COLUMN SANITIZERS
============================================================ */

async function sanitizeNumericColumns(
  row: Record<string, unknown>,
  mode: "row" | "form" = "row"
): Promise<void> {
  const numeric = await getNumericColumns();
  const norm = (k: string) => k.toLowerCase().replace(/_/g, "");

  const keysByNorm = new Map<string, string[]>();
  for (const key of Object.keys(row)) {
    const list = keysByNorm.get(norm(key)) ?? [];
    list.push(key);
    keysByNorm.set(norm(key), list);
  }

  for (const [column, meta] of numeric) {
    for (const key of keysByNorm.get(norm(column)) ?? []) {
      const value = row[key];
      if (value === null || value === undefined || typeof value === "number") {
        continue;
      }
      if (typeof value === "boolean") continue;
      if (typeof value === "object") continue;

      const cleaned = String(value).trim().replace(/,/g, "");
      const lower = cleaned.toLowerCase();

      if (lower === "true" || lower === "false") {
        row[key] = lower === "true" ? 1 : 0;
        continue;
      }
      if (mode === "row" && (lower === "yes" || lower === "no")) {
        row[key] = lower === "yes" ? 1 : 0;
        continue;
      }

      if (mode === "form") {
        if (cleaned === "") delete row[key];
        continue;
      }

      if (cleaned !== "" && Number.isFinite(Number(cleaned))) {
        row[key] = cleaned;
      } else if (meta.nullable) {
        row[key] = null;
      } else {
        delete row[key];
      }
    }
  }
}

type JsonColumn = { nullable: boolean };
let jsonColumnsCache: Map<string, JsonColumn> | null = null;

async function getJsonColumns(): Promise<Map<string, JsonColumn>> {
  if (jsonColumnsCache) return jsonColumnsCache;

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT COLUMN_NAME AS name, IS_NULLABLE AS nullable
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'properties'
        AND DATA_TYPE = 'json'`
  );

  const map = new Map<string, JsonColumn>();
  for (const row of rows) {
    map.set(String(row.name), {
      nullable: String(row.nullable).toUpperCase() === "YES",
    });
  }

  jsonColumnsCache = map;
  return map;
}

function isValidJson(text: string): boolean {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

async function sanitizeJsonColumns(
  row: Record<string, unknown>,
  mode: "row" | "form" = "row"
): Promise<void> {
  const jsonCols = await getJsonColumns();
  if (jsonCols.size === 0) return;

  const norm = (k: string) => k.toLowerCase().replace(/_/g, "");

  const metaByNorm = new Map<string, JsonColumn>();
  for (const [column, meta] of jsonCols) metaByNorm.set(norm(column), meta);

  for (const key of Object.keys(row)) {
    const meta = metaByNorm.get(norm(key));
    if (!meta) continue;

    const value = row[key];
    if (value === undefined || value === null) continue;

    if (mode === "form") {
      if (typeof value === "string" && value.trim() === "") delete row[key];
      continue;
    }

    // arrays / objects -> JSON text
    if (typeof value === "object") {
      row[key] = JSON.stringify(value);
      continue;
    }

    const text = String(value).trim();

    // empty -> NULL if allowed, otherwise an empty array
    if (text === "") {
      row[key] = meta.nullable ? null : "[]";
      continue;
    }

    // already valid JSON ('["a","b"]', '{}', '12') -> keep
    if (isValidJson(text)) {
      row[key] = text;
      continue;
    }

    // "Pooja Room, Study Room" -> '["Pooja Room","Study Room"]'
    row[key] = JSON.stringify(
      text
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    );
  }
}

/* ============================================================
   EDIT PREFILL
   Properties added from the mobile app only fill part of the table
   columns; the rest of the form is kept in `form_data`. The edit screen
   needs both, so every gap in the serialized property is filled from
   form_data, then from the numeric location columns.
============================================================ */

const isEmptyValue = (value: unknown): boolean =>
  value === undefined ||
  value === null ||
  (typeof value === "string" && value.trim() === "") ||
  (Array.isArray(value) && value.length === 0);

const toSnakeKey = (key: string): string =>
  key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);

/** True when the object already has a value under camelCase, snake_case or lowercase. */
const hasValue = (obj: Record<string, unknown>, key: string): boolean =>
  [key, toSnakeKey(key), key.toLowerCase()].some((k) => !isEmptyValue(obj[k]));

function fillMissingFromFormData(
  serialized: Record<string, unknown>,
  rawRow: Record<string, unknown>,
  normalizedRow: Record<string, unknown> = {}
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...serialized };

  // 1. everything saved in form_data (never overrides a value that already exists)
  const formData = parsePropertyFormData(rawRow.form_data) as unknown as Record<
    string,
    unknown
  >;
  for (const [key, value] of Object.entries(formData ?? {})) {
    if (isEmptyValue(value) || hasValue(result, key)) continue;
    result[key] = value;
  }

  // 1b. rows without form_data (older mobile adds): use the table columns the
  //     serializer left out. form_data itself is never copied this way.
  for (const [key, value] of Object.entries(normalizedRow)) {
    if (key === "formData" || key === "formdata") continue;
    if (isEmptyValue(value) || hasValue(result, key)) continue;
    result[key] = value;
  }

  // 1c. Sale / Rent chip: property_For is stored as "Sale", "rent", "Rent / Lease" ...
  if (isEmptyValue(result.lookingTo) && isEmptyValue(result.looking_to)) {
    const rawFor = String(
      rawRow.property_For ?? rawRow.property_for ?? rawRow.propertyFor ?? ""
    )
      .trim()
      .toLowerCase();
    if (rawFor.includes("guest") || rawFor === "pg") result.lookingTo = "Paying Guest";
    else if (rawFor.includes("rent") || rawFor.includes("lease")) result.lookingTo = "Rent / Lease";
    else if (rawFor.includes("sale") || rawFor.includes("sell")) result.lookingTo = "Sale";
  }

  // 2. numeric location columns -> ids the edit form can look up
  const locationIds: Record<string, unknown> = {
    countryId: rawRow.country,
    stateId: rawRow.state,
    cityId: rawRow.city,
    areaId: rawRow.area,
  };
  for (const [key, value] of Object.entries(locationIds)) {
    if (hasValue(result, key)) continue;
    const text = String(value ?? "").trim();
    if (/^\d+$/.test(text)) result[key] = text;
  }

  return result;
}

/* ============================================================
   REQUEST BODY
   JSON  : { userId, step, status, formData:{...} }  or flat
   Multi : multipart/form-data, "formData" = JSON string,
           real files under "images"
============================================================ */

async function readBody(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const json = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;

    let fields: Record<string, unknown> = { ...json };

    if (json.formData && typeof json.formData === "object") {
      fields = { ...(json.formData as Record<string, unknown>) };
      for (const key of [
        "userId",
        "step",
        "status",
        "photos",
        "imagesPayload",
        "propertyFor",
        "lookingTo",
      ]) {
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
    let fields: Record<string, unknown> = {};

    formData.forEach((value, key) => {
      if (typeof value === "string") fields[key] = value;
    });

    // IMPORTANT: "formData" arrives as a JSON string. Expand it, otherwise
    // none of the form fields would be saved on multipart requests.
    if (typeof fields.formData === "string") {
      let nested: unknown;

      try {
        nested = JSON.parse(fields.formData);
      } catch {
        throw new ApiError("formData is not valid JSON");
      }

      const { formData: _ignored, ...top } = fields;

      if (nested && typeof nested === "object" && !Array.isArray(nested)) {
        fields = { ...top, ...(nested as Record<string, unknown>) };
      } else {
        fields = top;
      }
    }

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
   COMMON
============================================================ */

function parseId(value: string): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

/** Error responses must carry the CORS headers too, or the browser hides the real error. */
function errorResponse(error: unknown, label: string, headers: HeadersInit) {
  console.error(label, error);

  if (error instanceof ApiError) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status, headers }
    );
  }

  return NextResponse.json(
    {
      success: false,
      error: "Request failed",
      details: error instanceof Error ? error.message : "Unknown error",
    },
    { status: 500, headers }
  );
}

type RouteContext = { params: Promise<{ id: string }> };

/* ============================================================
   GET /api/properties/[id]
   Public when no userId is supplied; ownership-checked for edit requests.
============================================================ */

export async function GET(request: NextRequest, { params }: RouteContext) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);

  try {
    const id = parseId((await params).id);
    if (id === null) throw new ApiError("Invalid property id");

    const requestedUserId = request.nextUrl.searchParams.get("userId");
    const actor =
      requestedUserId === null ? null : await getPropertyRequestActor(request);
    if (requestedUserId !== null && !actor) {
      throw new ApiError("Authentication required", 401);
    }

    const requestedId = requestedUserId === null ? null : parseId(requestedUserId);
    if (requestedUserId !== null && requestedId === null) {
      throw new ApiError("Invalid userId", 400);
    }
    if (actor && actor.role !== "admin" && requestedId !== actor.id) {
      throw new ApiError("You can only edit your own properties", 403);
    }

    const [propertyRows] = await pool.query<
      Array<RowDataPacket & Record<string, unknown>>
    >("SELECT * FROM `properties` WHERE `id` = ? LIMIT 1", [id]);
    const property = propertyRows[0];

    if (!property) throw new ApiError("Property not found", 404);

    const propertyOwnerId = Number(property.user_id);
    if (actor && actor.role !== "admin" && propertyOwnerId !== actor.id) {
      throw new ApiError("You can only edit your own properties", 403);
    }

    const normalizedProperty = Object.fromEntries(
      Object.entries(property).map(([key, value]) => [
        key.toLowerCase().replace(/_([a-z])/g, (_match, letter: string) =>
          letter.toUpperCase()
        ),
        value,
      ])
    );
    const serializedProperty = fillMissingFromFormData(
      serializePropertyStorageRow(normalizedProperty) as unknown as Record<
        string,
        unknown
      >,
      property,
      normalizedProperty as Record<string, unknown>
    );
    if (propertyOwnerId > 0) {
      const [owner] = await db
        .select({ email: users.email, mobile: users.mobile })
        .from(users)
        .where(eq(users.id, propertyOwnerId))
        .limit(1);
      if (owner) {
        if (!serializedProperty.contact_number && owner.mobile) {
          serializedProperty.contact_number = String(owner.mobile);
        }
        if (!serializedProperty.contact_email) {
          serializedProperty.contact_email = owner.email;
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        property: serializedProperty,
      },
      { status: 200, headers }
    );
  } catch (error) {
    return errorResponse(error, "GET /api/properties/[id] error:", headers);
  }
}

/* ============================================================
   PATCH /api/properties/[id]
   Admin can edit any property; owner stays unchanged.
============================================================ */

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);

  // files written during this request (removed again if the DB update fails)
  let uploadedImages: string[] = [];
  // once the DB row references the new files, they must not be deleted
  let dbCommitted = false;

  try {
    const id = parseId((await params).id);
    if (id === null) throw new ApiError("Invalid property id");

    const { fields, files } = await readBody(request);

    // Base64 photos from the mobile app. Pull them out of `fields` so the
    // (large) payload is never merged into form_data.
    const imagesPayload = fields.imagesPayload;
    delete fields.imagesPayload;

    const actor = await getPropertyRequestActor(request);
    if (!actor) throw new ApiError("Authentication required", 401);

    const submittedUserId =
      request.nextUrl.searchParams.get("userId") ??
      fields.userId ??
      fields.user_id;
    const parsedSubmittedUserId =
      submittedUserId === undefined ||
      submittedUserId === null ||
      submittedUserId === ""
        ? null
        : parseId(String(submittedUserId));
    if (
      submittedUserId !== undefined &&
      submittedUserId !== null &&
      parsedSubmittedUserId === null
    ) {
      throw new ApiError("Invalid userId", 400);
    }
    if (
      actor.role !== "admin" &&
      parsedSubmittedUserId !== null &&
      parsedSubmittedUserId !== actor.id
    ) {
      throw new ApiError("You can only edit your own properties", 403);
    }

    const [existing] = await db
      .select()
      .from(properties)
      .where(
        actor.role === "admin"
          ? eq(properties.id, id)
          : and(eq(properties.id, id), eq(properties.user_id, actor.id))
      )
      .limit(1);

    if (!existing) throw new ApiError("Property not found", 404);

    // Validate price + propertyFor early, before any file is written.
    const newPrice = parsePriceInput(fields);
    const newPropertyFor = parsePropertyForInput(fields);

    // Assign after each step so the catch block can clean up on failure.
    uploadedImages = await saveImages(files);
    uploadedImages = [
      ...uploadedImages,
      ...(await saveBase64Images(imagesPayload)),
    ];

    if (Object.keys(fields).length === 0 && uploadedImages.length === 0) {
      throw new ApiError("No fields to update");
    }

    const existingFormData = parsePropertyFormData(existing.form_data);

    // Mobile-added rows have no photos in form_data: fall back to the `image`
    // column so editing never drops the photos that are already saved.
    let existingPhotoNames = parsePhotos(existingFormData.photos);
    if (existingPhotoNames.length === 0) {
      existingPhotoNames = parsePhotos(await getLegacyImage(id));
    }

    const photos = mergePhotos(fields, existingPhotoNames, uploadedImages);
    const nextFormData = { ...existingFormData, ...fields };
    nextFormData.step =
      fields.step ??
      fields.currentStep ??
      fields.current_step ??
      existingFormData.step ??
      1;
    if (photos !== undefined) {
      nextFormData.photos = photos ? parsePhotos(photos) : [];
    } else if (existingPhotoNames.length > 0) {
      nextFormData.photos = existingPhotoNames;
    }

    /* ------------------------------------------------------
       PROPERTY FOR
       form_data still holds the OLD lookingTo / propertyFor. The row
       builder may derive property_for from lookingTo, so the old value
       would overwrite the new one. Keep every alias in sync.
    ------------------------------------------------------ */
    if (newPropertyFor !== undefined) {
      const nf = nextFormData as Record<string, unknown>;
      nf.propertyFor = newPropertyFor;
      nf.property_for = newPropertyFor;
      nf.lookingTo = lookingToLabel(newPropertyFor);
      delete nf.looking_to;
    }

    /* ------------------------------------------------------
       COORDINATES
       1. Valid latitude/longitude sent by the client (Google
          Places, exact location) -> used as is.
       2. Otherwise geocode the city (body city, else saved city).
          Same city -> old coordinates are reused.
       3. Geocoder throws / fails -> old coordinates are kept.
    ------------------------------------------------------ */

    const existingLat =
      typeof existingFormData.latitude === "string"
        ? existingFormData.latitude
        : null;
    const existingLng =
      typeof existingFormData.longitude === "string"
        ? existingFormData.longitude
        : null;
    const existingGeoAddress =
      typeof existingFormData.geocodedAddress === "string"
        ? existingFormData.geocodedAddress
        : null;

    const clientLat = toCoord(fields.latitude, -90, 90);
    const clientLng = toCoord(fields.longitude, -180, 180);

    const bodyCity = fields.city ?? existingFormData.city;
    const cityForGeocode =
      typeof bodyCity === "string" && bodyCity.trim() !== "" ? bodyCity : "";

    let geo: GeoInfo;

    if (clientLat !== null && clientLng !== null) {
      const clientAddress =
        typeof fields.formattedAddress === "string" &&
        fields.formattedAddress.trim() !== ""
          ? fields.formattedAddress.trim()
          : null;

      geo = {
        latitude: clientLat,
        longitude: clientLng,
        geocodedAddress: clientAddress ?? existingGeoAddress,
        status: "client",
      };
    } else {
      try {
        const resolved = await resolvePropertyGeocode(cityForGeocode, {
          latitude: existingLat,
          longitude: existingLng,
          geocoded_address: existingGeoAddress,
        });
        geo = {
          latitude: resolved.latitude,
          longitude: resolved.longitude,
          geocodedAddress: resolved.geocodedAddress,
          status: String(resolved.status),
        };
      } catch (geoError) {
        console.error("[PATCH properties] geocode failed:", geoError);
        geo = {
          latitude: existingLat,
          longitude: existingLng,
          geocodedAddress: existingGeoAddress,
          status: "failed",
        };
      }
    }

    nextFormData.latitude = geo.latitude;
    nextFormData.longitude = geo.longitude;
    nextFormData.geocodedAddress = geo.geocodedAddress;

    console.log("[PATCH properties] geocode:", {
      id,
      city: cityForGeocode,
      status: geo.status,
      latitude: geo.latitude,
      longitude: geo.longitude,
    });

    const status =
      normalizePropertyStorageStatus(fields.status) ??
      normalizePropertyStorageStatus(existing.status) ??
      "draft";
    nextFormData.status = status;

    /* ------------------------------------------------------
       PRICE
       form_data may still hold an OLD expectedPrice / expected_price.
       persistPropertyStorageRow maps expectedPrice -> price too, so the
       old value would overwrite the new price. Keep all of them in sync.
    ------------------------------------------------------ */
    if (newPrice !== undefined) {
      const nf = nextFormData as Record<string, unknown>;
      nf.price = newPrice;
      nf.expectedPrice = newPrice;
      delete nf.expected_price;
    }

    // Drop "" from numeric / JSON fields BEFORE the row is built, because
    // persistPropertyStorageRow also receives nextFormData.
    await sanitizeNumericColumns(nextFormData as Record<string, unknown>, "form");
    await sanitizeJsonColumns(nextFormData as Record<string, unknown>, "form");

    const storageRow = buildPropertyStorageRow(actor.id, status, nextFormData);
    storageRow.user_id = existing.user_id;

    // Make sure the row builder can never bring back an old price.
    if (newPrice !== undefined) {
      (storageRow as Record<string, unknown>).price = newPrice;
    }

    // Same for propertyFor: write it only into the column that really exists.
    if (newPropertyFor !== undefined) {
      const propertyForColumn = await getPropertyForColumn();
      if (propertyForColumn) {
        (storageRow as Record<string, unknown>)[propertyForColumn] =
          newPropertyFor;
      }
    }

    /* ------------------------------------------------------
       CONTACT
       The "Contact details" field holds a phone number OR an email.
       Mobile -> contact_number (+91XXXXXXXXXX), email -> contact_email.
       The explicit "Contact Email" field (step 4) is the fallback.
    ------------------------------------------------------ */
    {
      const contact = splitContactValue(nextFormData.contactNumber);
      const explicitEmail = String(nextFormData.contactEmail ?? "").trim();
      const sr = storageRow as Record<string, unknown>;
      sr.contact_number = contact.phone ? storedPhone(contact.phone) : null;
      sr.contact_email = contact.email || explicitEmail || null;
    }

    // "" -> null for numeric columns (fixes "Incorrect decimal value: ''")
    await sanitizeNumericColumns(storageRow as Record<string, unknown>, "row");
    // "" / "a, b" -> valid JSON for JSON columns (fixes "Invalid JSON text ... other_rooms")
    await sanitizeJsonColumns(storageRow as Record<string, unknown>, "row");

    await persistPropertyStorageRow(storageRow, nextFormData, id);
    dbCommitted = true;

    // Last word on property_for: direct UPDATE, so the table is always correct.
    if (newPropertyFor !== undefined) {
      await forcePropertyFor(id, newPropertyFor);
      console.log("[PATCH properties] propertyFor saved:", {
        id,
        propertyFor: newPropertyFor,
      });
    }

    // photos the user removed -> delete their files (best effort)
    if (photos !== undefined) {
      const kept = new Set(parsePhotos(photos));
      const removed = existingPhotoNames.filter((n) => !kept.has(n));
      await removeFiles(removed);
    }

    const [property] = await db
      .select()
      .from(properties)
      .where(eq(properties.id, id))
      .limit(1);

    if (!property) throw new ApiError("Property not found after update", 404);

    return NextResponse.json(
      {
        success: true,
        id: property.id,
        status,
        currentStep: Number(nextFormData.step ?? nextFormData.currentStep ?? 1),
        property: serializePropertyStorageRow(
          property as Record<string, unknown>
        ),
        latitude: geo.latitude !== null ? Number(geo.latitude) : null,
        longitude: geo.longitude !== null ? Number(geo.longitude) : null,
        geocode: { status: geo.status },
        uploadedImages,
      },
      { status: 200, headers }
    );
  } catch (error) {
    // Only clean up new uploads if the DB row doesn't reference them yet.
    if (!dbCommitted) await removeFiles(uploadedImages);
    return errorResponse(error, "PATCH /api/properties/[id] error:", headers);
  }
}

/* ============================================================
   DELETE /api/properties/[id]   (admin can delete any property)
============================================================ */

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);

  try {
    const id = parseId((await params).id);
    if (id === null) throw new ApiError("Invalid property id");

    const actor = await getPropertyRequestActor(request);
    if (!actor) throw new ApiError("Authentication required", 401);

    const requestedUserId = request.nextUrl.searchParams.get("userId");
    const parsedRequestedUserId =
      requestedUserId === null ? null : parseId(requestedUserId);
    if (requestedUserId !== null && parsedRequestedUserId === null) {
      throw new ApiError("Invalid userId", 400);
    }
    if (
      actor.role !== "admin" &&
      parsedRequestedUserId !== null &&
      parsedRequestedUserId !== actor.id
    ) {
      throw new ApiError("You can only delete your own properties", 403);
    }

    const [existing] = await db
      .select()
      .from(properties)
      .where(
        actor.role === "admin"
          ? eq(properties.id, id)
          : and(eq(properties.id, id), eq(properties.user_id, actor.id))
      )
      .limit(1);

    if (!existing) throw new ApiError("Property not found", 404);

    await db.delete(properties).where(eq(properties.id, id));

    await removeFiles(
      parsePhotos(parsePropertyFormData(existing.form_data).photos)
    );

    return NextResponse.json(
      { success: true, message: "Property deleted" },
      { status: 200, headers }
    );
  } catch (error) {
    return errorResponse(error, "DELETE /api/properties/[id] error:", headers);
  }
}