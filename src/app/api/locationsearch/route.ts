// ─────────────────────────────────────────────────────────────
//  src/app/api/locationsearch/route.ts  —  Next.js App Router
//  Endpoint: GET /api/locationsearch?q=lucknow&limit=10
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';

// ─── Types ───────────────────────────────────────────────────

type LocationType = 'City' | 'Locality' | 'New Launch Projects' | 'Project';

interface Location {
  id: number;
  name: string;
  type: LocationType;
  city: string;
}

interface LocationWithScore extends Location {
  _score: number;
}

// ─── Data ────────────────────────────────────────────────────

const LOCATIONS: Location[] = [
  // ── Lucknow ───────────────────────────────────────────────
  { id: 1,  name: 'Lucknow',                         type: 'City',                city: 'Lucknow' },
  { id: 2,  name: 'Gomti Nagar',                     type: 'Locality',            city: 'Lucknow' },
  { id: 3,  name: 'Gomti Nagar Extension',            type: 'Locality',            city: 'Lucknow' },
  { id: 4,  name: 'Hazratganj',                       type: 'Locality',            city: 'Lucknow' },
  { id: 5,  name: 'Aliganj',                          type: 'Locality',            city: 'Lucknow' },
  { id: 6,  name: 'Indira Nagar',                     type: 'Locality',            city: 'Lucknow' },
  { id: 7,  name: 'Vikas Nagar',                      type: 'Locality',            city: 'Lucknow' },
  { id: 8,  name: 'Rajajipuram',                      type: 'Locality',            city: 'Lucknow' },
  { id: 9,  name: 'Alambagh',                         type: 'Locality',            city: 'Lucknow' },
  { id: 10, name: 'Chinhat',                          type: 'Locality',            city: 'Lucknow' },
  { id: 11, name: 'Faizabad Road',                    type: 'Locality',            city: 'Lucknow' },
  { id: 12, name: 'Sultanpur Road',                   type: 'Locality',            city: 'Lucknow' },
  { id: 13, name: 'Sushant Golf City',                type: 'Locality',            city: 'Lucknow' },
  { id: 14, name: 'Mahanagar',                        type: 'Locality',            city: 'Lucknow' },
  { id: 15, name: 'Ashiyana',                         type: 'Locality',            city: 'Lucknow' },
  { id: 16, name: 'Charbagh',                         type: 'Locality',            city: 'Lucknow' },
  { id: 17, name: 'Kanpur Road, Lucknow',             type: 'Locality',            city: 'Lucknow' },
  { id: 18, name: 'Sitapur Road',                     type: 'Locality',            city: 'Lucknow' },
  { id: 19, name: 'Jankipuram',                       type: 'Locality',            city: 'Lucknow' },
  { id: 20, name: 'Vrindavan Yojana',                 type: 'Locality',            city: 'Lucknow' },
  { id: 21, name: 'Sector B, Sitapur Road',           type: 'Locality',            city: 'Lucknow' },
  { id: 22, name: 'Telibagh',                         type: 'Locality',            city: 'Lucknow' },
  { id: 23, name: 'Kursi Road',                       type: 'Locality',            city: 'Lucknow' },
  { id: 24, name: 'Raebareli Road',                   type: 'Locality',            city: 'Lucknow' },
  { id: 25, name: 'Takrohi',                          type: 'Locality',            city: 'Lucknow' },
  { id: 26, name: 'Lucknow Kanpur Highway',           type: 'Locality',            city: 'Lucknow' },
  { id: 27, name: 'Lucknow – New Launch Projects',    type: 'New Launch Projects', city: 'Lucknow' },
  { id: 28, name: 'Omaxe Celestia, Lucknow',          type: 'Project',             city: 'Lucknow' },
  { id: 29, name: 'Eldeco City, Lucknow',              type: 'Project',             city: 'Lucknow' },
  { id: 30, name: 'ATS Destinaire, Lucknow',           type: 'Project',             city: 'Lucknow' },
  { id: 31, name: 'Tata Primanti, Lucknow',            type: 'Project',             city: 'Lucknow' },

  // ── Kanpur ────────────────────────────────────────────────
  { id: 32, name: 'Kanpur',                           type: 'City',                city: 'Kanpur'     },
  { id: 33, name: 'Kanpur – New Launch Projects',     type: 'New Launch Projects', city: 'Kanpur'     },
  { id: 34, name: 'Kanpur Dehat',                     type: 'Locality',            city: 'Kanpur'     },
  { id: 35, name: 'Purana Kanpur',                    type: 'Locality',            city: 'Kanpur'     },
  { id: 36, name: 'Kanpur Cantonment',                type: 'Locality',            city: 'Kanpur'     },
  { id: 37, name: 'Kanpur University',                type: 'Locality',            city: 'Kanpur'     },
  { id: 38, name: 'New Kanpur City',                  type: 'Locality',            city: 'Kanpur'     },
  { id: 39, name: 'Shine Kanpur Galaxy, Chaubepur',   type: 'Project',             city: 'Kanpur'     },
  { id: 40, name: 'Kanpur Rudra Subhkamna, Amethi',   type: 'Project',             city: 'Kanpur'     },

  // ── Noida ─────────────────────────────────────────────────
  { id: 50, name: 'Noida',                            type: 'City',                city: 'Noida'      },
  { id: 51, name: 'Sector 62, Noida',                 type: 'Locality',            city: 'Noida'      },
  { id: 52, name: 'Sector 150, Noida',                type: 'Locality',            city: 'Noida'      },
  { id: 53, name: 'Greater Noida West',               type: 'Locality',            city: 'Noida'      },
  { id: 54, name: 'Noida Extension',                  type: 'Locality',            city: 'Noida'      },

  // ── Delhi ─────────────────────────────────────────────────
  { id: 60, name: 'Delhi',                            type: 'City',                city: 'Delhi'      },
  { id: 61, name: 'Dwarka, Delhi',                    type: 'Locality',            city: 'Delhi'      },
  { id: 62, name: 'Rohini, Delhi',                    type: 'Locality',            city: 'Delhi'      },
  { id: 63, name: 'Saket, Delhi',                     type: 'Locality',            city: 'Delhi'      },

  // ── Mumbai ────────────────────────────────────────────────
  { id: 70, name: 'Mumbai',                           type: 'City',                city: 'Mumbai'     },
  { id: 71, name: 'Andheri West, Mumbai',             type: 'Locality',            city: 'Mumbai'     },
  { id: 72, name: 'Powai, Mumbai',                    type: 'Locality',            city: 'Mumbai'     },
  { id: 73, name: 'Bandra, Mumbai',                   type: 'Locality',            city: 'Mumbai'     },

  // ── Bangalore ─────────────────────────────────────────────
  { id: 80, name: 'Bangalore',                        type: 'City',                city: 'Bangalore'  },
  { id: 81, name: 'Whitefield, Bangalore',            type: 'Locality',            city: 'Bangalore'  },
  { id: 82, name: 'Electronic City, Bangalore',       type: 'Locality',            city: 'Bangalore'  },
  { id: 83, name: 'Koramangala, Bangalore',           type: 'Locality',            city: 'Bangalore'  },
];

