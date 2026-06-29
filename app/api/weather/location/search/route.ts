import { NextRequest, NextResponse } from 'next/server';

/** Open-Meteo's geocoding endpoint is free and keyless, same as their
 *  weather endpoint. Used so the user can type "London" and pick the
 *  right one from a short disambiguated list (region + country shown). */
export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q');
  if (!query || !query.trim()) {
    return NextResponse.json({ error: 'q is required' }, { status: 400 });
  }

  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      query
    )}&count=5&language=en&format=json`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Geocoding API returned ${res.status}`);

    const data = await res.json();

    const results = (data.results ?? []).map((r: any) => ({
      name: r.name as string,
      region: r.admin1 as string | undefined,
      country: r.country as string | undefined,
      latitude: r.latitude as number,
      longitude: r.longitude as number,
    }));

    return NextResponse.json(results);
  } catch (err) {
    console.error('GET /api/weather/location/search failed', err);
    return NextResponse.json(
      { error: 'Location search is unavailable right now' },
      { status: 502 }
    );
  }
}
