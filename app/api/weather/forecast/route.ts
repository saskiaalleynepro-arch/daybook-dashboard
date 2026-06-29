import { NextRequest, NextResponse } from 'next/server';

// Open-Meteo weather codes mapped to short human labels. Full table is much
// longer; this covers the common cases well enough for a dashboard glance.
const WEATHER_LABELS: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mostly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Heavy drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  71: 'Light snow',
  73: 'Snow',
  75: 'Heavy snow',
  80: 'Rain showers',
  81: 'Rain showers',
  82: 'Violent showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm, hail',
  99: 'Thunderstorm, hail',
};

function labelFor(code: number): string {
  return WEATHER_LABELS[code] ?? 'Mixed conditions';
}

// Change to 'fahrenheit' to switch units app-wide.
const TEMPERATURE_UNIT: 'celsius' | 'fahrenheit' = 'celsius';

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get('lat');
  const lon = req.nextUrl.searchParams.get('lon');
  if (!lat || !lon) {
    return NextResponse.json({ error: 'lat and lon are required' }, { status: 400 });
  }

  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}` +
      `&longitude=${encodeURIComponent(lon)}` +
      `&current=temperature_2m,weather_code` +
      `&daily=temperature_2m_max,temperature_2m_min,weather_code` +
      `&forecast_days=5&timezone=auto&temperature_unit=${TEMPERATURE_UNIT}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Open-Meteo returned ${res.status}`);

    const data = await res.json();

    const current = {
      temperature: Math.round(data.current.temperature_2m),
      condition: labelFor(data.current.weather_code),
    };

    const daily = data.daily.time.map((date: string, i: number) => ({
      date,
      high: Math.round(data.daily.temperature_2m_max[i]),
      low: Math.round(data.daily.temperature_2m_min[i]),
      condition: labelFor(data.daily.weather_code[i]),
    }));

    return NextResponse.json({
      current,
      daily,
      unit: TEMPERATURE_UNIT === 'celsius' ? '°C' : '°F',
    });
  } catch (err) {
    console.error('GET /api/weather/forecast failed', err);
    return NextResponse.json(
      { error: 'Weather is unavailable right now' },
      { status: 502 }
    );
  }
}
