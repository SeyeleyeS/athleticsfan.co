# athleticsfan.co

An unofficial fan journal and clubhouse for the Athletics. It covers the Philadelphia and Kansas City roots, the Oakland years, the Sacramento seasons at Sutter Health Park, and the ballpark aimed at Las Vegas. The point of the site, in the owner's words, is to help the Athletics, not take them away.

It is not affiliated with, endorsed by, or sponsored by MLB or the Athletics. The footer says so on every page. The wordmark is original. Green and gold are used as colors. Team and MLB logos are not displayed.

## What you get

- Journal essays under `/history/`, with sources linked out.
- An A's News & Links desk driven by `config/news-links.json`.
- A clubhouse: topics, threads, and replies.
- Polls with one vote per account.
- A callout-or-praise board with reports and an admin hide/delete queue.
- Player cards that link to MLB.com. No stats are stored or scraped onto the page.
- Fan Gear by Fans: handmade listings with an external link. The site does not take payment.
- Official Gear: affiliate links, seeded for Fanatics, edited in one config file.

## Decisions

These are the calls made while building, so a later change does not have to reverse-engineer them.

- **Stack.** Vite multi-page static site, Cloudflare Pages Functions for the API and for thread pages, D1 for accounts and posts. History, players, news, and official gear are static HTML so they load without the API. Threads are rendered by a Function so each one can carry a real title, description, and `DiscussionForumPosting` JSON-LD.
- **Config format.** `wrangler.toml` is what this deploy guide asked for. Newer Cloudflare examples prefer JSONC; this repo stays on TOML so the steps below match the file.
- **No logos.** An earlier note allowed a small MLB static logo. That was superseded: the header is an original "af" monogram plus the athleticsfan.co wordmark. There is no team logo URL in the repo.
- **Players.** Cards are a fan-curated cut of the 40-man snapshot from MLB's public roster feed on November 16, 2026. Each link is `https://www.mlb.com/player/{id}`, which redirects to the official slug URL. Positions can change. The page says MLB.com is the source of truth. Max Muncy is labeled as the Athletics infielder, not the Dodgers' Max Muncy.
- **Accounts.** Username and password. No email, so there is no magic link and no self-serve reset. Passwords are PBKDF2-SHA-256, 100,000 iterations, via Web Crypto. The session cookie is `af_session`, HttpOnly, SameSite=Lax, 14 days, Secure on https. A lost password is an admin SQL update using `npm run hash-password`.
- **CPU.** That hash needs more than the Workers Free 10ms CPU cap. `wrangler.toml` sets `limits.cpu_ms = 30000`. Use a plan that allows it. If deploy rejects the limit, do not drop the iteration count in silence; see the Cloudflare section below.
- **Polls.** One vote per account, and it cannot be changed.
- **Language and reports.** A short server-side blocklist stops slurs, a few threats, and the strongest profanity, including letter-spacing tricks. It is not a full moderator. Anything else can be reported. Admins can hide (public lists skip it) or delete.
- **Rate limits.** Fixed windows stored in D1: registration, login, posts, and reports. The limits are in `src/server/app.ts`.
- **Fan gear.** The seller must check "no MLB or Athletics logos, trademarks, or licensed designs." The API rejects the listing without that boolean. Links are https only. User-submitted links use `rel="ugc noopener"`. The site never checks out.
- **Official gear.** `config/affiliate-links.json`. Each entry has `label`, `url`, `category`, optional `image`, optional `note`, and `partner`. A missing `partner` is treated as Fanatics. Seeded entries are Jerseys, Caps, Tees, and Collectibles, with `REPLACE-WITH` placeholder URLs so a real affiliate code is not invented. Adding another partner is a new object in that file. Links use `rel="sponsored noopener"`. The page and the footer carry an FTC-style disclosure. The site sells nothing.
- **Editorial links.** News and history links use `rel="noopener"` and do not use `nofollow`.
- **News links.** Checked on November 16, 2026. The Sacramento Bee section (`https://www.sacbee.com/sports/mlb/`) did not respond from this environment (timeouts and an HTTP/2 error). It is in the config with `verified: false` and the page badges it "Not confirmed." The Examiner link is the sports section, which returned HTTP 200; a dedicated Athletics landing path was not confirmed. Everything else in the file returned HTTP 200, including redirects (Bleacher Report's old Oakland path now lands on `/the-athletics`; The Athletic's short URL lands on NYTimes).
- **History.** 2026 is written as 64–98, fourth in the AL West, from the Baseball-Reference 2026 page, which also lists Mark Kotsay as manager and David Forst as general manager. A compilation that named a mid-August GM change was not used, because that same Baseball-Reference page still lists Forst. Confirm the front office on MLB.com. The June 8–14, 2026 games were at Las Vegas Ballpark in Summerlin, not at the Strip ballpark. A 2028 Strip opening is described as the club's stated target. No specific Opening Day is claimed. Spring Training 2027 is not given a site; the club has long trained in Mesa, and the camp thread says to wait for MLB.com.
- **Demo data.** Fictional fans live only in `seeds/demo.sql`. `wrangler d1 migrations apply` does not load them. Production migrations create the schema and the six topics, and no users.
- **Canonical URL.** Static pages bake `https://athleticsfan.co` from `src/content/site.ts`. Thread pages, `robots.txt`, and `sitemap.xml` use the `SITE_URL` var, which defaults to the same host. Change both if the domain differs.

