// src/lib/propertyStoragePersistence.ts
import type { RowDataPacket } from "mysql2";
import { pool } from "@/db/db";
import type { PropertyFormData } from "@/lib/propertyFormStorage";
import type { propertyFormProperties } from "@/db/schema";

type PropertyStorageRow = typeof propertyFormProperties.$inferInsert;

const storageColumnNames: Record<string, string> = {
  user_id: "user_id",
  squareFt: "square_ft",
  propertyLocation: "property_location",
  propertyType: "property_type",
  residentialType: "residential_type",
  propertyFor: "property_For",
  priceFor: "price_for",
  googleLocation: "google_location",
  isDeleted: "is_deleted",
  isBankProperty: "is_bank_property",
  bankPropertyType: "bank_property_type",
  customBankType: "custom_bank_type",
  paymentType: "payment_type",
  paymentstatus: "paymentstatus",
  createdAt: "created_at",
  form_data: "form_data",
};

const formColumnAliases: Record<string, string[]> = {
  lookingTo: ["looking_to", "property_For"],
  propertyCategory: ["property_category", "residential_type"],
  propertyType: ["property_type"],
  listingTitle: ["title"],
  contactName: ["contact_name"],
  contactNumber: ["contact_number"],
  contactEmail: ["contact_email"],
  sendViaWhatsapp: ["send_via_whatsapp"],
  formattedAddress: ["formatted_address", "address", "google_location"],
  countryId: ["country_id"],
  stateId: ["state_id"],
  cityId: ["city_id"],
  price: ["price"],
  amount: ["amount"],
  country: ["country", "country_name"],
  state: ["state", "state_name"],
  city: ["city", "city_name"],
  areaId: ["area_id"],
  locality: ["locality"],
  subLocality: ["sub_locality", "landmark"],
  propertyOnFloor: ["property_on_floor", "floor_no"],
  expectedPrice: ["expected_price", "price"],
  carpetArea: ["carpet_area"],
  carpetAreaUnit: ["carpet_area_unit", "area_unit", "price_for"],
  plotArea: ["plot_area"],
  plotLength: ["plot_length"],
  plotBreadth: ["plot_breadth"],
  floorsAllowed: ["floors_allowed"],
  boundaryWall: ["boundary_wall"],
  constructionDone: ["construction_done"],
  plotPurpose: ["plot_purpose"],
  plotApprovalStatus: ["plot_approval_status"],
  plotAccess: ["plot_access"],
  plotRoadWidth: ["plot_road_width"],
  plotRoadWidthUnit: ["plot_road_width_unit"],
  furnishingItems: ["furnishing_items"],
  step: ["step", "current_step"],
  photos: ["photos", "images"],
  expectedReturns: ["expected_returns"],
  moveInPreference: ["move_in_preference"],
  propertyFacing: ["property_facing", "facing"],
  facingRoadWidth: ["facing_road_width", "road_width"],
  facingRoadWidthUnit: ["facing_road_width_unit", "road_width_unit"],
  amenities: ["amenities", "features"],
  propertyFeatures: ["property_features", "features"],
};

function toSnakeCase(value: string): string {
  return value.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function serializeDatabaseValue(value: unknown): unknown {
  if (value === undefined) return undefined;
  if (value !== null && typeof value === "object") return JSON.stringify(value);
  return value;
}

/**
 * MySQL JSON columns only accept valid JSON text. The mobile app sends
 * lists as "a, b, c" (or "" when empty), which fails with
 * "Invalid JSON text: 'Invalid value.' at position 0".
 *
 *   null / undefined            -> unchanged
 *   ""                          -> NULL if the column allows it, else "[]"
 *   already valid JSON text     -> kept
 *   "Pooja Room, Study Room"    -> '["Pooja Room","Study Room"]'
 *   number / boolean            -> JSON text
 */
function toJsonColumnValue(value: unknown, nullable: boolean): unknown {
  if (value === undefined || value === null) return value;

  if (typeof value !== "string") return JSON.stringify(value);

  const text = value.trim();
  if (text === "") return nullable ? null : "[]";

  try {
    JSON.parse(text);
    return text;
  } catch {
    return JSON.stringify(
      text
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    );
  }
}

function mapStorageRow(row: PropertyStorageRow): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (value === undefined) continue;
    const column = storageColumnNames[key] ?? toSnakeCase(key);
    values[column] = serializeDatabaseValue(value);
  }
  return values;
}

function mapFormData(
  formData: PropertyFormData,
  columns: Set<string>
): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(formData)) {
    const candidates = formColumnAliases[key] ?? [toSnakeCase(key)];
    for (const column of candidates) {
      if (columns.has(column)) values[column] = serializeDatabaseValue(value);
    }
  }
  return values;
}

export async function persistPropertyStorageRow(
  row: PropertyStorageRow,
  formData: PropertyFormData,
  existingPropertyId?: number
): Promise<number> {
  const [columnRows] = await pool.query<
    Array<RowDataPacket & { Field: string; Type: string; Null: string }>
  >("SHOW COLUMNS FROM `properties`");

  const availableColumns = new Set(columnRows.map((column) => column.Field));

  // JSON columns -> nullable?
  const jsonColumns = new Map<string, boolean>();
  for (const column of columnRows) {
    if (String(column.Type).toLowerCase() === "json") {
      jsonColumns.set(
        column.Field,
        String(column.Null).toUpperCase() === "YES"
      );
    }
  }

  if (!availableColumns.has("form_data")) {
    throw new Error(
      "The properties table is missing form_data; apply the property form data migration before saving listings"
    );
  }

  const values = {
    ...mapFormData(formData, availableColumns),
    ...mapStorageRow(row),
  };
  values.status = row.status;
  values.form_data = JSON.stringify(formData);

  const entries = Object.entries(values)
    .filter(
      ([column, value]) =>
        availableColumns.has(column) &&
        column !== "id" &&
        value !== undefined &&
        /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(column)
    )
    .map(([column, value]): [string, unknown] => {
      const nullable = jsonColumns.get(column);
      return nullable === undefined
        ? [column, value]
        : [column, toJsonColumnValue(value, nullable)];
    });

  if (entries.length === 0) {
    throw new Error("No compatible properties table columns were found");
  }

  if (existingPropertyId !== undefined) {
    const assignments = entries.map(([column]) => `\`${column}\` = ?`).join(", ");
    await pool.execute(
      `UPDATE \`properties\` SET ${assignments} WHERE \`id\` = ?`,
      [...entries.map(([, value]) => value), existingPropertyId]
    );
    return existingPropertyId;
  }

  const columns = entries.map(([column]) => `\`${column}\``).join(", ");
  const placeholders = entries.map(() => "?").join(", ");
  const [result] = await pool.execute(
    `INSERT INTO \`properties\` (${columns}) VALUES (${placeholders})`,
    entries.map(([, value]) => value)
  );
  const insertId = Number((result as { insertId?: number }).insertId);
  if (!Number.isSafeInteger(insertId) || insertId <= 0) {
    throw new Error("Property was inserted but the database did not return its ID");
  }
  return insertId;
}