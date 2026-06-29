'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, MapPin, Cloud } from 'lucide-react';
import type {
  WeatherLocation,
  LocationSearchResult,
  ForecastResponse,
} from '@/lib/types';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function WeatherWidget() {
  const [location, setLocation] = useState<WeatherLocation | null>(null);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch('/api/weather/location')
      .then((r) => r.json())
      .then((data: { location: WeatherLocation | null }) => {
        setLocation(data.location);
        if (data.location) loadForecast(data.location);
        else setLoading(false);
      })
      .catch(() => {
        setError('Could not load your saved location.');
        setLoading(false);
      });
  }, []);

  async function loadForecast(loc: WeatherLocation) {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/weather/forecast?lat=${loc.latitude}&lon=${loc.longitude}`
      );
      if (!res.ok) throw new Error();
      setForecast(await res.json());
    } catch {
      setError('Could not load the forecast.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/weather/location/search?q=${encodeURIComponent(query)}`
        );
        if (!res.ok) throw new Error();
        setResults(await res.json());
      } catch {
        setError('Location search is unavailable right now.');
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  async function selectLocation(result: LocationSearchResult) {
    const loc: WeatherLocation = {
      name: result.region ? `${result.name}, ${result.region}` : result.name,
      latitude: result.latitude,
      longitude: result.longitude,
    };
    try {
      const res = await fetch('/api/weather/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loc),
      });
      if (!res.ok) throw new Error();
      setLocation(loc);
      setQuery('');
      setResults([]);
      loadForecast(loc);
    } catch {
      setError('Could not save that location.');
    }
  }

  return (
    <section className="bg-white/60 border border-line rounded-sm p-5">
      <h3 className="font-serif text-lg text-ink mb-3 flex items-center gap-2">
        <Cloud size={16} className="text-accent" />
        Weather
      </h3>

      {error && (
        <p className="text-xs text-warn mb-2" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-ink/40 italic">Loading…</p>
      ) : !location ? (
        <div>
          <div className="relative mb-2">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink/30"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type your city…"
              className="w-full bg-transparent border border-line rounded-sm pl-8 pr-3 py-1.5 text-sm placeholder:text-ink/35 focus:border-accent transition-colors"
            />
          </div>
          {searching && (
            <p className="text-xs text-ink/40 italic">Searching…</p>
          )}
          {results.length > 0 && (
            <ul className="space-y-1">
              {results.map((r, i) => (
                <li key={i}>
                  <button
                    onClick={() => selectLocation(r)}
                    className="w-full flex items-center gap-2 text-left px-2 py-1.5 rounded-sm hover:bg-accentSoft/50 transition-colors text-sm"
                  >
                    <MapPin size={12} className="text-ink/30 flex-shrink-0" />
                    <span>
                      {r.name}
                      {r.region ? `, ${r.region}` : ''}
                      {r.country ? ` — ${r.country}` : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : forecast ? (
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <p className="text-xs text-ink/50 flex items-center gap-1">
                <MapPin size={11} /> {location.name}
              </p>
              <p className="font-serif text-3xl text-ink leading-none mt-1">
                {forecast.current.temperature}°
              </p>
              <p className="text-xs text-ink/50 mt-0.5">
                {forecast.current.condition}
              </p>
            </div>
            <button
              onClick={() => {
                setLocation(null);
                setForecast(null);
              }}
              className="text-xs text-accent hover:underline"
            >
              Change
            </button>
          </div>

          <div className="grid grid-cols-5 gap-1 border-t border-line pt-3">
            {forecast.daily.map((day) => {
              const dow = new Date(day.date).getDay();
              return (
                <div key={day.date} className="text-center">
                  <p className="text-[10px] text-ink/40 mb-1">
                    {DAY_LABELS[dow]}
                  </p>
                  <p className="text-xs font-medium text-ink">{day.high}°</p>
                  <p className="text-[10px] text-ink/40">{day.low}°</p>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
