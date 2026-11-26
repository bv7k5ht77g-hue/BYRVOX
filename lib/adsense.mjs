// Import only the publisher and responsive display-unit IDs. The renderer builds its own elements.
export const adClientPattern = /^ca-pub-[0-9]{16}$/;
export const adSlotPattern = /^[0-9]{10}$/;
const loaderUrl = /^https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=(ca-pub-[0-9]{16})$/;
const pushCommand = /^\(\s*(?:window\.)?adsbygoogle\s*=\s*(?:window\.)?adsbygoogle\s*\|\|\s*\[\s*\]\s*\)\s*\.\s*push\s*\(\s*\{\s*\}\s*\)\s*;?$/;

function attributes(source, allowed) {
  const attrs = new Map();
  const pattern = /\s+([a-zA-Z][a-zA-Z0-9-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'))?/y;
  let i = 0;
  while (i < source.trimEnd().length) {
    pattern.lastIndex = i;
    const match = pattern.exec(source);
    if (!match) return null;
    const key = match[1].toLowerCase();
    if (!allowed.includes(key) || attrs.has(key)) return null;
    attrs.set(key, match[2] ?? match[3] ?? '');
    i = pattern.lastIndex;
  }
  return attrs;
}

/** @param {string} source @returns {{client:string, slot:string} | null} */
export function parseAdSenseSnippet(source) {
  if (typeof source !== 'string' || source.length > 12000) return null;
  const text = source.replace(/<!--[\s\S]*?-->/g, '').trim();
  const tags = /<(script|ins)\b([^<>]*)>([\s\S]*?)<\/\1\s*>\s*/giy;
  let loader = '', unitClient = '', slot = '', pushSeen = false;
  let i = 0;
  while (i < text.length) {
    tags.lastIndex = i;
    const match = tags.exec(text);
    if (!match) return null;
    i = tags.lastIndex;
    const [, element, sourceAttrs, content] = match;
    if (element.toLowerCase() === 'ins') {
      const a = attributes(sourceAttrs, ['class','style','data-ad-client','data-ad-slot','data-ad-format','data-full-width-responsive']);
      if (slot || !a || a.get('class') !== 'adsbygoogle' || content.trim()) return null;
      unitClient = a.get('data-ad-client') ?? '';
      slot = a.get('data-ad-slot') ?? '';
      if (!adClientPattern.test(unitClient) || !adSlotPattern.test(slot)) return null;
      if ((a.has('data-ad-format') && a.get('data-ad-format') !== 'auto') ||
          (a.has('data-full-width-responsive') && a.get('data-full-width-responsive') !== 'true') ||
          (a.has('style') && !/^\s*display\s*:\s*block\s*;?\s*$/i.test(a.get('style')))) return null;
    } else {
      const a = attributes(sourceAttrs, ['async','src','crossorigin']);
      if (!a) return null;
      if (a.has('src')) {
        if (loader || content.trim() || (a.has('crossorigin') && a.get('crossorigin') !== 'anonymous')) return null;
        loader = loaderUrl.exec(a.get('src'))?.[1] ?? '';
        if (!loader) return null;
      } else {
        if (!slot || pushSeen || a.size || !pushCommand.test(content.trim())) return null;
        pushSeen = true;
      }
    }
  }
  const client = loader || unitClient;
  return client && (!unitClient || client === unitClient) ? {client, slot} : null;
}
