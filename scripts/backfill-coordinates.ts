import { eq, sql } from 'drizzle-orm';
import { db } from "@/db/db";
import { properties } from "@/db/schema"; 

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const inIndia = (lat: number, lng: number) => lat >= 6 && lat <= 38 && lng >= 68 && lng <= 98;

type Coords = { lat: number; lng: number };

// Reads coordinates out of a Google Maps link, if they are present in it
function parseGoogleLocation(text?: string | null): Coords | null {
  if (!text) return null;
  const patterns = [
    /@(-?\d+\.\d+),(-?\d+\.\d+)/,
    /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
    /[?&](?:q|ll|query|destination)=(-?\d+\.\d+)(?:,|%2C)(-?\d+\.\d+)/,
    /^\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*$/,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      const lat = Number(m[1]);
      const lng = Number(m[2]);
      if (inIndia(lat, lng)) return { lat, lng };
    }
  }
  return null;
}

const cache = new Map<string, Coords | null>();

async function geocode(query: string): Promise<Coords | null> {
  if (cache.has(query)) return cache.get(query)!;
  await sleep(1100); // Nominatim allows 1 request per second
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=in&q=${encodeURIComponent(query)}`,
      { headers: { 'User-Agent': '101acres-backfill/1.0 (noreply@101acres.com)' } }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const hit = Array.isArray(data) && data[0] ? { lat: Number(data[0].lat), lng: Number(data[0].lon) } : null;
    const result = hit && inIndia(hit.lat, hit.lng) ? hit : null;
    cache.set(query, result);
    return result;
  } catch (e) {
    console.log(`    geocode error for "${query}": ${(e as Error).message}`);
    cache.set(query, null);
    return null;
  }
}

const clean = (v?: string | null) => (v ?? '').replace(/\s+/g, ' ').trim();

// Removes "Near ...", "Opposite ..." and similar phrases up to the next comma
const stripLandmarks = (s: string) =>
  s.replace(/\b(near|opposite|opp\.?|behind|beside|next to)\b[^,]*/gi, '').replace(/\s+/g, ' ').replace(/^[,\s]+|[,\s]+$/g, '');

// Builds a list of search texts, from most specific to least specific
function buildQueries(p: {
  city: string | null; area: string | null; landmark: string | null; address: string | null;
}): string[] {
  const city = clean(p.city);
  const area = clean(p.area);
  const address = clean(p.address) || clean(p.landmark);
  const pin = (address.match(/\b\d{6}\b/) || [])[0] || '';

  const list = [
    [area, city].filter(Boolean).join(', '),
    [area, pin].filter(Boolean).join(', '),
    pin,
    area,
    stripLandmarks(address),
    address,
    city,
  ]
    .filter((q) => q.length >= 3)
    .map((q) => (/india/i.test(q) ? q : `${q}, India`));

  return Array.from(new Set(list));
}

async function main() {
  const [rows] = await db.execute(sql`
    SELECT p.id,
           p.google_location AS googleLocation,
           p.landmark        AS landmark,
           p.address         AS address,
           p.city            AS cityId,
           p.area            AS areaId,
           c.name            AS city,
           a.name            AS area
    FROM properties p
    LEFT JOIN cities c ON c.id = p.city
    LEFT JOIN areas  a ON a.id = p.area
    WHERE p.latitude IS NULL AND p.is_deleted = 0
  `);

  const list = rows as unknown as {
    id: number; googleLocation: string | null; landmark: string | null; address: string | null;
    cityId: number | null; areaId: number | null; city: string | null; area: string | null;
  }[];

  console.log(`Properties without coordinates: ${list.length}`);

  let fromLink = 0, fromGeocode = 0, failed = 0;

  for (const p of list) {
    let coords: Coords | null = parseGoogleLocation(p.googleLocation);
    if (coords) fromLink++;

    if (!coords) {
      const queries = buildQueries(p);
      for (const q of queries) {
        coords = await geocode(q);
        if (coords) { fromGeocode++; console.log(`  id=${p.id} found via "${q}"`); break; }
      }

      if (!coords) {
        failed++;
        console.log(
          `  skipped id=${p.id} | cityId=${p.cityId} city="${p.city}" areaId=${p.areaId} area="${p.area}" ` +
          `| tried: ${queries.length ? queries.join(' || ') : '(nothing to search)'}`
        );
        continue;
      }
    }

    await db
      .update(properties)
      .set({ latitude: coords.lat.toFixed(7), longitude: coords.lng.toFixed(7) })
      .where(eq(properties.id, p.id));
  }

  console.log(`Done. From link: ${fromLink}, geocoded: ${fromGeocode}, skipped: ${failed}`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });