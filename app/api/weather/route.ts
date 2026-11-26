import { isWeatherCity, parseWeather, weatherDataUrl, weatherMaxAge, weatherRefresh, type WeatherCity, type WeatherReading } from '../../../lib/weather';

export const dynamic = 'force-dynamic';
type Cached = { reading: WeatherReading | null; nextCheck: number };
const cache = new Map<WeatherCity, Cached>();
const pending = new Map<WeatherCity, Promise<WeatherReading | null>>();

async function update(city: WeatherCity): Promise<WeatherReading | null> {
  const previous = cache.get(city);
  if (previous && previous.nextCheck > Date.now()) return previous.reading;
  try {
    const url = weatherDataUrl(city);
    const response = await fetch(url, {signal: AbortSignal.timeout(8000), headers: {Accept:'application/geo+json, application/json'}});
    if (!response.ok) throw Error('ECCC');
    const reading = parseWeather(city, await response.json());
    if (!reading) throw Error('Observation unavailable');
    cache.set(city, {reading, nextCheck: Date.now() + weatherRefresh});
    return reading;
  } catch {
    const old = previous?.reading;
    const reading = old && Date.now() - Date.parse(old.observed) < weatherMaxAge ? old : null;
    cache.set(city, {reading,nextCheck:Date.now() + 60_000});
    return reading;
  }
}

export async function GET(req: Request) {
  const city = new URL(req.url).searchParams.get('city') || 'ottawa';
  if (!isWeatherCity(city)) return Response.json({error:'city'}, {status:400});
  const result = pending.get(city) ?? update(city).finally(() => pending.delete(city));
  pending.set(city, result);
  const reading = await result;
  const remaining = reading ? Math.floor((weatherMaxAge - (Date.now() - Date.parse(reading.observed))) / 1000) : 0;
  if (!reading || remaining < 1) return Response.json({error:'unavailable'}, {status:503, headers:{'Cache-Control':'no-store','Retry-After':'60'}});
  return Response.json(reading, {headers:{'Cache-Control':'public, max-age=' + Math.min(120,remaining) + ', s-maxage=' + Math.min(600,remaining)}});
}
