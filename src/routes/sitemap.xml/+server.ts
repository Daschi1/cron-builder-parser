import type { RequestHandler } from "@sveltejs/kit";

// Compute a stable lastmod at module load (approximates deploy time)
const BUILD_LASTMOD = new Date().toISOString();

const pages = [
  {
    path: "/",
    changefreq: "yearly",
    priority: 1.0
  },
  {
    path: "/licenses",
    changefreq: "yearly",
    priority: 0.6
  }
] as const;

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const GET: RequestHandler = async ({ url }) => {
  const origin = url.origin;
  const lastmod = BUILD_LASTMOD;
  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
    pages
      .map((p) => {
        const loc = xmlEscape(`${origin}${p.path}`);
        return `\n  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority.toFixed(1)}</priority>\n  </url>`;
      })
      .join("") +
    `\n</urlset>\n`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      // Encourage caching for a day; adjust if content changes more frequently
      "Cache-Control": "public, max-age=86400"
    }
  });
};
