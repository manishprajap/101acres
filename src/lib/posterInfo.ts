// src/lib/posterInfo.ts
// Resolves users.role (agent / user / dealer / builder) and city names for properties.
import type { RowDataPacket } from "mysql2";
import { pool } from "@/db/db";

export type PosterInfo = {
  roles: Map<number, string>;
  cities: Map<string, string>;
};

const toIds = (values: unknown[]): number[] =>
  Array.from(
    new Set(
      values
        .map((v) => String(v ?? "").trim())
        .filter((v) => /^\d+$/.test(v))
        .map(Number)
    )
  );

export async function loadPosterInfo(
  userIds: unknown[],
  cityValues: unknown[]
): Promise<PosterInfo> {
  const roles = new Map<number, string>();
  const cities = new Map<string, string>();

  const uIds = toIds(userIds);
  if (uIds.length > 0) {
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT `id`, `role` FROM `users` WHERE `id` IN (?)",
        [uIds]
      );
      for (const row of rows) roles.set(Number(row.id), String(row.role ?? ""));
    } catch (error) {
      console.error("[posterInfo] users lookup failed:", error);
    }
  }

  const cIds = toIds(cityValues);
  if (cIds.length > 0) {
    try {
      // Change `cities` / `name` here if your table or column is named differently.
      const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT `id`, `name` FROM `cities` WHERE `id` IN (?)",
        [cIds]
      );
      for (const row of rows) cities.set(String(row.id), String(row.name ?? ""));
    } catch (error) {
      console.error("[posterInfo] cities lookup failed:", error);
    }
  }

  return { roles, cities };
}

/**
 * Returns a real city name.
 * Numeric values are looked up as city ids, text values are used as they are,
 * generic values like "National" are skipped.
 */
export function resolveCityName(
  info: PosterInfo,
  ...candidates: unknown[]
): string | null {
  for (const candidate of candidates) {
    const value = String(candidate ?? "").trim();
    if (!value) continue;

    if (/^\d+$/.test(value)) {
      const name = info.cities.get(value);
      if (name) return name;
      continue;
    }

    if (/^(national|international|null|undefined|-)$/i.test(value)) continue;
    return value;
  }
  return null;
}