import type { propertyFormProperties } from "@/db/schema";

export type PropertyFormData = Record<string, unknown>;
export type PropertyStorageStatus = "draft" | "active";

export function normalizePropertyStorageStatus(
  value: unknown
): PropertyStorageStatus | null {
  if (typeof value !== "string") return null;
  const status = value.trim().toLowerCase();
  if (status === "draft") return "draft";
  if (status === "active" || status === "published") return "active";
  return null;
}

export function parsePropertyFormData(value: unknown): PropertyFormData {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as PropertyFormData;
  }
  if (typeof value !== "string" || value === "") return {};

  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as PropertyFormData)
      : {};
  } catch {
    return {};
  }
}

function text(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const result = String(value).trim();
  return result || null;
}

function integer(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

function decimal(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? String(parsed) : null;
}

function photos(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  if (typeof value !== "string") return [];

  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter((item): item is string => typeof item === "string");
    if (typeof parsed === "string" && parsed.trim()) return [parsed.trim()];
    if (parsed && typeof parsed === "object") {
      const entry = parsed as Record<string, unknown>;
      const candidate = entry.url ?? entry.path ?? entry.src ?? entry.filename ?? entry.name;
      return typeof candidate === "string" && candidate.trim() ? [candidate.trim()] : [];
    }
    return [];
  } catch {
    return value.trim() ? [value.trim()] : [];
  }
}

function imageUrl(value: unknown): string | null {
  const candidate = text(value);
  if (!candidate) return null;
  if (/^(https?:|data:)/i.test(candidate)) return candidate;
  if (candidate.startsWith("/api/uploads/")) return candidate;
  if (candidate.startsWith("/uploads/")) {
    return `/api/uploads/${candidate.slice("/uploads/".length).split("/").map(encodeURIComponent).join("/")}`;
  }
  if (candidate.startsWith("/")) return candidate;
  return `/api/uploads/${encodeURIComponent(candidate)}`;
}

export function buildPropertyStorageRow(
  userId: number,
  status: PropertyStorageStatus,
  formData: PropertyFormData
): typeof propertyFormProperties.$inferInsert {
  const propertyType = text(formData.propertyType);
  const cityName = text(formData.city);
  const location =
    text(formData.formattedAddress) ??
    [text(formData.locality), cityName].filter(Boolean).join(", ");
  const title =
    text(formData.listingTitle) ??
    [propertyType, text(formData.lookingTo), cityName].filter(Boolean).join(" ");
  const area = [formData.plotArea, formData.carpetArea, formData.builtUpArea, formData.superBuiltUpArea]
    .find((value) => text(value) !== null);

  return {
    user_id: userId,
    title: title.slice(0, 255),
    squareFt: integer(area),
    beds: integer(formData.beds),
    baths: integer(formData.baths),
    price: decimal(formData.expectedPrice),
    image: photos(formData.photos)[0] ?? null,
    propertyLocation: location ? location.slice(0, 255) : null,
    propertyType: propertyType?.slice(0, 255) ?? null,
    residentialType: text(formData.propertyCategory),
    propertyFor: text(formData.lookingTo),
    priceFor: text(formData.carpetAreaUnit),
    country: integer(formData.countryId),
    state: integer(formData.stateId),
    city: integer(formData.cityId),
    landmark: text(formData.subLocality) ?? text(formData.locality),
    address: text(formData.formattedAddress),
    area: integer(formData.areaId),
    googleLocation: text(formData.formattedAddress),
    status: status === "active" ? "Active" : "draft",
    isDeleted: false,
    form_data: JSON.stringify(formData),
  };
}

