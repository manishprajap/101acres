///add property via mobile
// src/app/api/mobileproperty/route.ts
import { writeFile, access, mkdir, constants, chmod, unlink } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { NextRequest, NextResponse } from "next/server";
import { db, pool } from "@/db/db";
import { properties } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { corsHeaders } from "@/lib/cors";
import { notifyNewProperty } from "@/lib/notifyNewProperty";
import { splitContactValue, storedPhone } from "@/lib/contactSplit";

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

const uploadsDir = path.join(process.cwd(), "uploads");
const MAX_IMAGES = 50;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_INT = 2_147_483_647;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PROPERTY_FOR = ["Sale", "Rent", "Paying Guest"];

// The file extension comes from the validated MIME type, never from the client file name
const IMAGE_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

// Conversion to sq.ft. so price-per-sq.ft. and sorting work for every unit the form offers.
// bigha and biswa are left out on purpose: their size differs by state.
// For those units the raw number is stored and areaUnit keeps the original unit.
const SQFT_PER_UNIT: Record<string, number> = {
  "sq.ft.": 1, "sq.yards": 9, "sq.m.": 10.7639, acres: 43560, marla: 272.25,
  cents: 435.6, kanal: 5445, grounds: 2400, ares: 1076.39, guntha: 1089,
  hectares: 107639, rood: 10890, chataks: 45, perch: 272.25, aankadam: 72, kottah: 720,
};

type IncomingImage = { name: string; type: string; data: string };

// ── Helpers ─────────────────────────────────────────────────
const str = (fd: FormData, key: string, max = 255) =>
  (fd.get(key)?.toString().trim() ?? "").slice(0, max);

const toInt = (v: string, min = 0, max = MAX_INT): number | null => {
  if (!v || v === "NaN") return null;
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
};

const toDecimal = (v: string, max: number): string | null => {
  if (!v || v === "NaN") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n <= max ? n.toFixed(2) : null;
};

const toCoord = (v: string, limit: number): string | null => {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) && Math.abs(n) <= limit ? n.toFixed(7) : null;
};

const toBool = (v: string) => v === "true" || v === "1";

// The form sends lists as "A, B, C"
const toList = (v: string, maxItems = 20, maxLen = 60): string[] =>
  Array.from(new Set(v.split(",").map((s) => s.trim().slice(0, maxLen)).filter(Boolean))).slice(0, maxItems);

// ── Edit-screen snapshot ────────────────────────────────────
// The `properties` columns below only cover part of the form. Nothing is stored for
// PG, plot, commercial, maintenance, deposit, tenants, amenities, nearby places,
// furnishing items, video link, RERA, possession, etc.
// The edit screen reads everything back from `form_data`, so the complete submitted
// form is saved there as well (this is what the web add API already does).
const LIST_FIELDS = [
  "otherRooms", "features", "amenities", "locationAdvantages",
  "overlooking", "preferredTenants", "pgSharing",
];
const BOOL_FIELDS = ["allInclusive", "negotiable", "taxExcluded", "duplex", "sendViaWhatsapp"];
const OBJECT_FIELDS = ["furnishingItems"];
const SNAPSHOT_SKIP = new Set(["imagesPayload", "userId"]);

const buildFormSnapshot = (fd: FormData, savedFiles: string[], propertyFor: string) => {
  const out: Record<string, unknown> = {};

  fd.forEach((value, key) => {
    if (typeof value !== "string" || SNAPSHOT_SKIP.has(key)) return;
    const text = value.trim();

    if (LIST_FIELDS.includes(key)) {
      out[key] = toList(text, 50, 100);
    } else if (BOOL_FIELDS.includes(key)) {
      out[key] = toBool(text);
    } else if (OBJECT_FIELDS.includes(key)) {
      try {
        const parsed: unknown = JSON.parse(text || "{}");
        out[key] = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
      } catch {
        out[key] = {};
      }
    } else if (key === "areaId") {
      // the app sends the locality NAME here when it is not in the master list
      out[key] = /^\d+$/.test(text) ? text : "";
    } else {
      out[key] = text.slice(0, 5000);
    }
  });

  // "lookingTo" is never sent by the form, rebuild it from propertyFor
  out.lookingTo = propertyFor === "Rent" ? "Rent / Lease" : propertyFor;
  // keep the saved file names so editing never loses the photos
  out.photos = savedFiles;

  return out;
};

