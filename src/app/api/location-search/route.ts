// import { NextRequest, NextResponse } from 'next/server';
// import { corsHeaders } from '@/lib/cors';

// interface GoogleAddressComponent {
//   long_name: string;
//   short_name: string;
//   types: string[];
// }

// interface GoogleGeocodeResult {
//   formatted_address: string;
//   geometry: {
//     location: {
//       lat: number;
//       lng: number;
//     };
//   };
//   address_components: GoogleAddressComponent[];
// }

// interface GoogleGeocodeResponse {
//   status: string;
//   results: GoogleGeocodeResult[];
// }

// const getAddressComponent = (
//   components: GoogleAddressComponent[],
//   types: string[]
// ): string => {
//   const component = components.find((item) =>
//     types.some((type) => item.types.includes(type))
//   );

//   return component?.long_name || '';
// };

// export async function OPTIONS(req: NextRequest) {
//   const origin = req.headers.get('origin');

//   return new NextResponse(null, {
//     status: 204,
//     headers: corsHeaders(origin),
//   });
// }

// export async function GET(req: NextRequest) {
//   // IMPORTANT:
//   // origin must be declared inside GET().
//   const origin = req.headers.get('origin');

//   try {
//     const { searchParams } = new URL(req.url);

//     const q = searchParams.get('q')?.trim();

//     const latParam = searchParams.get('lat');
//     const lngParam = searchParams.get('lng');

//     const apiKey =
//       process.env.GOOGLE_MAPS_SERVER_KEY;

//     // =====================================================
//     // GOOGLE API KEY CHECK
//     // =====================================================

//     if (!apiKey) {
//       console.error(
//         'GOOGLE_MAPS_SERVER_KEY is not configured'
//       );

//       return NextResponse.json(
//         {
//           error: 'Google Maps API key is not configured',
//           results: [],
//         },
//         {
//           status: 500,
//           headers: corsHeaders(origin),
//         }
//       );
//     }

//     if (latParam && lngParam) {
//       const lat = Number(latParam);
//       const lng = Number(lngParam);

//       // Validate coordinates
//       if (
//         !Number.isFinite(lat) ||
//         !Number.isFinite(lng) ||
//         Math.abs(lat) > 90 ||
//         Math.abs(lng) > 180
//       ) {
//         return NextResponse.json(
//           {
//             status: 'INVALID_REQUEST',
//             results: [],
//           },
//           {
//             status: 400,
//             headers: corsHeaders(origin),
//           }
//         );
//       }

//       const googleUrl =
//         'https://maps.googleapis.com/maps/api/geocode/json' +
//         `?latlng=${encodeURIComponent(`${lat},${lng}`)}` +
//         `&key=${encodeURIComponent(apiKey)}`;

//       const res = await fetch(googleUrl, {
//         next: {
//           revalidate: 86400,
//         },
//       });

//       if (!res.ok) {
//         console.error(
//           'Google reverse geocode HTTP error:',
//           res.status
//         );

//         return NextResponse.json(
//           {
//             status: 'GOOGLE_ERROR',
//             results: [],
//           },
//           {
//             status: 502,
//             headers: corsHeaders(origin),
//           }
//         );
//       }

//       const data =
//         (await res.json()) as GoogleGeocodeResponse;

//       if (
//         data.status !== 'OK' ||
//         !Array.isArray(data.results) ||
//         data.results.length === 0
//       ) {
//         return NextResponse.json(
//           {
//             status: data.status,
//             results: [],
//           },
//           {
//             status: 200,
//             headers: corsHeaders(origin),
//           }
//         );
//       }

//       const result = data.results[0];

//       const components =
//         result.address_components || [];

//       // Find city
//       const city =
//         getAddressComponent(
//           components,
//           ['locality']
//         ) ||
//         getAddressComponent(
//           components,
//           ['postal_town']
//         ) ||
//         getAddressComponent(
//           components,
//           ['administrative_area_level_2']
//         ) ||
//         getAddressComponent(
//           components,
//           ['administrative_area_level_1']
//         );

//       // Find area
//       const area =
//         getAddressComponent(
//           components,
//           [
//             'sublocality',
//             'sublocality_level_1',
//           ]
//         ) ||
//         getAddressComponent(
//           components,
//           ['neighborhood']
//         );

