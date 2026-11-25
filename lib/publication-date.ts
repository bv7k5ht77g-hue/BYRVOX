export function isoDate(value?: string | null): string | null {
  if (!value?.trim()) return null;
  const instant = Date.parse(value);
  return Number.isFinite(instant) ? new Date(instant).toISOString() : null;
}

const publicationTime = new Intl.DateTimeFormat("fr-CA", {
  day: "numeric", month: "long", year: "numeric",
  hour: "2-digit", minute: "2-digit", timeZone: "America/Toronto", timeZoneName: "short",
});
export function formatDate(iso: string): string {
  return publicationTime.format(new Date(iso));
}