// Checks the real file bytes against the declared image type
const matchesType = (buf: Buffer, type: string) => {
  if (type === "image/png") {
    return buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  if (type === "image/webp") {
    return buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP";
  }
  return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff; // JPEG
};

const fail = (origin: string | null, message: string, status = 400) =>
  NextResponse.json({ success: false, message }, { status, headers: corsHeaders(origin) });

async function ensureUploadsFolderExists() {
  try {
    await access(uploadsDir, constants.F_OK);
  } catch {
    await mkdir(uploadsDir, { recursive: true });
    await chmod(uploadsDir, 0o755);
    console.log("✅ uploads/ directory created");
  }
}

// ── POST: add property ──────────────────────────────────────
export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  const savedFiles: string[] = [];

  try {
    const fd = await req.formData();

    // Required fields (contactName / contactNumber are NOT required any more:
    // the name comes from the users table, the number may be empty -> NULL)
    const required = [
      "title", "squareFt", "price", "propertyLocation", "propertyFor",
      "slug", "residentialType", "cityId", "areaId",
    ];
    for (const field of required) {
      if (!str(fd, field)) return fail(origin, `Missing required field: ${field}`);
    }

    const userId = toInt(str(fd, "userId"), 1);
    if (userId === null) return fail(origin, "User ID missing or invalid");

    // Login user's name from the users table (NULL when not found / empty)
    let userName: string | null = null;
    try {
      const [userRows] = await pool.query(
        "SELECT `name` FROM `users` WHERE `id` = ? LIMIT 1",
        [userId],
      );
      const found = (userRows as { name?: string | null }[])[0]?.name;
      userName = found && String(found).trim() ? String(found).trim().slice(0, 255) : null;
    } catch (nameError) {
      console.error("[mobileproperty] user name lookup failed:", nameError);
    }

    const propertyFor = str(fd, "propertyFor");
    if (!PROPERTY_FOR.includes(propertyFor)) return fail(origin, "Invalid propertyFor");

    const price = toDecimal(str(fd, "price"), 999_999_999_999);
    if (price === null || Number(price) <= 0) return fail(origin, "Invalid price");

    // The form sends one raw area value plus its unit; squareFt is stored converted to sq.ft.
    const areaUnit = str(fd, "areaUnit", 20) || "sq.ft.";
    const rawArea = Number(str(fd, "squareFt"));
    if (!Number.isFinite(rawArea) || rawArea <= 0) return fail(origin, "Invalid area");
    const squareFt = Math.round(rawArea * (SQFT_PER_UNIT[areaUnit] ?? 1));
    if (squareFt < 1 || squareFt > MAX_INT) return fail(origin, "Invalid area");

    const contactEmail = str(fd, "contactEmail");
    if (contactEmail && !EMAIL_RE.test(contactEmail)) return fail(origin, "Invalid email address");

    // "contactNumber" can be a phone number OR (older apps) an email.
    // phone -> contact_number (+91...), email -> contact_email.
    // Empty -> nothing is split and contact_number is saved as NULL.
    const rawContact = str(fd, "contactNumber");
    const contact: { phone?: string | null; email?: string | null } = rawContact
      ? splitContactValue(rawContact)
      : { phone: null, email: null };
    const finalContactEmail = contact.email || contactEmail || null;
    if (finalContactEmail && !EMAIL_RE.test(finalContactEmail)) return fail(origin, "Invalid email address");

    // Optional coordinates (needed for the 50 km nearby search)
    const lat = toCoord(str(fd, "latitude"), 90);
    const lng = toCoord(str(fd, "longitude"), 180);
    const hasCoords = lat !== null && lng !== null;

    // ── Images: validate everything first, write only after all pass ──
    let incoming: IncomingImage[] = [];
    const rawImages = fd.get("imagesPayload")?.toString();
    if (rawImages) {
      try {
        incoming = JSON.parse(rawImages);
      } catch {
        return fail(origin, "Invalid imagesPayload format");
      }
      if (!Array.isArray(incoming)) return fail(origin, "Invalid imagesPayload format");
    }
    if (incoming.length > MAX_IMAGES) return fail(origin, `Maximum ${MAX_IMAGES} images allowed`);

    const decoded: { buffer: Buffer; ext: string }[] = [];
    for (const img of incoming) {
      const ext = IMAGE_EXT[String(img?.type)];
      if (!ext) return fail(origin, `Invalid image type: ${img?.type}`);
      if (typeof img.data !== "string" || img.data.length > Math.ceil((MAX_IMAGE_BYTES * 4) / 3) + 4) {
        return fail(origin, "Image size exceeds 10MB");
      }
      const buffer = Buffer.from(img.data, "base64");
      if (buffer.length > MAX_IMAGE_BYTES) return fail(origin, "Image size exceeds 10MB");
      if (!matchesType(buffer, img.type)) return fail(origin, "File content does not match its image type");
      decoded.push({ buffer, ext });
    }

    await ensureUploadsFolderExists();
    for (const { buffer, ext } of decoded) {
      const filename = `${uuidv4()}${ext}`;
      const filepath = path.join(uploadsDir, filename);
      await writeFile(filepath, buffer);
      await chmod(filepath, 0o644);
      savedFiles.push(filename);
    }

    // ── Insert ──
    const roadWidth = toDecimal(str(fd, "roadWidth"), 999_999);

    const result = await db.insert(properties).values({
      user_id: userId,

      // Contact
      contactName: userName, // login user's name, otherwise NULL
      contactNumber: contact.phone ? storedPhone(contact.phone) : null, // number if present, otherwise NULL
      contactEmail: finalContactEmail,
      sendViaWhatsapp: toBool(str(fd, "sendViaWhatsapp")),

      // Basic details
      title: str(fd, "title"),
      propertyLocation: str(fd, "propertyLocation"),
      propertyFor,
      propertyType: str(fd, "propertyType") || null,
      residentialType: str(fd, "residentialType"),
      description: str(fd, "description", 5000) || null,

      // Rooms
      beds: toInt(str(fd, "beds"), 0, 100),
      baths: toInt(str(fd, "baths"), 0, 100),
      balconies: str(fd, "balconies", 20) || null,
      otherRooms: toList(str(fd, "otherRooms", 1000)),

      // Area
      squareFt,
      carpetArea: toDecimal(str(fd, "carpetArea"), 9_999_999_999),
      builtUpArea: toDecimal(str(fd, "builtUpArea"), 9_999_999_999),
      superBuiltUpArea: toDecimal(str(fd, "superBuiltUpArea"), 9_999_999_999),
      areaUnit,

      // Floors
      totalFloors: toInt(str(fd, "totalFloors"), 0, 500),
      floorNo: str(fd, "floorNo", 20) || null,
      duplex: toBool(str(fd, "duplex")),

      // Availability / furnishing / ownership
      availability: str(fd, "availability", 50) || null,
      furnishing: str(fd, "furnishing", 50) || null,
      ownership: str(fd, "ownership", 50) || null,

      // Price
      price,
      priceFor: str(fd, "priceFor") || null,
      allInclusive: toBool(str(fd, "allInclusive")),
      negotiable: toBool(str(fd, "negotiable")),
      taxExcluded: toBool(str(fd, "taxExcluded")),

      // Parking
      coveredParking: toInt(str(fd, "coveredParking"), 0, 100) ?? 0,
      openParking: toInt(str(fd, "openParking"), 0, 100) ?? 0,

      // Features
      features: toList(str(fd, "features", 2000)),
      overlooking: toList(str(fd, "overlooking", 1000)),
      openSides: str(fd, "openSides", 10) || null,
      powerBackup: str(fd, "powerBackup", 20) || null,
      facing: str(fd, "facing", 20) || null,
      flooring: str(fd, "flooring", 50) || null,
      roadWidth,
      roadWidthUnit: roadWidth ? str(fd, "roadWidthUnit", 10) || "Feet" : null,

      // Location
      country: toInt(str(fd, "countryId"), 1),
      state: toInt(str(fd, "stateId"), 1),
      city: toInt(str(fd, "cityId"), 1),
      area: toInt(str(fd, "areaId"), 1),
      landmark: str(fd, "landmark") || null,
      society: str(fd, "society") || null,
      address: str(fd, "address", 500) || null,
      googleLocation: str(fd, "googleLocation", 2000) || null,
      latitude: hasCoords ? lat : null,
      longitude: hasCoords ? lng : null,

      // Listing meta
      slug: str(fd, "slug"),
      isBankProperty: str(fd, "isBankProperty", 10) === "yes" ? "yes" : "no",
      bankPropertyType: str(fd, "bankPropertyType") || null,
      customBankType: str(fd, "customBankType") || null,
      image: JSON.stringify(savedFiles),
      status: "Active",

      // Server-side defaults: the form never sends these, so a client cannot set them
      paymentstatus: "free",
      premium: false,
      paymentType: "cash",
      amount: 0,
      isDeleted: false,
      remark: null,
    });

    const header = Array.isArray(result) ? result[0] : result;
    const id = (header as { insertId?: number } | undefined)?.insertId;

    // Save the complete form so the edit screen can show every field again.
    // The property row already exists at this point, so a failure here must NOT
    // delete its images: log it and keep going.
    let formDataSaved = false;
    let formDataError: string | null = null;
    if (!id) {
      formDataError = "insertId missing, form_data not saved";
      console.error(formDataError, result);
    } else {
      try {
        const [update] = await pool.query("UPDATE `properties` SET `form_data` = ? WHERE `id` = ?", [
          JSON.stringify(buildFormSnapshot(fd, savedFiles, propertyFor)),
          id,
        ]);
        const affected = (update as { affectedRows?: number } | undefined)?.affectedRows ?? 0;
        formDataSaved = affected > 0;
        if (!formDataSaved) formDataError = `UPDATE matched no row for id ${id}`;
      } catch (snapshotError) {
        formDataError = (snapshotError as Error)?.message || "form_data update failed";
        console.error("form_data save failed (edit screen will miss some fields):", snapshotError);
      }
    }
    console.log("[mobileproperty] form_data:", { id, formDataSaved, formDataError });

    // Push notification to every user that has an fcm_token (the owner is excluded).
    // Fire and forget: the app must not wait for Firebase, and a push failure must
    // never turn a saved property into an error response.
    if (id) {
      void notifyNewProperty({
        propertyId: id,
        title: str(fd, "title") || undefined,
        // `city` column only holds an id, the name comes from the form field
        city: str(fd, "city") || undefined,
        price,
        ownerId: userId,
      }).catch((pushError) => console.error("[mobileproperty] new property push failed:", pushError));
    }

    return NextResponse.json(
      { success: true, id, result, imagePaths: savedFiles, formDataSaved, formDataError },
      { headers: corsHeaders(origin) }
    );
  } catch (error) {
    // Remove files that were written for a property that never reached the database
    await Promise.all(savedFiles.map((f) => unlink(path.join(uploadsDir, f)).catch(() => undefined)));

    console.error("Upload failed:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Upload failed",
        error: (error as Error)?.message || "Unknown error",
      },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}

// ── GET: unchanged ──────────────────────────────────────────
export async function GET(req: NextRequest) {
  const origin = req.headers.get("origin");

  try {
    const allProperties = await db
      .select()
      .from(properties)
      .where(eq(properties.premium, false))
      .orderBy(desc(properties.id));

    return NextResponse.json(
      { success: true, data: allProperties },
      { headers: corsHeaders(origin) }
    );
  } catch (error) {
    console.error("Drizzle select error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch properties" },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}