//       // Example:
//       // Connaught Place, New Delhi
//       const label =
//         [area, city]
//           .filter(Boolean)
//           .join(', ') ||
//         result.formatted_address ||
//         'Your location';

//       return NextResponse.json(
//         {
//           status: 'OK',

//           results: [
//             {
//               lat,
//               lng,
//               label,
//               city,
//             },
//           ],
//         },
//         {
//           status: 200,
//           headers: corsHeaders(origin),
//         }
//       );
//     }

//     if (!q || q.length < 3) {
//       return NextResponse.json(
//         {
//           results: [],
//         },
//         {
//           status: 200,
//           headers: corsHeaders(origin),
//         }
//       );
//     }

//     const googleUrl =
//       'https://maps.googleapis.com/maps/api/geocode/json' +
//       `?address=${encodeURIComponent(q)}` +
//       `&components=country:IN` +
//       `&key=${encodeURIComponent(apiKey)}`;

//     const res = await fetch(googleUrl, {
//       next: {
//         revalidate: 86400,
//       },
//     });

//     if (!res.ok) {
//       console.error(
//         'Google geocode HTTP error:',
//         res.status
//       );

//       return NextResponse.json(
//         {
//           error: 'Google Geocoding API error',
//           results: [],
//         },
//         {
//           status: 502,
//           headers: corsHeaders(origin),
//         }
//       );
//     }

//     const data =
//       (await res.json()) as GoogleGeocodeResponse;

//     if (
//       data.status !== 'OK' ||
//       !Array.isArray(data.results)
//     ) {
//       return NextResponse.json(
//         {
//           status: data.status,
//           results: [],
//         },
//         {
//           status: 200,
//           headers: corsHeaders(origin),
//         }
//       );
//     }

//     const results = data.results
//       .slice(0, 5)
//       .map((r) => {
//         const components =
//           r.address_components || [];

//         const city =
//           getAddressComponent(
//             components,
//             ['locality']
//           ) ||
//           getAddressComponent(
//             components,
//             ['postal_town']
//           ) ||
//           getAddressComponent(
//             components,
//             ['administrative_area_level_2']
//           ) ||
//           getAddressComponent(
//             components,
//             ['administrative_area_level_1']
//           );

//         const area =
//           getAddressComponent(
//             components,
//             [
//               'sublocality',
//               'sublocality_level_1',
//             ]
//           ) ||
//           getAddressComponent(
//             components,
//             ['neighborhood']
//           );

//         return {
//           lat: r.geometry.location.lat,
//           lng: r.geometry.location.lng,

//           label: r.formatted_address
//             .split(',')
//             .slice(0, 3)
//             .join(',')
//             .trim(),

//           city,

//           area,
//         };
//       });

//     // IMPORTANT:
//     // CORS headers MUST also be present
//     // on successful response.
//     return NextResponse.json(
//       {
//         status: 'OK',
//         results,
//       },
//       {
//         status: 200,
//         headers: corsHeaders(origin),
//       }
//     );
//   } catch (error) {
//     console.error(
//       'Geocode error:',
//       error
//     );

//     return NextResponse.json(
//       {
//         error: 'Geocoding failed',
//         results: [],
//       },
//       {
//         status: 500,
//         headers: corsHeaders(origin),
//       }
//     );
//   }
// }

// src/app/api/location-search/route.ts

import { NextRequest, NextResponse } from "next/server";
import {
  and,
  desc,
  eq,
  like,
  or,
  sql,
} from "drizzle-orm";

import { db } from "@/db/db";
import { propertyFormProperties as properties } from "@/db/schema";

/* ============================================================
   TYPES
============================================================ */

type SearchField = "city" | "locality";

type SuggestionType = "City" | "Locality" | "Project";

interface LocationSuggestion {
  placeId: string;
  mainText: string;
  secondaryText: string;
  fullText: string;
  type: SuggestionType;
  types: string[];
  distanceMeters?: number;
  source?: "database" | "google";
  latitude?: number;
  longitude?: number;
}

interface Coordinate {
  lat: number;
  lng: number;
}

/* ============================================================
   CONFIG
============================================================ */

