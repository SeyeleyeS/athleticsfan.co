import { affiliateFooter, nav, siteName, siteUrl, trademarkLine, unofficialDisclaimer } from "../content/site";
import { cspMeta, escapeHtml, safeJson } from "./markup";

export type DocumentInput = {
  title: string;
  description: string;
  path: string;
  stylesheetHref: string;
  scriptSrc: string;
  body: string;
  jsonLd?: unknown;
  robots?: string;
  ogType?: string;
  origin?: string;
};

function absolute(origin: string, path: string): string {
  if (path === "/") return `${origin}/`;
  return `${origin}${path}`;
}

export async function renderDocument(input: DocumentInput): Promise<string> {
  const origin = (input.origin ?? siteUrl).replace(/\/$/, "");
  const canonical = absolute(origin, input.path);
  const description = input.description;
  const title = input.title;
  const jsonLd = input.jsonLd ? safeJson(input.jsonLd) : null;
  const robots = input.robots ?? "index, follow";
  const ogType = input.ogType ?? "website";
  const navHtml = nav
    .map((item) => {
      const current = item.href === input.path ? ` aria-current="page"` : "";
      return `<a href="${item.href}"${current}>${item.label}</a>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <meta name="robots" content="${escapeHtml(robots)}">
  <meta name="theme-color" content="#0f3d30">
  <meta property="og:site_name" content="${escapeHtml(siteName)}">
  <meta property="og:type" content="${escapeHtml(ogType)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <meta property="og:image" content="${escapeHtml(origin)}/og.png">
  <meta property="og:image:alt" content="athleticsfan.co wordmark on green">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(origin)}/og.png">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">
  <link rel="stylesheet" href="${escapeHtml(input.stylesheetHref)}">
  ${await cspMeta(jsonLd)}
  ${jsonLd ? `<script type="application/ld+json">${jsonLd}</script>` : ""}
</head>
<body>
  <a class="skip" href="#content">Skip to content</a>
  <p class="topline">${escapeHtml(unofficialDisclaimer)}</p>
  <header class="mast">
    <a class="wordmark" href="/">
      <span class="wordmark-mark" aria-hidden="true">af</span>
      <span class="wordmark-text">athleticsfan.co</span>
    </a>
    <p class="mast-deck">Independent journal and clubhouse. Green and gold, and none of the official marks.</p>
    <nav class="site-nav" aria-label="Sections">
      ${navHtml}
      <span data-auth class="auth-slot"><a href="/account/">Sign in</a></span>
    </nav>
  </header>
  <main id="content">
    ${input.body}
  </main>
  <footer class="site-foot">
    <p>${escapeHtml(unofficialDisclaimer)}</p>
    <p>${escapeHtml(trademarkLine)}</p>
    <p>${escapeHtml(affiliateFooter)} <a href="/official-gear/">Official Gear disclosure</a>.</p>
    <p class="foot-links"><a href="/about/">About</a> <a href="/news/">News &amp; Links</a> <a href="https://www.mlb.com/athletics" rel="noopener" target="_blank">MLB.com Athletics<span class="sr-only"> (opens in a new tab)</span></a></p>
  </footer>
  <script type="module" src="${escapeHtml(input.scriptSrc)}"></script>
</body>
</html>`;
}

export function websiteNode(origin: string): Record<string, unknown> {
  return {
    "@type": "WebSite",
    name: siteName,
    url: `${origin}/`,
    description:
      "An unofficial fan journal and clubhouse for the Athletics, from Philadelphia and Oakland through Sacramento to Las Vegas.",
  };
}