## Local preview with demo fans

Requires Node 22.

```bash
npm install
npm run build
CI=1 npx wrangler d1 migrations apply athleticsfan --local
CI=1 npm run db:demo
npm run preview
```

`npm run preview` is `wrangler pages dev dist --port 8788`. Open http://127.0.0.1:8788.

Demo accounts are labeled "Demo account" on their posts. Passwords below are for that local seed only. Do not load `seeds/demo.sql` on production, and change these if you ever do.

| Username | Password |
| --- | --- |
| coliseum_kid | Demo-Kid-2026! |
| rivercity_ana | Demo-Ana-2026! |
| strip_bound | Demo-Strip-2026! |
| mesa_notebook | Demo-Mesa-2026! |

Re-running the demo file fails once the rows exist. Reset local state with `rm -rf .wrangler` and apply the migrations again.

Regenerate the SQL after a hashing change with `npm run demo-seed`.

## Tests and build

```bash
npm test
npm run typecheck
npm run build
```

- **Build command:** `npm run build`
- **Output directory:** `dist`

`npm test` covers register and login, the mutation header, one vote per poll, the fan-gear checkbox, reports, admin hide, the language filter, rate limits, the news-link file, and the rule that demo usernames are not in `migrations/`.

## Cloudflare: what to set

1. `npx wrangler login` (or a CI API token with D1 and Pages edit).
2. Create the database:

   ```bash
   npx wrangler d1 create athleticsfan
   ```

3. Copy the database UUID into `wrangler.toml`, replacing `database_id = "00000000-0000-0000-0000-000000000000"`. The binding name must stay `DB`.
4. Apply the schema to the remote database. This creates tables and the six topics. It does not create users.

   ```bash
   CI=1 npx wrangler d1 migrations apply athleticsfan --remote
   ```

5. Create a Pages project connected to this GitHub repo.
   - Production branch: `main` (or whichever branch you deploy).
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Environment: Node 22.
   - The project should use the V2 Pages build system so `wrangler.toml` bindings are the source of truth.
6. `compatibility_date` is `2026-11-16`, with `nodejs_compat`. Logs and traces are turned on in the same file.
7. `SITE_URL` is `https://athleticsfan.co`. Override it in the Pages dashboard only if you also change `src/content/site.ts` and rebuild. Static canonicals come from the TypeScript constant.
8. `preview_database_id = "DB"` is the local Pages development key from the D1 docs. It is not a remote database. For a real Preview environment, point it at a separate D1 UUID or remove the line if deploy complains.
9. If the plan rejects `limits.cpu_ms = 30000`, sign-in will fail on the Free CPU cap before you should weaken the hash. Move the project to a plan that allows the higher CPU limit, or lower `cpu_ms` only as far as the plan allows and then retest a login.
10. Attach the domain athleticsfan.co to the Pages project when DNS is ready.
11. Create the first admin. The password is an argument, so it will sit in your shell history. Prefer a one-off terminal you can close.

    ```bash
    npm run hash-password -- editor 'a long passphrase you keep'
    ```

    The command prints an `INSERT`. Run it with:

    ```bash
    npx wrangler d1 execute athleticsfan --remote --command "<that INSERT>"
    ```

    Then sign in at `/account/` and open `/moderation/`.

Do not run `npm run db:demo` with `--remote`.

## Edit affiliate links

Edit `config/affiliate-links.json` only.

- `disclosure` is the paragraph at the top of Official Gear. The shorter footer line lives in `src/content/site.ts` (`affiliateFooter`).
- Each link: `label`, `url`, `category`, optional `image` (https), optional `note`, optional `partner`.
- Omit `partner` and the page treats it as Fanatics.
- A second partner is another object with a different `partner` string. No code change. The page groups by partner.
- Replace every `REPLACE-WITH` URL before sending fans there. The page badges those placeholders.
- Rebuild and redeploy. The page is generated at build time from that file.

Example of a later partner, still not a checkout:

```json
{
  "partner": "Another Shop",
  "category": "Caps",
  "label": "Athletics caps",
  "url": "https://example.com/REPLACE-WITH-AFFILIATE-URL",
  "image": ""
}
```

## Edit news links

Edit `config/news-links.json`.

- Required: `id`, `label`, `publisher`, `url` (https), `description`, `region`, `verified` (boolean).
- Optional `note` is shown under the link. Set `verified` to `false` if you have not confirmed the URL, and the page will badge it.
- History essays and topic pages pull links by `id` (`linkIds` on articles and categories). A new id is available to those lists after you add it there too.
- Rebuild and redeploy.

## Screenshots

Taken from the local preview with the demo seed loaded:

- `docs/screenshots/home.png`
- `docs/screenshots/home_mobile.png`
- `docs/screenshots/thread.png`
- `docs/screenshots/polls.png`
- `docs/screenshots/shoutouts.png`
- `docs/screenshots/fan_gear.png`
- `docs/screenshots/official_gear.png`
- `docs/screenshots/history.png`
- `docs/screenshots/history_article.png`
- `docs/screenshots/players.png`
- `docs/screenshots/news.png`
