import { siteUrl } from "../src/content/site";

export const onRequest: PagesFunction<{ SITE_URL?: string }> = async (context) => {
  const origin = (context.env.SITE_URL || siteUrl).replace(/\/$/, "");
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`;
  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
};