const MIN_QUERY_LENGTH = 2;

const MAX_DB_ROWS = 150;

const MAX_RESULTS = 12;

const GOOGLE_SEARCH_RADIUS_METERS = 30000;

// Your existing project uses Google server-side geocoding.
// Support both common env names so you don't have to rename
// an already configured key.
const GOOGLE_API_KEY =
  process.env.GOOGLE_MAPS_SERVER_KEY ||
  process.env.GOOGLE_MAPS_API_KEY ||
  process.env.GOOGLE_API_KEY ||
  "";

/* ============================================================
   CORS
============================================================ */

function corsHeaders(origin: string | null): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  };
}

/* ============================================================
   OPTIONS
============================================================ */

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");

  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

/* ============================================================
   HELPERS
============================================================ */

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[,\-_/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const n = Number(value);

  return Number.isFinite(n) ? n : null;
}

/* ============================================================
   HAVERSINE DISTANCE
   Returns meters
============================================================ */

function distanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const earthRadius = 6371000;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadius * c;
}

/* ============================================================
   FORMAT DISTANCE
============================================================ */

function formatDistance(meters: number): string {
  if (!Number.isFinite(meters)) {
    return "";
  }

  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }

  const km = meters / 1000;

  if (km < 10) {
    return `${km.toFixed(1)} km`;
  }

  return `${Math.round(km)} km`;
}

/* ============================================================
   GOOGLE CITY GEOCODING
============================================================ */

async function geocodeCity(city: string): Promise<Coordinate | null> {
  if (!GOOGLE_API_KEY) {
    console.warn(
      "[location-search] Google API key is not configured"
    );

    return null;
  }

  const url = new URL(
    "https://maps.googleapis.com/maps/api/geocode/json"
  );

  url.searchParams.set("address", `${city}, India`);
  url.searchParams.set("components", "country:IN");
  url.searchParams.set("region", "in");
  url.searchParams.set("key", GOOGLE_API_KEY);

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(
        "[location-search] Google geocoding HTTP error:",
        response.status
      );

      return null;
    }

    const data = await response.json();

    if (data?.status !== "OK") {
      console.warn(
        "[location-search] Google geocoding status:",
        data?.status
      );

      return null;
    }

    const location =
      data?.results?.[0]?.geometry?.location;

    const lat = Number(location?.lat);
    const lng = Number(location?.lng);

    if (!isValidCoordinate(lat, lng)) {
      return null;
    }

    return {
      lat,
      lng,
    };
  } catch (error) {
    console.error(
      "[location-search] City geocoding failed:",
      error
    );

    return null;
  }
}

/* ============================================================
   GOOGLE PLACES FALLBACK
   Uses Places API (New) Text Search.
============================================================ */