export function serializePropertyStorageRow(row: Record<string, unknown>) {
  const formData = parsePropertyFormData(row.form_data);
  const toSnake = (value: string) => value.replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`);
  const legacyCategory =
    typeof row.propertyType === "string" &&
    ["residential", "commercial"].includes(row.propertyType.trim().toLowerCase());
  const result: Record<string, unknown> = { ...row };
  delete result.form_data;
  const savedPhotos = photos(formData.photos);
  const visiblePhotos = savedPhotos.length > 0 ? savedPhotos : photos(row.image);

  for (const [key, value] of Object.entries(formData)) {
    result[toSnake(key)] = value;
  }

  for (const [key, value] of Object.entries(row)) {
    if (value === undefined || value === null || key === "form_data") continue;
    const normalizedKey = key.toLowerCase().replace(/_([a-z])/g, (_match, letter: string) =>
      letter.toUpperCase()
    );
    const targetKey = toSnake(normalizedKey);
    if (formData[normalizedKey] === undefined && result[targetKey] == null) {
      result[targetKey] = value;
    }
  }

  const fallbacks: Record<string, unknown> = {
    listing_title: row.title,
    contact_name: row.contactName ?? row.contact_name,
    contact_number: row.contactNumber ?? row.contact_number,
    contact_email: row.contactEmail ?? row.contact_email,
    country_id: row.countryId ?? row.country_id ?? row.country,
    state_id: row.stateId ?? row.state_id ?? row.state,
    city_id: row.cityId ?? row.city_id ?? row.city,
    area_id: row.areaId ?? row.area_id ?? row.area,
    sub_locality: row.subLocality ?? row.sub_locality ?? row.landmark,
    formatted_address: row.formattedAddress ?? row.formatted_address ?? row.address ?? row.googleLocation,
    expected_price: row.expectedPrice ?? row.expected_price ?? row.price,
    carpet_area: row.carpetArea ?? row.carpet_area ?? row.squareFt,
    carpet_area_unit: row.carpetAreaUnit ?? row.carpet_area_unit ?? row.priceFor,
    looking_to: row.lookingTo ?? row.looking_to ?? row.propertyFor,
    property_category:
      row.propertyCategory ??
      row.property_category ??
      (legacyCategory ? row.propertyType : row.residentialType),
    property_type:
      row.property_type ??
      (legacyCategory ? row.residentialType : row.propertyType),
    property_on_floor: row.propertyOnFloor ?? row.property_on_floor ?? row.floorNo ?? row.floor_no,
    property_facing: row.propertyFacing ?? row.property_facing ?? row.facing,
    facing_road_width: row.facingRoadWidth ?? row.facing_road_width ?? row.roadWidth ?? row.road_width,
    facing_road_width_unit:
      row.facingRoadWidthUnit ?? row.facing_road_width_unit ?? row.roadWidthUnit ?? row.road_width_unit,
    send_via_whatsapp: row.sendViaWhatsapp ?? row.send_via_whatsapp,
    price_negotiable: row.priceNegotiable ?? row.price_negotiable ?? row.negotiable,
    property_features: row.propertyFeatures ?? row.property_features ?? row.features,
    photos: row.photos ?? row.images ?? row.image,
  };
  for (const [key, value] of Object.entries(fallbacks)) {
    const formKey = key.replace(/_([a-z])/g, (_match, letter: string) => letter.toUpperCase());
    if (formData[formKey] === undefined && value !== undefined && value !== null) {
      result[key] = value;
    }
  }

  if (
    formData.lookingTo === undefined &&
    typeof result.looking_to === "string"
  ) {
    const lookingTo = result.looking_to.trim().toLowerCase();
    result.looking_to =
      lookingTo === "sale" || lookingTo === "sell"
        ? "sell"
        : lookingTo === "rent" || lookingTo.includes("lease")
          ? "rent"
          : lookingTo.includes("pg") || lookingTo.includes("guest")
            ? "pg"
            : result.looking_to;
  }

  result.status =
    normalizePropertyStorageStatus(row.status ?? formData.status) === "active"
      ? "Active"
      : "draft";
  result.current_step = Number(
    formData.step ?? formData.currentStep ?? row.current_step ?? row.currentStep ?? 1
  );
  const latitude = formData.latitude ?? result.latitude ?? row.latitude;
  const longitude = formData.longitude ?? result.longitude ?? row.longitude;
  const numericLatitude = latitude == null ? null : Number(latitude);
  const numericLongitude = longitude == null ? null : Number(longitude);
  result.latitude =
    numericLatitude !== null && Number.isFinite(numericLatitude)
      ? numericLatitude
      : null;
  result.longitude =
    numericLongitude !== null && Number.isFinite(numericLongitude)
      ? numericLongitude
      : null;
  result.place_id = formData.placeId ?? result.place_id ?? row.placeId ?? null;
  result.formatted_address =
    formData.formattedAddress ??
    result.formatted_address ??
    row.googleLocation ??
    row.address ??
    null;
  result.geocoded_address =
    formData.geocodedAddress ??
    formData.formattedAddress ??
    result.geocoded_address ??
    result.formatted_address ??
    null;
  result.photos = visiblePhotos;
  const imageUrls = visiblePhotos
    .map((photo) => imageUrl(photo))
    .filter((photo): photo is string => photo !== null);
  result.images = imageUrls;
  result.image = imageUrls[0] ?? null;
  result.expected_price = formData.expectedPrice ?? result.expected_price ?? row.price ?? null;
  result.carpet_area =
    formData.carpetArea ??
    formData.plotArea ??
    formData.builtUpArea ??
    result.carpet_area ??
    row.squareFt ??
    null;
  result.carpet_area_unit =
    formData.carpetAreaUnit ?? result.carpet_area_unit ?? row.priceFor ?? null;
  result.looking_to = formData.lookingTo ?? result.looking_to ?? row.propertyFor ?? null;
  result.property_category =
    formData.propertyCategory ?? result.property_category ?? row.residentialType ?? null;
  result.property_type = formData.propertyType ?? result.property_type ?? row.propertyType ?? null;
  result.created_at = row.created_at ?? row.createdAt ?? null;
  result.furnishing_items =
    formData.furnishingItems && typeof formData.furnishingItems === "object"
      ? formData.furnishingItems
      : {};

  return result;
}
