import { NextRequest, NextResponse } from 'next/server';
import { corsHeaders } from '@/lib/cors';

interface GoogleAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface GoogleGeocodeResult {
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  address_components: GoogleAddressComponent[];
}

interface GoogleGeocodeResponse {
  status: string;
  results: GoogleGeocodeResult[];
}

const getAddressComponent = (
  components: GoogleAddressComponent[],
  types: string[]
): string => {
  const component = components.find((item) =>
    types.some((type) => item.types.includes(type))
  );

  return component?.long_name || '';
};

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin');

  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

export async function GET(req: NextRequest) {
  // IMPORTANT:
  // origin must be declared inside GET().
  const origin = req.headers.get('origin');

  try {
    const { searchParams } = new URL(req.url);

    const q = searchParams.get('q')?.trim();

    const latParam = searchParams.get('lat');
    const lngParam = searchParams.get('lng');

    const apiKey =
      process.env.GOOGLE_MAPS_SERVER_KEY;

    // =====================================================
    // GOOGLE API KEY CHECK
    // =====================================================

    if (!apiKey) {
      console.error(
        'GOOGLE_MAPS_SERVER_KEY is not configured'
      );

      return NextResponse.json(
        {
          error: 'Google Maps API key is not configured',
          results: [],
        },
        {
          status: 500,
          headers: corsHeaders(origin),
        }
      );
    }

    // =====================================================
    // REVERSE GEOCODING
    //
    // Example:
    //
    // /api/geocode?lat=28.6328027&lng=77.2197713
    // =====================================================

    if (latParam && lngParam) {
      const lat = Number(latParam);
      const lng = Number(lngParam);

      // Validate coordinates
      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        Math.abs(lat) > 90 ||
        Math.abs(lng) > 180
      ) {
        return NextResponse.json(
          {
            status: 'INVALID_REQUEST',
            results: [],
          },
          {
            status: 400,
            headers: corsHeaders(origin),
          }
        );
      }

      const googleUrl =
        'https://maps.googleapis.com/maps/api/geocode/json' +
        `?latlng=${encodeURIComponent(`${lat},${lng}`)}` +
        `&key=${encodeURIComponent(apiKey)}`;

      const res = await fetch(googleUrl, {
        next: {
          revalidate: 86400,
        },
      });

      if (!res.ok) {
        console.error(
          'Google reverse geocode HTTP error:',
          res.status
        );

        return NextResponse.json(
          {
            status: 'GOOGLE_ERROR',
            results: [],
          },
          {
            status: 502,
            headers: corsHeaders(origin),
          }
        );
      }

      const data =
        (await res.json()) as GoogleGeocodeResponse;

      if (
        data.status !== 'OK' ||
        !Array.isArray(data.results) ||
        data.results.length === 0
      ) {
        return NextResponse.json(
          {
            status: data.status,
            results: [],
          },
          {
            status: 200,
            headers: corsHeaders(origin),
          }
        );
      }

      const result = data.results[0];

      const components =
        result.address_components || [];

      // Find city
      const city =
        getAddressComponent(
          components,
          ['locality']
        ) ||
        getAddressComponent(
          components,
          ['postal_town']
        ) ||
        getAddressComponent(
          components,
          ['administrative_area_level_2']
        ) ||
        getAddressComponent(
          components,
          ['administrative_area_level_1']
        );

      // Find area
      const area =
        getAddressComponent(
          components,
          [
            'sublocality',
            'sublocality_level_1',
          ]
        ) ||
        getAddressComponent(
          components,
          ['neighborhood']
        );

      // Example:
      // Connaught Place, New Delhi
      const label =
        [area, city]
          .filter(Boolean)
          .join(', ') ||
        result.formatted_address ||
        'Your location';

      return NextResponse.json(
        {
          status: 'OK',

          results: [
            {
              lat,
              lng,
              label,
              city,
            },
          ],
        },
        {
          status: 200,
          headers: corsHeaders(origin),
        }
      );
    }

    // =====================================================
    // PLACE SEARCH / FORWARD GEOCODING
    //
    // Example:
    //
    // /api/geocode?q=delhi
    // =====================================================

    if (!q || q.length < 3) {
      return NextResponse.json(
        {
          results: [],
        },
        {
          status: 200,
          headers: corsHeaders(origin),
        }
      );
    }

    const googleUrl =
      'https://maps.googleapis.com/maps/api/geocode/json' +
      `?address=${encodeURIComponent(q)}` +
      `&components=country:IN` +
      `&key=${encodeURIComponent(apiKey)}`;

    const res = await fetch(googleUrl, {
      next: {
        revalidate: 86400,
      },
    });

    if (!res.ok) {
      console.error(
        'Google geocode HTTP error:',
        res.status
      );

      return NextResponse.json(
        {
          error: 'Google Geocoding API error',
          results: [],
        },
        {
          status: 502,
          headers: corsHeaders(origin),
        }
      );
    }

    const data =
      (await res.json()) as GoogleGeocodeResponse;

    if (
      data.status !== 'OK' ||
      !Array.isArray(data.results)
    ) {
      return NextResponse.json(
        {
          status: data.status,
          results: [],
        },
        {
          status: 200,
          headers: corsHeaders(origin),
        }
      );
    }

    const results = data.results
      .slice(0, 5)
      .map((r) => {
        const components =
          r.address_components || [];

        const city =
          getAddressComponent(
            components,
            ['locality']
          ) ||
          getAddressComponent(
            components,
            ['postal_town']
          ) ||
          getAddressComponent(
            components,
            ['administrative_area_level_2']
          ) ||
          getAddressComponent(
            components,
            ['administrative_area_level_1']
          );

        const area =
          getAddressComponent(
            components,
            [
              'sublocality',
              'sublocality_level_1',
            ]
          ) ||
          getAddressComponent(
            components,
            ['neighborhood']
          );

        return {
          lat: r.geometry.location.lat,
          lng: r.geometry.location.lng,

          label: r.formatted_address
            .split(',')
            .slice(0, 3)
            .join(',')
            .trim(),

          city,

          area,
        };
      });

    // IMPORTANT:
    // CORS headers MUST also be present
    // on successful response.
    return NextResponse.json(
      {
        status: 'OK',
        results,
      },
      {
        status: 200,
        headers: corsHeaders(origin),
      }
    );
  } catch (error) {
    console.error(
      'Geocode error:',
      error
    );

    return NextResponse.json(
      {
        error: 'Geocoding failed',
        results: [],
      },
      {
        status: 500,
        headers: corsHeaders(origin),
      }
    );
  }
}