async function googlePlacesFallback(
  query: string,
  city: string,
  cityCoordinates: Coordinate | null
): Promise<LocationSuggestion[]> {
  if (!GOOGLE_API_KEY) {
    return [];
  }

  try {
    const body: Record<string, unknown> = {
      textQuery: `${query}, ${city}, India`,
      languageCode: "en",
      regionCode: "IN",
      maxResultCount: 10,
    };

    if (cityCoordinates) {
      body.locationBias = {
        circle: {
          center: {
            latitude: cityCoordinates.lat,
            longitude: cityCoordinates.lng,
          },
          radius: GOOGLE_SEARCH_RADIUS_METERS,
        },
      };
    }

    const response = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": GOOGLE_API_KEY,
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.location,places.types",
        },
        body: JSON.stringify(body),
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const text = await response.text();

      console.error(
        "[location-search] Google Places HTTP error:",
        response.status,
        text
      );

      return [];
    }

    const data = await response.json();

    const places = Array.isArray(data?.places)
      ? data.places
      : [];

    return places
      .map((place: any): LocationSuggestion | null => {
        const lat = Number(place?.location?.latitude);
        const lng = Number(place?.location?.longitude);

        if (!isValidCoordinate(lat, lng)) {
          return null;
        }

        const mainText =
          clean(place?.displayName?.text) ||
          clean(place?.formattedAddress);

        if (!mainText) {
          return null;
        }

        const formattedAddress =
          clean(place?.formattedAddress);

        let secondaryText = formattedAddress;

        if (
          secondaryText &&
          normalize(secondaryText).startsWith(
            normalize(mainText)
          )
        ) {
          secondaryText = secondaryText
            .slice(mainText.length)
            .replace(/^,\s*/, "")
            .trim();
        }

        const types: string[] = Array.isArray(
          place?.types
        )
          ? place.types.filter(
              (item: unknown): item is string =>
                typeof item === "string"
            )
          : [];

        const lowerTypes = types.map((item) =>
          item.toLowerCase()
        );

        const isProject =
          lowerTypes.some((type) =>
            [
              "real_estate_agency",
              "real_estate_agent",
              "housing_complex",
              "apartment_complex",
              "residential_complex",
              "premise",
            ].includes(type)
          ) ||
          /(?:residency|residential|heights|homes|villa|villas|apartments?|tower|towers|society|nagar|enclave|greens|city|park)/i.test(
            mainText
          );

        const type: SuggestionType = isProject
          ? "Project"
          : "Locality";

        const distance =
          cityCoordinates
            ? distanceMeters(
                cityCoordinates.lat,
                cityCoordinates.lng,
                lat,
                lng
              )
            : undefined;

        return {
          placeId:
            clean(place?.id) ||
            `google-${normalize(mainText)}`,
          mainText,
          secondaryText,
          fullText: formattedAddress || mainText,
          type,
          types,
          distanceMeters: distance,
          source: "google",
          latitude: lat,
          longitude: lng,
        };
      })
      .filter(
        (
          item: LocationSuggestion | null
        ): item is LocationSuggestion => item !== null
      );
  } catch (error) {
    console.error(
      "[location-search] Google Places fallback failed:",
      error
    );

    return [];
  }
}

/* ============================================================
   CITY SEARCH
============================================================ */

async function searchCities(
  query: string
): Promise<LocationSuggestion[]> {
  const pattern = `%${query}%`;
  const cityName = sql<string>`COALESCE(
    JSON_UNQUOTE(JSON_EXTRACT(${properties.form_data}, '$.city')),
    CAST(${properties.city} AS CHAR)
  )`;
  const latitude = sql<string | null>`JSON_UNQUOTE(
    JSON_EXTRACT(${properties.form_data}, '$.latitude')
  )`;
  const longitude = sql<string | null>`JSON_UNQUOTE(
    JSON_EXTRACT(${properties.form_data}, '$.longitude')
  )`;

  try {
    /*
      We intentionally use the existing properties table as
      the first source of known cities.

      This means a city already present in your DB appears
      immediately without depending on Google.
    */

    const rows = await db
      .select({
        city: cityName,
        latitude,
        longitude,
      })
      .from(properties)
      .where(
        and(
          sql`${cityName} IS NOT NULL`,
          like(cityName, pattern)
        )
      )
      .orderBy(desc(properties.id))
      .limit(MAX_DB_ROWS);

    const unique = new Map<
      string,
      LocationSuggestion
    >();

    for (const row of rows) {
      const city = clean(row.city);

      if (!city) {
        continue;
      }

      const key = normalize(city);

      if (unique.has(key)) {
        continue;
      }

      const lat = toNumber(row.latitude);
      const lng = toNumber(row.longitude);

      unique.set(key, {
        placeId: `db-city-${key.replace(/\s+/g, "-")}`,
        mainText: city,
        secondaryText: "India",
        fullText: `${city}, India`,
        type: "City",
        types: ["locality", "city"],
        source: "database",
        latitude:
          lat !== null && lng !== null ? lat : undefined,
        longitude:
          lat !== null && lng !== null ? lng : undefined,
      });
    }

    return Array.from(unique.values());
  } catch (error) {
    console.error(
      "[location-search] DB city search failed:",
      error
    );

    return [];
  }
}

/* ============================================================
   GET CITY COORDINATES
============================================================ */

