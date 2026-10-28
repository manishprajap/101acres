// src/lib/property-geocode.ts

import { geocodeCity } from "@/lib/geocode";

export type GeocodeStatus =
  | "no_city"
  | "reused"
  | "generated_google"
  | "generated_osm"
  | "failed";

interface ExistingGeo {
  latitude: string | null;
  longitude: string | null;
  geocoded_address: string | null;
}

export interface ResolvedGeo {
  latitude: string | null;
  longitude: string | null;
  geocodedAddress: string | null;
  status: GeocodeStatus;
}

/**
 * City se coordinates nikalta hai.
 * - city empty ho to purane values waise hi rehte hain
 * - same city + coordinates pehle se hain to reuse
 * - geocode fail ho to purane values overwrite nahi hote
 *   (city badli ho to purane galat coordinates clear hote hain)
 */
export async function resolvePropertyGeocode(
  cityInput: unknown,
  existing?: ExistingGeo | null
): Promise<ResolvedGeo> {
  const city = typeof cityInput === "string" ? cityInput.trim() : "";

  let latitude = existing?.latitude ?? null;
  let longitude = existing?.longitude ?? null;
  let geocodedAddress = existing?.geocoded_address ?? null;

  if (!city) {
    return { latitude, longitude, geocodedAddress, status: "no_city" };
  }

  const existingCity = (existing?.geocoded_address ?? "").trim();

  const canReuse =
    !!existing &&
    existing.latitude !== null &&
    existing.longitude !== null &&
    existingCity.toLowerCase() === city.toLowerCase();

  if (canReuse) {
    return { latitude, longitude, geocodedAddress, status: "reused" };
  }

  const coords = await geocodeCity(city);

  if (coords) {
    return {
      latitude: coords.lat.toFixed(7),
      longitude: coords.lng.toFixed(7),
      geocodedAddress: city,
      status: coords.source === "google" ? "generated_google" : "generated_osm",
    };
  }

  // Geocode fail: city badli hai to purane coordinates galat hain
  if (existingCity && existingCity.toLowerCase() !== city.toLowerCase()) {
    latitude = null;
    longitude = null;
    geocodedAddress = null;
  }

  return { latitude, longitude, geocodedAddress, status: "failed" };
}