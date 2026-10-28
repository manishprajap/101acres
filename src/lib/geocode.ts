// src/lib/geocode.ts

import type { PropertyFormData } from "@/types/property";

const GOOGLE_GEOCODE_URL =
  "https://maps.googleapis.com/maps/api/geocode/json";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

const GEOCODE_TIMEOUT_MS = 6000;

export interface Coordinates {
  lat: number;
  lng: number;
}

export type GeocodeSource = "google" | "osm";

export interface GeocodeResult extends Coordinates {
  source: GeocodeSource;
}

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isValidCoordinate(lat: unknown, lng: unknown): boolean {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

async function fetchJson(
  url: string,
  headers: Record<string, string> = {}
): Promise<any | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEOCODE_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers,
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(`[geocode] HTTP error ${response.status} for ${url.split("?")[0]}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("[geocode] Request timed out:", url.split("?")[0]);
    } else {
      console.error("[geocode] Request error:", error);
    }
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Builds a complete property address.
 * Example: Mall, Vibhuti Khand, Gomti Nagar, Lucknow
 */
export function buildAddress(fd: PropertyFormData, includeMall = true): string {
  return [
    includeMall ? clean(fd.mallName) : "",
    clean(fd.subLocality),
    clean(fd.locality),
    clean(fd.city),
  ]
    .filter(Boolean)
    .join(", ");
}

/**
 * Google server-side geocoding.
 */
export async function geocodeWithGoogle(
  address: string
): Promise<Coordinates | null> {
  const key = clean(process.env.GOOGLE_MAPS_SERVER_KEY);

  if (!key) {
    console.warn(
      "[geocode] GOOGLE_MAPS_SERVER_KEY is not set (dev server restart kiya after .env change?)"
    );
    return null;
  }

  const cleanAddress = clean(address);
  if (!cleanAddress) return null;

  const url = new URL(GOOGLE_GEOCODE_URL);
  url.searchParams.set("address", cleanAddress);
  url.searchParams.set("components", "country:IN");
  url.searchParams.set("region", "in");
  url.searchParams.set("key", key);

  const data = await fetchJson(url.toString());
  if (!data) return null;

  if (data.status !== "OK" || !Array.isArray(data.results)) {
    if (data.status !== "ZERO_RESULTS") {
      // REQUEST_DENIED / OVER_QUERY_LIMIT / INVALID_REQUEST yahin dikhega
      console.error(
        "[geocode] Google geocoding failed:",
        data.status,
        data.error_message ?? ""
      );
    }
    return null;
  }

  const location = data.results[0]?.geometry?.location;
  const lat = Number(location?.lat);
  const lng = Number(location?.lng);

  if (!isValidCoordinate(lat, lng)) {
    console.error("[geocode] Google returned invalid coordinates");
    return null;
  }

  return { lat, lng };
}

/**
 * OpenStreetMap Nominatim fallback (free, no key).
 * Usage policy: User-Agent zaroori hai, low volume ke liye theek hai.
 */
export async function geocodeWithOsm(
  address: string
): Promise<Coordinates | null> {
  const cleanAddress = clean(address);
  if (!cleanAddress) return null;

  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("q", cleanAddress);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "in");

  const data = await fetchJson(url.toString(), {
    "User-Agent": "101acres-app/1.0 (property geocoding)",
    "Accept-Language": "en",
  });

  if (!Array.isArray(data) || data.length === 0) {
    console.error("[geocode] OSM returned no result for:", cleanAddress);
    return null;
  }

  const lat = Number(data[0]?.lat);
  const lng = Number(data[0]?.lon);

  if (!isValidCoordinate(lat, lng)) {
    console.error("[geocode] OSM returned invalid coordinates");
    return null;
  }

  return { lat, lng };
}

/**
 * Backward compatible: Google only.
 */
export async function geocodeAddress(
  address: string
): Promise<Coordinates | null> {
  return geocodeWithGoogle(address);
}

/**
 * City coordinates: pehle Google, fail hone par OSM.
 */
export async function geocodeCity(
  city: string
): Promise<GeocodeResult | null> {
  const cleanCity = clean(city);
  if (!cleanCity) return null;

  const query = `${cleanCity}, India`;

  const google = await geocodeWithGoogle(query);
  if (google) return { ...google, source: "google" };

  const osm = await geocodeWithOsm(query);
  if (osm) return { ...osm, source: "osm" };

  return null;
}

/**
 * Main property geocoder (CITY LEVEL by design).
 * mallName / subLocality / locality use nahi hote.
 */
export async function geocodeLocation(
  fd: PropertyFormData
): Promise<GeocodeResult | null> {
  const city = clean(fd.city);

  if (!city) {
    console.warn("[geocode] Property city is missing; cannot generate coordinates");
    return null;
  }

  const result = await geocodeCity(city);

  if (result) return result;

  console.warn(`[geocode] Could not geocode city "${city}" (Google + OSM both failed)`);
  return null;
}