async function getCityCoordinates(
  city: string
): Promise<Coordinate | null> {
  const cityName = sql<string>`JSON_UNQUOTE(
    JSON_EXTRACT(${properties.form_data}, '$.city')
  )`;
  const cityId = sql<string>`JSON_UNQUOTE(
    JSON_EXTRACT(${properties.form_data}, '$.cityId')
  )`;
  const latitude = sql<string | null>`JSON_UNQUOTE(
    JSON_EXTRACT(${properties.form_data}, '$.latitude')
  )`;
  const longitude = sql<string | null>`JSON_UNQUOTE(
    JSON_EXTRACT(${properties.form_data}, '$.longitude')
  )`;
  /*
    First try coordinates already stored against properties
    in this city.

    This avoids a Google request when the city already has
    stored coordinates.
  */

  try {
    const rows = await db
      .select({
        latitude,
        longitude,
      })
      .from(properties)
      .where(
        and(
          or(eq(cityName, city), eq(cityId, city)),
          sql`${latitude} IS NOT NULL`,
          sql`${longitude} IS NOT NULL`
        )
      )
      .limit(20);

    const validCoordinates: Coordinate[] = [];

    for (const row of rows) {
      const lat = toNumber(row.latitude);
      const lng = toNumber(row.longitude);

      if (
        lat !== null &&
        lng !== null &&
        isValidCoordinate(lat, lng)
      ) {
        validCoordinates.push({
          lat,
          lng,
        });
      }
    }

    /*
      If multiple properties exist in the city, calculate the
      average. This gives us a stable city-center-ish point
      based on your own stored property data.
    */

    if (validCoordinates.length > 0) {
      const lat =
        validCoordinates.reduce(
          (sum, item) => sum + item.lat,
          0
        ) / validCoordinates.length;

      const lng =
        validCoordinates.reduce(
          (sum, item) => sum + item.lng,
          0
        ) / validCoordinates.length;

      if (isValidCoordinate(lat, lng)) {
        return {
          lat,
          lng,
        };
      }
    }
  } catch (error) {
    console.error(
      "[location-search] DB city coordinate lookup failed:",
      error
    );
  }

  /*
    No stored coordinates -> Google geocoding.
  */

  return geocodeCity(city);
}

/* ============================================================
   DB LOCALITY / PROJECT SEARCH
============================================================ */

