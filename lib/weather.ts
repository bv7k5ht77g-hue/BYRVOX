export const weatherCities = {
  ottawa: { id: 'on-118', name: 'Ottawa', tz: 'America/Toronto' },
  montreal: { id: 'qc-147', name: 'Montréal', tz: 'America/Toronto' },
  quebec: { id: 'qc-133', name: 'Québec', tz: 'America/Toronto' },
  toronto: { id: 'on-143', name: 'Toronto', tz: 'America/Toronto' },
  vancouver: { id: 'bc-74', name: 'Vancouver', tz: 'America/Vancouver' },
  calgary: { id: 'ab-52', name: 'Calgary', tz: 'America/Edmonton' },
  winnipeg: { id: 'mb-38', name: 'Winnipeg', tz: 'America/Winnipeg' },
  halifax: { id: 'ns-19', name: 'Halifax', tz: 'America/Halifax' },
} as const;
export type WeatherCity = keyof typeof weatherCities;
export const isWeatherCity = (input: string): input is WeatherCity => Object.hasOwn(weatherCities, input);
export function weatherDataUrl(city: WeatherCity) {
  return 'https://api.weather.gc.ca/collections/citypageweather-realtime/items/' + weatherCities[city].id + '?f=json';
}
export const weatherMaxAge = 3 * 60 * 60_000;
export const weatherRefresh = 10 * 60_000;

export type Sky = 'sun' | 'moon' | 'partSun' | 'partMoon' | 'cloud' | 'rain' | 'snow' | 'sleet' | 'fog' | 'storm' | 'wind' | 'unknown';
export type WeatherReading = {
  city: WeatherCity;
  observed: string;
  celsius: number;
  sky: Sky;
  fr: string;
  en: string;
};

type Feature = { properties?: {currentConditions?: {
  temperature?: {value?: {en?: unknown}; units?: {en?: unknown}};
  timestamp?: {en?: unknown};
  condition?: {en?: unknown;fr?: unknown};
  iconCode?: {value?: unknown};
}}};

export function weatherSky(condition: string, code: unknown): Sky {
  const night = typeof code === 'number' && code >= 30 && code <= 39;
  if (/thunder|lightning/i.test(condition)) return 'storm';
  if (/freezing (?:rain|drizzle)|ice pellet|rain.*snow|snow.*rain|hail/i.test(condition)) return 'sleet';
  if (/snow|flurr|blizzard|ice crystal/i.test(condition)) return 'snow';
  if (/rain|shower|drizzle/i.test(condition)) return 'rain';
  if (/fog|mist|haze|smoke|dust/i.test(condition)) return 'fog';
  if (/partly|mainly|mostly (?:clear|sunny)|few clouds|mix of/i.test(condition)) return night ? 'partMoon' : 'partSun';
  if (/cloud|overcast/i.test(condition)) return 'cloud';
  if (/clear|sunny/i.test(condition)) return night ? 'moon' : 'sun';
  if (/wind/i.test(condition)) return 'wind';
  return 'unknown';
}

export function parseWeather(city: WeatherCity, feature: Feature, now = Date.now()): WeatherReading | null {
  const obs = feature?.properties?.currentConditions;
  const celsius = obs?.temperature?.value?.en;
  const observed = obs?.timestamp?.en;
  if (typeof celsius !== 'number' || !Number.isFinite(celsius) || obs?.temperature?.units?.en !== 'C' || typeof observed !== 'string') return null;
  const age = now - Date.parse(observed);
  if (!Number.isFinite(age) || age < -5 * 60_000 || age >= weatherMaxAge) return null;
  const fr = typeof obs.condition?.fr === 'string' ? obs.condition.fr : '';
  const en = typeof obs.condition?.en === 'string' ? obs.condition.en : '';
  return { city, observed, celsius, sky: weatherSky(en, obs.iconCode?.value), fr, en };
}
