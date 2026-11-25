const entities: Record<string, string> = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
};

export function xml(value: string) {
  return value
    .replace(/[^\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/gu, '')
    .replace(/[&<>"']/g, char => entities[char]);
}

export function xmlResponse(body: string, type = 'application/xml') {
  return new Response('<?xml version="1.0" encoding="UTF-8"?>\n' + body, {
    headers: { 'Content-Type': type + '; charset=utf-8', 'Cache-Control': 'public, max-age=60' }
  });
}
