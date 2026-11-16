export const siteUrl = "https://athleticsfan.co";
export const siteName = "athleticsfan.co";

export const unofficialDisclaimer =
  "athleticsfan.co is an unofficial fan site and is not affiliated with, endorsed by, or sponsored by MLB or the Athletics.";

export const trademarkLine =
  "Trademarks belong to their owners. This site does not display team or MLB logos. Player names are used only to identify people and to link to their official pages.";

export const affiliateFooter =
  "Official Gear links may be affiliate or referral links, including links to Fanatics. If you buy through them, athleticsfan.co may earn a commission. This site sells nothing and does not take payment.";

export const nav = [
  { href: "/", label: "Home" },
  { href: "/history/", label: "History" },
  { href: "/news/", label: "News & Links" },
  { href: "/clubhouse/", label: "Clubhouse" },
  { href: "/players/", label: "Players" },
  { href: "/polls/", label: "Polls" },
  { href: "/shoutouts/", label: "Callouts" },
  { href: "/gear/", label: "Fan Gear" },
  { href: "/official-gear/", label: "Official Gear" },
  { href: "/about/", label: "About" },
] as const;

export const staticPaths = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/history/", changefreq: "weekly", priority: "0.8" },
  { path: "/news/", changefreq: "weekly", priority: "0.7" },
  { path: "/clubhouse/", changefreq: "daily", priority: "0.8" },
  { path: "/players/", changefreq: "weekly", priority: "0.7" },
  { path: "/polls/", changefreq: "daily", priority: "0.6" },
  { path: "/shoutouts/", changefreq: "daily", priority: "0.6" },
  { path: "/gear/", changefreq: "daily", priority: "0.6" },
  { path: "/official-gear/", changefreq: "monthly", priority: "0.4" },
  { path: "/about/", changefreq: "monthly", priority: "0.5" },
] as const;
