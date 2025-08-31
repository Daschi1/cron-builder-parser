import type { RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ url }) => {
  const origin = url.origin;
  const lines = [
    "# allow crawling everything by default",
    "User-agent: *",
    "Disallow:",
    "",
    `Sitemap: ${origin}/sitemap.xml`
  ];
  const body = lines.join("\n") + "\n";
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400"
    }
  });
};
