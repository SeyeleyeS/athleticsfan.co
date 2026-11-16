import type { D1Database } from "@cloudflare/workers-types";
import { articles } from "../src/content/articles";
import { categories } from "../src/content/categories";
import { siteUrl, staticPaths } from "../src/content/site";

function loc(origin: string, path: string): string {
  const url = path === "/" ? `${origin}/` : `${origin}${path}`;
  return url.replace(/&/g, "&amp;").replace(/</g, "&lt;");
}

export const onRequest: PagesFunction<{ DB: D1Database; SITE_URL?: string }> = async (context) => {
  const origin = (context.env.SITE_URL || siteUrl).replace(/\/$/, "");
  const urls: string[] = [];
  for (const page of staticPaths) {
    urls.push(`  <url><loc>${loc(origin, page.path)}</loc><changefreq>${page.changefreq}</changefreq><priority>${page.priority}</priority></url>`);
  }
  for (const article of articles) {
    urls.push(
      `  <url><loc>${loc(origin, `/history/${article.slug}/`)}</loc><lastmod>${article.date}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`,
    );
  }
  for (const category of categories) {
    urls.push(
      `  <url><loc>${loc(origin, `/clubhouse/${category.slug}/`)}</loc><changefreq>daily</changefreq><priority>0.6</priority></url>`,
    );
  }
  try {
    const threads = await context.env.DB.prepare(
      "SELECT id, updated_at FROM threads WHERE hidden = 0 ORDER BY updated_at DESC LIMIT 500",
    ).all<{ id: string; updated_at: string }>();
    for (const thread of threads.results ?? []) {
      const day = thread.updated_at.slice(0, 10);
      urls.push(
        `  <url><loc>${loc(origin, `/clubhouse/t/${thread.id}`)}</loc><lastmod>${day}</lastmod><changefreq>daily</changefreq><priority>0.5</priority></url>`,
      );
    }
  } catch (error) {
    console.error(JSON.stringify({ message: "sitemap threads skipped", error: error instanceof Error ? error.message : "unknown" }));
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
};