async function searchDatabaseLocations(
  query: string,
  city: string,
  cityCoordinates: Coordinate | null
): Promise<LocationSuggestion[]> {
  const pattern = `%${query}%`;
  const cityName = sql<string>`JSON_UNQUOTE(
    JSON_EXTRACT(${properties.form_data}, '$.city')
  )`;
  const cityId = sql<string>`JSON_UNQUOTE(
    JSON_EXTRACT(${properties.form_data}, '$.cityId')
  )`;
  const locality = sql<string | null>`COALESCE(
    JSON_UNQUOTE(JSON_EXTRACT(${properties.form_data}, '$.locality')),
    ${properties.landmark}
  )`;
  const subLocality = sql<string | null>`JSON_UNQUOTE(
    JSON_EXTRACT(${properties.form_data}, '$.subLocality')
  )`;
  const mallName = sql<string | null>`COALESCE(
    JSON_UNQUOTE(JSON_EXTRACT(${properties.form_data}, '$.society')),
    JSON_UNQUOTE(JSON_EXTRACT(${properties.form_data}, '$.towerBlock'))
  )`;
  const propertyType = sql<string | null>`COALESCE(
    JSON_UNQUOTE(JSON_EXTRACT(${properties.form_data}, '$.propertyType')),
    ${properties.propertyType}
  )`;
  const latitude = sql<string | null>`JSON_UNQUOTE(
    JSON_EXTRACT(${properties.form_data}, '$.latitude')
  )`;
  const longitude = sql<string | null>`JSON_UNQUOTE(
    JSON_EXTRACT(${properties.form_data}, '$.longitude')
  )`;
  const status = sql<string | null>`COALESCE(
    JSON_UNQUOTE(JSON_EXTRACT(${properties.form_data}, '$.status')),
    ${properties.status}
  )`;

  try {
    /*
      Search across:

      locality
      sub_locality
      mall_name

      This matches the fields currently used by your
      property wizard/database.
    */

    const rows = await db
      .select({
        id: properties.id,
        city: cityName,
        locality,
        subLocality,
        mallName,
        propertyType,
        latitude,
        longitude,
        status,
      })
      .from(properties)
      .where(
        and(
          or(eq(cityName, city), eq(cityId, city)),
          sql`LOWER(COALESCE(${status}, '')) IN ('active', 'published')`,
          or(
            like(locality, pattern),
            like(subLocality, pattern),
            like(mallName, pattern)
          )
        )
      )
      .orderBy(desc(properties.id))
      .limit(MAX_DB_ROWS);

    const unique = new Map<
      string,
      LocationSuggestion
    >();

    for (const row of rows) {
      const locality = clean(row.locality);
      const subLocality = clean(row.subLocality);
      const mallName = clean(row.mallName);

      const lat = toNumber(row.latitude);
      const lng = toNumber(row.longitude);

      let mainText = "";
      let type: SuggestionType = "Locality";
      let secondaryText = city;

      /*
        Priority:

        1. mall/project-like value
        2. sub locality
        3. locality
      */

      if (
        mallName &&
        normalize(mallName).includes(normalize(query))
      ) {
        mainText = mallName;
        type = "Project";
        secondaryText = locality
          ? `${locality}, ${city}`
          : city;
      } else if (
        subLocality &&
        normalize(subLocality).includes(
          normalize(query)
        )
      ) {
        mainText = subLocality;

        secondaryText = locality
          ? `${locality}, ${city}`
          : city;
      } else if (
        locality &&
        normalize(locality).includes(normalize(query))
      ) {
        mainText = locality;
        secondaryText = city;
      }

      if (!mainText) {
        continue;
      }

      const key = `${type}:${normalize(mainText)}:${normalize(
        secondaryText
      )}`;

      let distance: number | undefined;

      if (
        cityCoordinates &&
        lat !== null &&
        lng !== null &&
        isValidCoordinate(lat, lng)
      ) {
        distance = distanceMeters(
          cityCoordinates.lat,
          cityCoordinates.lng,
          lat,
          lng
        );
      }

      const existing = unique.get(key);

      /*
        If the same locality appears in many property records,
        keep only one suggestion and prefer the one having
        coordinates.
      */

      if (!existing) {
        unique.set(key, {
          placeId: `db-${row.id}-${key
            .replace(/[^a-z0-9]+/gi, "-")
            .replace(/^-|-$/g, "")}`,
          mainText,
          secondaryText,
          fullText: `${mainText}, ${secondaryText}`,
          type,
          types:
            type === "Project"
              ? ["premise", "real_estate"]
              : ["locality"],
          distanceMeters: distance,
          source: "database",
          latitude:
            lat !== null &&
            lng !== null &&
            isValidCoordinate(lat, lng)
              ? lat
              : undefined,
          longitude:
            lat !== null &&
            lng !== null &&
            isValidCoordinate(lat, lng)
              ? lng
              : undefined,
        });
      } else if (
        existing.distanceMeters === undefined &&
        distance !== undefined
      ) {
        existing.distanceMeters = distance;
        existing.latitude = lat ?? undefined;
        existing.longitude = lng ?? undefined;
      }
    }

    return Array.from(unique.values());
  } catch (error) {
    console.error(
      "[location-search] DB locality search failed:",
      error
    );

    return [];
  }
}

/* ============================================================
   DEDUPLICATION
============================================================ */

function mergeSuggestions(
  dbSuggestions: LocationSuggestion[],
  googleSuggestions: LocationSuggestion[]
): LocationSuggestion[] {
  const map = new Map<
    string,
    LocationSuggestion
  >();

  /*
    DB suggestions are inserted first.

    Therefore your own stored data gets priority over Google.
  */

  for (const item of [
    ...dbSuggestions,
    ...googleSuggestions,
  ]) {
    const normalizedMain = normalize(item.mainText);

    const normalizedSecondary = normalize(
      item.secondaryText
    );

    const key = `${normalizedMain}|${normalizedSecondary}`;

    const existing = map.get(key);

    if (!existing) {
      map.set(key, item);
      continue;
    }

    /*
      Prefer database result over Google result.
    */

    if (
      existing.source === "google" &&
      item.source === "database"
    ) {
      map.set(key, item);
    }
  }

  return Array.from(map.values());
}

/* ============================================================
   RELEVANCE SCORE
============================================================ */

