export type PublicSource = { name: string; url: string };

export function sourcesForReader(raw?: string): PublicSource[] {
  if (!raw) return [];
  let records: unknown;
  try {
    records = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(records)) return [];

  const sources: PublicSource[] = [];
  const seen = new Set<string>();
  for (const entry of records) {
    if (!entry || typeof entry !== "object" || typeof entry.url !== "string") continue;
    let url: URL;
    try {
      url = new URL(entry.url);
    } catch {
      continue;
    }
    if (url.protocol !== "https:" || url.username || url.password || seen.has(url.href)) continue;
    seen.add(url.href);
    const name = typeof entry.name === "string" ? entry.name.trim() : "";
    sources.push({ name: name || url.hostname, url: url.href });
  }
  return sources;
}
