import { listPublishedArticles } from "../../../lib/public-articles";

export async function GET() {
  return Response.json(await listPublishedArticles(50), {
    headers: { "Cache-Control": "public, max-age=30" },
  });
}
