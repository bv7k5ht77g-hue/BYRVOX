import { SITE_ORIGIN, NEWSROOM_URL } from "../lib/site-url";
import { withReaderNetwork } from "../lib/reader-network";
import { handleReaderAccess } from "../lib/reader-auth";
import { preferredLocale } from "../lib/i18n";
import handler from "vinext/server/fetch-handler";
import { runWithConnectorBinding } from "../lib/connector-context";
import type { ConnectorBinding } from "../lib/connector-contract.mjs";

const worker = {
  async fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext<{ CONNECTORS?: ConnectorBinding }>) {
    // Server components see headers, whereas the Worker also knows the effective URL.
    const url = new URL(request.url);
    if (url.origin !== SITE_ORIGIN && /^\/admin(?:\/|$)/.test(url.pathname)) {
      if (request.method === "GET" || request.method === "HEAD") {
        return Response.redirect(NEWSROOM_URL + url.search, 307);
      }
      return new Response(null, {status: 403, headers: {"Cache-Control": "no-store"}});
    }
    request = withReaderNetwork(request);
    const readerResponse = await handleReaderAccess(request, ctx);
    if (readerResponse) return readerResponse;
    if (request.headers.get("host") !== url.host) {
      const headers = new Headers(request.headers);
      headers.set("host", url.host);
      request = new Request(request, { headers });
    }
    // Forward the public edition's resolved language to the root document during SSR.
    if (url.pathname === "/" || url.pathname.startsWith("/article/") || request.headers.has("x-byrvox-language")) {
      const headers = new Headers(request.headers);
      headers.delete("x-byrvox-language");
      if (url.pathname === "/" || url.pathname.startsWith("/article/")) {
        const cookie = request.headers.get("cookie")?.match(/(?:^|;\s*)byrvox-language=([^;]*)/)?.[1];
        headers.set("x-byrvox-language", preferredLocale(url.searchParams.get("lang"),cookie));
      }
      request = new Request(request,{headers});
    }
    let binding = ctx.props?.CONNECTORS;
    // Local preview emulates the same request-scoped capability. This branch and
    // the auxiliary service binding are absent from production builds.
    if (import.meta.env.DEV && !binding && env.CONNECTORS) {
      const preview = env.CONNECTORS;
      const expiresAt = Date.now() + 60_000;
      binding = {
        async getContext() {
          if (Date.now() >= expiresAt) return { status: "request_context_expired" };
          return preview.getContext?.() ?? { status: "binding_unavailable" };
        },
        async invoke(connectorId, actionName, args) {
          if (Date.now() >= expiresAt) {
            return { status: "request_context_expired", message: "This request has expired. Please try again." };
          }
          return preview.invoke(connectorId, actionName, args);
        },
      };
    }
    return runWithConnectorBinding(binding, () => handler.fetch(request, env, ctx));
  },
};

export default worker;
