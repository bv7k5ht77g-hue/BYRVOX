import { isIP } from 'node:net';

const ipHeader = 'x-byrvox-edge-ip';
const locationHeader = 'x-byrvox-edge-location';

type EdgeRequest = Request & { cf?: { colo?: unknown; city?: unknown; region?: unknown; country?: unknown } };

function edgeNetwork(request: EdgeRequest) {
  const metadata = request.cf;
  if (!metadata?.colo) return {lastIp:null,lastLocation:null};
  const ip = request.headers.get('cf-connecting-ip')?.trim() || '';
  const place = [metadata.city, metadata.region, metadata.country].filter(
    (part): part is string => typeof part === 'string' && part.trim().length > 0 && part.length <= 100,
  ).join(', ');
  return {lastIp:isIP(ip) ? ip : null, lastLocation:place || null};
}

// At the Worker entry point, replace any client-supplied values before framework routing.
export function withReaderNetwork(request: Request): Request {
  const headers = new Headers(request.headers);
  headers.delete(ipHeader);
  headers.delete(locationHeader);
  const {lastIp,lastLocation} = edgeNetwork(request as EdgeRequest);
  if (lastIp) headers.set(ipHeader,lastIp);
  if (lastLocation) headers.set(locationHeader,encodeURIComponent(lastLocation));
  return new Request(request,{headers});
}

export function readerNetwork(request: Request) {
  if ((request as EdgeRequest).cf?.colo) return edgeNetwork(request as EdgeRequest);
  const lastIp = request.headers.get(ipHeader);
  const location = request.headers.get(locationHeader);
  return {
    lastIp:lastIp && isIP(lastIp) ? lastIp : null,
    lastLocation:location ? decodeURIComponent(location).slice(0,300) : null,
  };
}