// ─── Helpers ─────────────────────────────────────────────────

const TYPE_ORDER: Record<LocationType, number> = {
  'City':                0,
  'New Launch Projects': 1,
  'Locality':            2,
  'Project':             3,
};

function getScore(loc: Location, query: string): number {
  const name = loc.name.toLowerCase();
  const city = loc.city.toLowerCase();
  const q    = query.toLowerCase();

  if (name === q)                        return 100;
  if (city === q && loc.type === 'City') return 95;
  if (name.startsWith(q))               return 80;
  if (city === q)                        return 70;
  if (name.includes(q))                  return 50;
  if (city.includes(q))                  return 30;
  return 0;
}

const ALLOWED_ORIGINS = [
  'http://localhost:8100',
  'http://localhost:3000',
  'https://101acres.com',
  'https://www.101acres.com',
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin':  allowed,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

// ─── OPTIONS (preflight) ──────────────────────────────────────

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin');
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(origin) });
}

// ─── GET ─────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const origin = req.headers.get('origin');
  const { searchParams } = new URL(req.url);

  const q     = (searchParams.get('q') ?? '').trim();
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '10', 10) || 10, 20);

  if (!q) {
    return NextResponse.json(
      { success: true, query: '', results: [] },
      { headers: getCorsHeaders(origin) },
    );
  }

  const results: Location[] = (LOCATIONS as LocationWithScore[])
    .map((loc) => ({ ...loc, _score: getScore(loc, q) }))
    .filter((loc) => loc._score > 0)
    .sort((a, b) => {
      if (b._score !== a._score) return b._score - a._score;
      return (TYPE_ORDER[a.type] ?? 9) - (TYPE_ORDER[b.type] ?? 9);
    })
    .slice(0, limit)
    .map(({ _score, ...loc }) => loc);

  return NextResponse.json(
    { success: true, query: q, results },
    { headers: getCorsHeaders(origin) },
  );
}