function relevanceScore(
  item: LocationSuggestion,
  query: string,
  cityCoordinates: Coordinate | null
): number {
  const q = normalize(query);
  const main = normalize(item.mainText);
  const secondary = normalize(item.secondaryText);

  let score = 0;

  /*
    Exact match
  */

  if (main === q) {
    score += 1000;
  }

  /*
    Starts with query
  */

  if (main.startsWith(q)) {
    score += 500;
  }

  /*
    Contains query
  */

  if (main.includes(q)) {
    score += 250;
  }

  /*
    Secondary text match
  */

  if (secondary.includes(q)) {
    score += 50;
  }

  /*
    DB is preferred over Google.
  */

  if (item.source === "database") {
    score += 100;
  }

  /*
    Projects get a slight boost when searching a property
    location because users often search for society/project
    names.
  */

  if (item.type === "Project") {
    score += 40;
  }

  /*
    Distance score.

    Closer locations receive a higher score.
  */

  if (
    item.distanceMeters !== undefined &&
    Number.isFinite(item.distanceMeters)
  ) {
    const km = item.distanceMeters / 1000;

    if (km <= 1) {
      score += 150;
    } else if (km <= 3) {
      score += 100;
    } else if (km <= 5) {
      score += 70;
    } else if (km <= 10) {
      score += 40;
    } else if (km <= 20) {
      score += 20;
    }
  } else if (cityCoordinates) {
    /*
      No distance available means no distance bonus.
    */
  }

  return score;
}

/* ============================================================
   SORT
============================================================ */

function sortSuggestions(
  suggestions: LocationSuggestion[],
  query: string,
  cityCoordinates: Coordinate | null
): LocationSuggestion[] {
  return suggestions.sort((a, b) => {
    const scoreA = relevanceScore(
      a,
      query,
      cityCoordinates
    );

    const scoreB = relevanceScore(
      b,
      query,
      cityCoordinates
    );

    if (scoreA !== scoreB) {
      return scoreB - scoreA;
    }

    /*
      If relevance is equal, sort by distance.
    */

    const distanceA =
      a.distanceMeters ?? Number.MAX_SAFE_INTEGER;

    const distanceB =
      b.distanceMeters ?? Number.MAX_SAFE_INTEGER;

    if (distanceA !== distanceB) {
      return distanceA - distanceB;
    }

    return a.mainText.localeCompare(
      b.mainText,
      "en",
      {
        sensitivity: "base",
      }
    );
  });
}

/* ============================================================
   GET /api/location-search
============================================================ */

