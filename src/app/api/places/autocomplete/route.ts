// src/app/api/places/autocomplete/route.ts

import { NextRequest, NextResponse } from "next/server";
import { corsHeaders } from "@/lib/cors"; // <-- apne project ka sahi path daalo

export const dynamic = "force-dynamic";

const PLACES_URL = "https://places.googleapis.com/v1/places:autocomplete";
const TIMEOUT_MS = 5000;
const MAX_RESULTS = 6;

interface Suggestion {
  id: string;
  label: string; // form field mein yahi value jayegi (e.g. "Lucknow")
  secondary: string; // e.g. "Uttar Pradesh, India"
  typeLabel: "City" | "Locality" | "Place";
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(request.headers.get("origin")),
  });
}

export async function GET(request: NextRequest) {
  const headers = corsHeaders(request.headers.get("origin"));

  const { searchParams } = request.nextUrl;
  const q = (searchParams.get("q") ?? "").trim();
  const mode = searchParams.get("mode") === "locality" ? "locality" : "city";
  const city = (searchParams.get("city") ?? "").trim();

  if (q.length < 2) {
    return NextResponse.json(
      { success: true, suggestions: [] },
      { status: 200, headers }
    );
  }

  const key = (process.env.GOOGLE_MAPS_SERVER_KEY ?? "").trim();

  if (!key) {
    console.error("[places] GOOGLE_MAPS_SERVER_KEY is not set");
    return NextResponse.json(
      { success: false, error: "Places service not configured" },
      { status: 500, headers }
    );
  }

  const body: Record<string, unknown> =
    mode === "city"
      ? {
          input: q,
          includedRegionCodes: ["in"],
          includedPrimaryTypes: ["(cities)"],
          languageCode: "en",
        }
      : {
          // locality search: city ke saath bhejo taaki us city ke andar ke results aayein
          input: city ? `${q}, ${city}` : q,
          includedRegionCodes: ["in"],
          languageCode: "en",
        };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(PLACES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      const text = await response.text();
      // API enable nahi / billing off / key restriction yahin dikhega
      console.error("[places] Google error:", response.status, text);

      return NextResponse.json(
        { success: false, error: "Could not fetch suggestions" },
        { status: 502, headers }
      );
    }

    const data = await response.json();

    const suggestions: Suggestion[] = (data?.suggestions ?? [])
      .map((s: any) => s?.placePrediction)
      .filter(Boolean)
      .slice(0, MAX_RESULTS)
      .map((p: any): Suggestion => {
        const types: string[] = Array.isArray(p.types) ? p.types : [];

        const label: string =
          p.structuredFormat?.mainText?.text ?? p.text?.text ?? "";

        const secondary: string = p.structuredFormat?.secondaryText?.text ?? "";

        let typeLabel: Suggestion["typeLabel"] = "Place";

        if (mode === "city") {
          typeLabel = "City";
        } else if (
          types.includes("sublocality") ||
          types.includes("sublocality_level_1") ||
          types.includes("neighborhood")
        ) {
          typeLabel = "Locality";
        } else if (types.includes("locality")) {
          typeLabel = "City";
        }

        return {
          id: String(p.placeId ?? label),
          label,
          secondary,
          typeLabel,
        };
      })
      .filter((s: Suggestion) => s.label);

    return NextResponse.json(
      { success: true, suggestions },
      { status: 200, headers }
    );
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("[places] Google request timed out");
    } else {
      console.error("[places] Request error:", error);
    }

    return NextResponse.json(
      { success: false, error: "Could not fetch suggestions" },
      { status: 502, headers }
    );
  } finally {
    clearTimeout(timer);
  }
}