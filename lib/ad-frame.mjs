import { validSourceUrl } from './editorial.mjs';

const firstParty = ['byrvox.today', 'byrvox.noventra.ca', 'byrvox.h2y4xnnm6g.chatgpt.site'];
const restrictedSuffixes = ['localhost', 'local', 'internal', 'test', 'invalid', 'onion', 'arpa'];
const frameAttributes = new Set(['src', 'title', 'width', 'height', 'style', 'class', 'id', 'frameborder', 'scrolling', 'loading', 'referrerpolicy', 'marginwidth', 'marginheight', 'sandbox', 'allow', 'allowfullscreen']);
const scriptAttributes = new Set(['src', 'async', 'defer', 'type', 'crossorigin']);

export function validAdFrameUrl(value) {
  if (typeof value !== 'string' || value.length > 2000 || /[\s\\\u0000-\u001f\u007f]/u.test(value) || !validSourceUrl(value)) return false;
  const address = new URL(value);
  const hostname = address.hostname.toLowerCase().replace(/\.$/, '');
  return !address.port && /^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(hostname)
    && /\.[a-z][a-z0-9-]*$/.test(hostname)
    && ![...firstParty, ...restrictedSuffixes].some(domain => hostname === domain || hostname.endsWith('.' + domain));
}

function decodeAttribute(value) {
  const entities = { amp: '&', apos: "'", quot: '"', lt: '<', gt: '>' };
  return value.replace(/&(amp|apos|quot|lt|gt);/gi, (_, name) => entities[name.toLowerCase()]);
}

export function validAdScriptUrl(value) {
  if (!validAdFrameUrl(value)) return false;
  const host = new URL(value).hostname.toLowerCase().replace(/\.$/, '');
  return host !== 'pagead2.googlesyndication.com';
}

function readAttributes(source, allowed) {
  const fields = new Map();
  let rest = source.trim();
  while (rest) {
    const attr = /^([a-z][\w-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>\x60]+)))?(?=\s|$)/i.exec(rest);
    if (!attr) return null;
    const key = attr[1].toLowerCase();
    if (!allowed.has(key) || fields.has(key)) return null;
    fields.set(key, decodeAttribute(attr[2] ?? attr[3] ?? attr[4] ?? ''));
    rest = rest.slice(attr[0].length).trim();
  }
  return fields;
}

/** Extract two data fields from a standalone iframe. No submitted markup is rendered. */
export function parseAdFrame(input) {
  if (typeof input !== 'string' || input.length > 12000) return null;
  const match = /^\s*<iframe\s+([^<>]*?)>\s*<\/iframe\s*>\s*$/i.exec(input);
  const fields = match && readAttributes(match[1], frameAttributes);
  if (!fields) return null;
  const url = fields.get('src');
  if (!validAdFrameUrl(url)) return null;
  const name = (fields.get('title') || new URL(url).hostname).trim();
  if (!name || name.length > 160) return null;
  return { url, name };
}

/** A single external classic script, with no inline initialization or credentials option. */
export function parseAdScript(input) {
  if (typeof input !== 'string' || input.length > 12000) return null;
  const match = /^\s*<script\s+([^<>]*?)>\s*<\/script\s*>\s*$/i.exec(input);
  const fields = match && readAttributes(match[1], scriptAttributes);
  if (!fields) return null;
  const url = fields.get('src');
  const type = (fields.get('type') || '').trim().toLowerCase();
  const cors = (fields.get('crossorigin') || '').trim().toLowerCase();
  if (!validAdScriptUrl(url) || !['', 'text/javascript', 'application/javascript'].includes(type)
    || !['', 'anonymous'].includes(cors)) return null;
  return { url, name: new URL(url).hostname };
}

/** Generate only the markup executed inside the opaque-origin advertising frame. */
export function adScriptDocument(url) {
  if (!validAdScriptUrl(url)) return undefined;
  const source = new URL(url).href.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return '<!doctype html><html><head><meta charset="utf-8"><meta name="referrer" content="no-referrer">'
    + '<base href="' + source + '"></head><body style="margin:0">'
    + '<script src="' + source + '" referrerpolicy="no-referrer"></script></body></html>';
}