export async function GET(request: NextRequest) {
  const origin = request.headers.get("origin");

  try {
    const { searchParams } = new URL(request.url);

    const query = clean(searchParams.get("q"));

    const fieldParam = clean(
      searchParams.get("field")
    ).toLowerCase();

    const city = clean(searchParams.get("city"));

    /*
      Frontend currently sends:

      /api/location-search?q=Lucknow&field=city

      or:

      /api/location-search?q=Gomti%20Nagar&field=locality&city=Lucknow
    */

    const field: SearchField =
      fieldParam === "locality"
        ? "locality"
        : "city";

    /* --------------------------------------------------------
       VALIDATION
    -------------------------------------------------------- */

    if (query.length < MIN_QUERY_LENGTH) {
      return NextResponse.json(
        {
          success: true,
          suggestions: [],
        },
        {
          status: 200,
          headers: corsHeaders(origin),
        }
      );
    }

    /*
      Locality search MUST have a selected city.

      This prevents:

      Gomti Nagar
      Noida Sector 62
      Indirapuram

      from being searched globally.
    */

    if (field === "locality" && !city) {
      return NextResponse.json(
        {
          success: true,
          suggestions: [],
          message:
            "Please select a city before searching locality.",
        },
        {
          status: 200,
          headers: corsHeaders(origin),
        }
      );
    }

    /* --------------------------------------------------------
       CITY SEARCH
    -------------------------------------------------------- */

    if (field === "city") {
      /*
        1. Search your own DB first.
      */

      const dbCities = await searchCities(query);

      /*
        2. If DB doesn't have enough results, Google city
           geocoding is used as fallback.
      */

      if (dbCities.length >= MAX_RESULTS) {
        const sorted = dbCities
          .map((item) => ({
            item,
            score: relevanceScore(
              item,
              query,
              null
            ),
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, MAX_RESULTS)
          .map((item) => item.item);

        return NextResponse.json(
          {
            success: true,
            field,
            query,
            city: null,
            suggestions: sorted,
          },
          {
            status: 200,
            headers: corsHeaders(origin),
          }
        );
      }

      /*
        Google city fallback.

        We use Geocoding here because the purpose of this
        request is identifying a city and its coordinates.
      */

      const googleCityCoordinates =
        await geocodeCity(query);

      const googleCitySuggestion: LocationSuggestion[] =
        googleCityCoordinates
          ? [
              {
                placeId: `google-city-${normalize(
                  query
                ).replace(/\s+/g, "-")}`,
                mainText: query,
                secondaryText: "India",
                fullText: `${query}, India`,
                type: "City",
                types: ["locality", "city"],
                source: "google",
                latitude: googleCityCoordinates.lat,
                longitude:
                  googleCityCoordinates.lng,
              },
            ]
          : [];

      const merged = mergeSuggestions(
        dbCities,
        googleCitySuggestion
      );

      const sorted = sortSuggestions(
        merged,
        query,
        null
      ).slice(0, MAX_RESULTS);

      return NextResponse.json(
        {
          success: true,
          field,
          query,
          city: null,
          suggestions: sorted,
        },
        {
          status: 200,
          headers: corsHeaders(origin),
        }
      );
    }

    /* --------------------------------------------------------
       LOCALITY SEARCH
    -------------------------------------------------------- */

    /*
      Step 1:
      Resolve coordinates for the selected city.

      Priority:

      DB stored coordinates
          ↓
      Google city geocoding
    */

    const cityCoordinates =
      await getCityCoordinates(city);

    /*
      Step 2:
      Search YOUR OWN properties table.

      This is the primary source.
    */

    const dbSuggestions =
      await searchDatabaseLocations(
        query,
        city,
        cityCoordinates
      );

    /*
      Step 3:
      Google fallback.

      Google is called even when DB has results so that
      sectors/localities/projects not yet represented by
      your own listings can appear.

      We then merge and rank DB results ahead of duplicates.
    */

    const googleSuggestions =
      await googlePlacesFallback(
        query,
        city,
        cityCoordinates
      );

    /*
      Step 4:
      Merge DB + Google and remove duplicates.
    */

    const merged = mergeSuggestions(
      dbSuggestions,
      googleSuggestions
    );

    /*
      Step 5:
      Distance + relevance sorting.
    */

    const sorted = sortSuggestions(
      merged,
      query,
      cityCoordinates
    );

    /*
      Step 6:
      Limit final response.
    */

    const finalSuggestions = sorted
      .slice(0, MAX_RESULTS)
      .map((item) => ({
        placeId: item.placeId,
        mainText: item.mainText,
        secondaryText: item.secondaryText,
        fullText: item.fullText,
        type: item.type,
        types: item.types,
        distanceMeters:
          item.distanceMeters !== undefined
            ? Math.round(item.distanceMeters)
            : undefined,
        source: item.source,
        latitude: item.latitude,
        longitude: item.longitude,

        /*
          Convenient display value for the frontend.
        */
        distance:
          item.distanceMeters !== undefined
            ? formatDistance(item.distanceMeters)
            : undefined,
      }));

    /* --------------------------------------------------------
       RESPONSE
    -------------------------------------------------------- */

    return NextResponse.json(
      {
        success: true,

        field,

        query,

        city,

        cityCoordinates,

        /*
          Useful for debugging / future frontend behaviour.
        */

        sources: {
          database: dbSuggestions.length,
          google: googleSuggestions.length,
          merged: merged.length,
          returned: finalSuggestions.length,
        },

        suggestions: finalSuggestions,
      },
      {
        status: 200,
        headers: corsHeaders(origin),
      }
    );
  } catch (error) {
    console.error(
      "GET /api/location-search error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        suggestions: [],
        error:
          error instanceof Error
            ? error.message
            : "Location search failed",
      },
      {
        status: 500,
        headers: corsHeaders(origin),
      }
    );
  }
}