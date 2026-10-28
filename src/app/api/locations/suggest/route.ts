// app/api/locations/suggest/route.ts
import { NextRequest, NextResponse } from "next/server";
import { and, like, sql, type SQL } from "drizzle-orm";

import { db } from "@/db/db";
import { propertyFormProperties as properties } from "@/db/schema";

/* ============================================================
   TYPES
============================================================ */

type Kind = "city" | "locality" | "mall";

interface Suggestion {
  id: string;
  label: string; // main text, e.g. "Lucknow"
  description: string; // secondary text, e.g. "Uttar Pradesh, India"
  kind: "City" | "Locality" | "Mall";
}

const KIND_LABEL: Record<Kind, Suggestion["kind"]> = {
  city: "City",
  locality: "Locality",
  mall: "Mall",
};

/* Google Places (New) primary types per field */
const PLACE_TYPES: Record<Kind, string[]> = {
  city: ["(cities)"],
  locality: ["sublocality", "sublocality_level_1", "neighborhood"],
  mall: ["shopping_mall"],
};

const MAX_RESULTS = 8;

function isKind(value: string | null): value is Kind {
  return value === "city" || value === "locality" || value === "mall";
}

/* ============================================================
   SOURCE 1 — your own published listings
============================================================ */

async function fromListings(
  kind: Kind,
  q: string,
  city: string
): Promise<Suggestion[]> {
  const cityName = sql<string>`COALESCE(
    JSON_UNQUOTE(JSON_EXTRACT(${properties.form_data}, '$.city')),
    CAST(${properties.city} AS CHAR)
  )`;
  const locality = sql<string | null>`COALESCE(
    JSON_UNQUOTE(JSON_EXTRACT(${properties.form_data}, '$.locality')),
    ${properties.landmark}
  )`;
  const mall = sql<string | null>`COALESCE(
    JSON_UNQUOTE(JSON_EXTRACT(${properties.form_data}, '$.society')),
    JSON_UNQUOTE(JSON_EXTRACT(${properties.form_data}, '$.towerBlock'))
  )`;
  const column = kind === "city" ? cityName : kind === "locality" ? locality : mall;

  const escaped = q.replace(/[\\%_]/g, "\\$&");

  const conditions: SQL[] = [
    sql`COALESCE(${properties.isDeleted}, false) = false`,
    sql`LOWER(COALESCE(
      JSON_UNQUOTE(JSON_EXTRACT(${properties.form_data}, '$.status')),
      ${properties.status},
      ''
    )) IN ('active', 'published')`,
    sql`${column} IS NOT NULL`,
    like(column, `%${escaped}%`),
  ];

  // Localities / malls should belong to the chosen city
  if (kind !== "city" && city) {
    conditions.push(
      sql`(
        ${cityName} = ${city}
        OR JSON_UNQUOTE(JSON_EXTRACT(${properties.form_data}, '$.cityId')) = ${city}
      )`
    );
  }

  const rows = await db
    .selectDistinct({ value: column })
    .from(properties)
    .where(and(...conditions))
    .limit(5);

  return rows
    .map((r) => (r.value ?? "").trim())
    .filter(Boolean)
    .map((value) => ({
      id: `db:${kind}:${value.toLowerCase()}`,
      label: value,
      description: city && kind !== "city" ? city : "",
      kind: KIND_LABEL[kind],
    }));
}

/* ============================================================
   SOURCE 2 — Google Places Autocomplete (New)
   Env: GOOGLE_MAPS_SERVER_KEY  (enable "Places API (New)")
============================================================ */

interface PlacesResponse {
  suggestions?: {
    placePrediction?: {
      placeId?: string;
      structuredFormat?: {
        mainText?: { text?: string };
        secondaryText?: { text?: string };
      };
    };
  }[];
}

async function fromGoogle(
  kind: Kind,
  q: string,
  city: string
): Promise<Suggestion[]> {
  const key = process.env.GOOGLE_MAPS_SERVER_KEY;
  if (!key) return [];

  // Bias localities / malls towards the selected city
  const input = kind !== "city" && city ? `${q}, ${city}` : q;

  const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask":
        "suggestions.placePrediction.placeId,suggestions.placePrediction.structuredFormat",
    },
    body: JSON.stringify({
      input,
      includedPrimaryTypes: PLACE_TYPES[kind],
      includedRegionCodes: ["in"],
      languageCode: "en",
    }),
    signal: AbortSignal.timeout(4000),
    cache: "no-store",
  });

  if (!res.ok) {
    console.error("Places autocomplete failed:", res.status, await res.text());
    return [];
  }

  const data = (await res.json()) as PlacesResponse;
  const out: Suggestion[] = [];

  for (const item of data.suggestions ?? []) {
    const p = item.placePrediction;
    const label = p?.structuredFormat?.mainText?.text?.trim();
    if (!p || !label) continue;

    out.push({
      id: `g:${p.placeId ?? label}`,
      label,
      description: p.structuredFormat?.secondaryText?.text?.trim() ?? "",
      kind: KIND_LABEL[kind],
    });
  }

  return out;
}

/* ============================================================
   GET /api/locations/suggest?q=luck&kind=city|locality|mall&city=Lucknow
============================================================ */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const q = (searchParams.get("q") ?? "").trim().slice(0, 80);
  const kindParam = searchParams.get("kind");
  const city = (searchParams.get("city") ?? "").trim().slice(0, 80);

  if (!isKind(kindParam)) {
    return NextResponse.json(
      { success: false, error: "kind must be city, locality or mall" },
      { status: 400 }
    );
  }

  if (q.length < 2) {
    return NextResponse.json({ success: true, suggestions: [] });
  }

  // One source failing must not break the other
  const [own, google] = await Promise.all([
    fromListings(kindParam, q, city).catch((e) => {
      console.error("Listing suggestions error:", e);
      return [] as Suggestion[];
    }),
    fromGoogle(kindParam, q, city).catch((e) => {
      console.error("Google suggestions error:", e);
      return [] as Suggestion[];
    }),
  ]);

  // Merge + dedupe by label (your own listings first)
  const seen = new Set<string>();
  const suggestions: Suggestion[] = [];

  for (const s of [...own, ...google]) {
    const k = s.label.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    suggestions.push(s);
    if (suggestions.length >= MAX_RESULTS) break;
  }

  return NextResponse.json({ success: true, suggestions });
}