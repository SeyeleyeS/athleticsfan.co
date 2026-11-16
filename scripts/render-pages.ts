import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import affiliateFile from "../config/affiliate-links.json";
import { articles, type Block } from "../src/content/articles";
import { categories } from "../src/content/categories";
import { mlbPlayerUrl, playerGroups, players, rosterSnapshot } from "../src/content/players";
import { siteUrl, unofficialDisclaimer } from "../src/content/site";
import { renderDocument, websiteNode, type DocumentInput } from "../src/server/document";
import { escapeHtml, richText } from "../src/server/markup";
import { linksByIds, newsCheckedOn, newsLinks, renderNewsList } from "../src/server/news";

const root = resolve(import.meta.dirname, "..");
const web = resolve(root, "web");

function relPrefix(dir: string): string {
  const depth = dir === "" ? 0 : dir.split("/").length;
  return "../".repeat(depth + 1);
}

type PageInput = Omit<DocumentInput, "stylesheetHref" | "scriptSrc"> & { script: string };

async function writePage(dir: string, input: PageInput): Promise<void> {
  const prefix = relPrefix(dir);
  const html = await renderDocument({
    ...input,
    stylesheetHref: `${prefix}src/styles/site.css`,
    scriptSrc: `${prefix}src/client/pages/${input.script}.ts`,
    origin: siteUrl,
  });
  const file = resolve(web, dir, "index.html");
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}

function articleBody(blocks: Block[]): string {
  return blocks
    .map((block, index) => {
      if (block.type === "h2") return `<h2>${escapeHtml(block.text)}</h2>`;
      if (block.type === "note") return `<aside class="note"><p><strong>Open question. </strong>${richText(block.text)}</p></aside>`;
      const drop = index === 0 ? " drop" : "";
      return `<p class="${drop.trim()}">${richText(block.text)}</p>`;
    })
    .join("\n");
}

function cards(items: string): string {
  return `<div class="card-grid">${items}</div>`;
}

const sortedArticles = [...articles].sort((a, b) => a.order - b.order);
const lead = sortedArticles[0];
const origin = siteUrl;

async function main(): Promise<void> {
  await writePage("", {
    title: "athleticsfan.co · Independent Athletics fan journal and clubhouse",
    description:
      "An unofficial journal and clubhouse for Athletics fans: Oakland history, the Sacramento years at Sutter Health Park, and the Las Vegas ballpark.",
    path: "/",
    script: "home",
    jsonLd: { "@context": "https://schema.org", "@graph": [websiteNode(origin)] },
    body: `<section class="home-lead">
      <p class="kicker">November 16, 2026 · West Sacramento · Las Vegas</p>
      <h1>An independent journal for Athletics fans</h1>
      <p class="deck">Oakland history, the Sacramento years at Sutter Health Park, and the ballpark coming to the Strip. We want to help the Athletics, not take them away.</p>
    </section>
    <section class="split">
      <article class="card">
        <p class="kicker">${escapeHtml(lead.kicker)}</p>
        <h2><a href="/history/${lead.slug}/">${escapeHtml(lead.title)}</a></h2>
        <p>${escapeHtml(lead.description)}</p>
        <a href="/history/${lead.slug}/">Read the piece</a>
      </article>
      <aside>
        <h2>Also in the journal</h2>
        <ul class="link-list">
          ${sortedArticles
            .slice(1, 4)
            .map(
              (article) =>
                `<li><a href="/history/${article.slug}/">${escapeHtml(article.title)}</a><p>${escapeHtml(article.description)}</p></li>`,
            )
            .join("")}
        </ul>
        <a href="/history/">All history</a>
      </aside>
    </section>
    <section>
      <h2>Clubhouse</h2>
      ${cards(
        categories
          .map(
            (category) =>
              `<article class="card"><h3><a href="/clubhouse/${category.slug}/">${escapeHtml(category.name)}</a></h3><p>${escapeHtml(category.description)}</p></article>`,
          )
          .join(""),
      )}
    </section>
    <section id="live-poll" class="live" aria-live="polite"><h2>Latest poll</h2><p>Loading the latest poll.</p></section>
    <section id="live-shoutouts" class="live" aria-live="polite"><h2>Callout or praise</h2><p>Loading the board.</p></section>
    <section>
      <h2>News and links</h2>
      <p>Outbound reading, not a scrape. <a href="/news/">The full desk list</a>.</p>
      ${renderNewsList(newsLinks.filter((link) => ["mlb-news", "br", "chronicle", "rvj", "bref-2026"].includes(link.id)))}
    </section>
    <section>
      <h2>Official gear</h2>
      <p>Fanatics affiliate links, when the owner pastes them in. This site sells nothing. <a href="/official-gear/">See the disclosure</a>.</p>
    </section>`,
  });

  await writePage("history", {
    title: "Franchise history · athleticsfan.co",
    description:
      "Original essays on the Athletics from Philadelphia and Kansas City through the Oakland dynasty, Moneyball, Sacramento, and the Las Vegas ballpark.",
    path: "/history/",
    script: "static",
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [websiteNode(origin), { "@type": "CollectionPage", name: "Franchise history", url: `${origin}/history/` }],
    },
    body: `<header class="sheet"><p class="kicker">Journal</p><h1>Franchise history</h1>
      <p class="lede">Original essays. Scores and registers stay on MLB.com and Baseball-Reference. Anything unsettled is marked.</p></header>
      <div class="card-grid">
        ${sortedArticles
          .map(
            (article) => `<article class="card"><p class="kicker">${escapeHtml(article.kicker)} · ${article.date}</p>
            <h2><a href="/history/${article.slug}/">${escapeHtml(article.title)}</a></h2>
            <p>${escapeHtml(article.description)}</p></article>`,
          )
          .join("")}
      </div>`,
  });

  for (const article of articles) {
    const path = `/history/${article.slug}/`;
    await writePage(`history/${article.slug}`, {
      title: `${article.title} · athleticsfan.co`,
      description: article.description,
      path,
      script: "static",
      ogType: "article",
      jsonLd: {
        "@context": "https://schema.org",
        "@graph": [
          websiteNode(origin),
          {
            "@type": "Article",
            headline: article.title,
            description: article.description,
            datePublished: article.date,
            dateModified: article.date,
            mainEntityOfPage: `${origin}${path}`,
            image: `${origin}/og.png`,
            author: { "@type": "Organization", name: "athleticsfan.co", url: `${origin}/` },
            publisher: { "@type": "Organization", name: "athleticsfan.co", url: `${origin}/` },
          },
        ],
      },
      body: `<article class="sheet">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> <span aria-hidden="true">/</span> <a href="/history/">History</a></nav>
        <p class="kicker">${escapeHtml(article.kicker)} · <time datetime="${article.date}">${article.date}</time></p>
        <h1>${escapeHtml(article.title)}</h1>
        <p class="lede">${escapeHtml(article.description)}</p>
        <p class="fine">By the athleticsfan.co desk. Unofficial. Not a team or MLB publication.</p>
        ${articleBody(article.blocks)}
        <aside class="further"><h2>Further reading</h2>
          <p>These are editorial links. They open the source. They are not endorsements, and they are not nofollow.</p>
          ${renderNewsList(linksByIds(article.linkIds))}
        </aside>
      </article>`,
    });
  }

  const regions = [...new Set(newsLinks.map((link) => link.region))];
  await writePage("news", {
    title: "A's News & Links · athleticsfan.co",
    description:
      "A curated desk of Athletics coverage: MLB.com, Baseball-Reference, FanGraphs, Bleacher Report, Bay Area and Las Vegas papers, and MLB Pipeline.",
    path: "/news/",
    script: "static",
    jsonLd: {
      "@context": "https://schema.org",
      "@graph": [websiteNode(origin), { "@type": "CollectionPage", name: "A's News & Links", url: `${origin}/news/` }],
    },
    body: `<header class="sheet"><p class="kicker">Desk</p><h1>A's News &amp; Links</h1>
      <p class="lede">One editable list, ${escapeHtml(newsCheckedOn)}. Links were requested and the HTTP status checked from the build environment. Anything that did not resolve is marked.</p>
      <p>Edit <code>config/news-links.json</code> and rebuild. These are ordinary outbound links, <code>rel="noopener"</code>, not sponsored and not nofollow.</p></header>
      ${regions
        .map(
          (region) =>
            `<section><h2>${escapeHtml(region)}</h2>${renderNewsList(newsLinks.filter((link) => link.region === region))}</section>`,
        )
        .join("")}`,
  });

  await writePage("clubhouse", {
    title: "Clubhouse · athleticsfan.co",
    description:
      "Fan topics for the Athletics: Spring Training 2027, predictions, road trips, handmade gear, prospects, and Sacramento through the Las Vegas showcase.",
    path: "/clubhouse/",
    script: "clubhouse",
    body: `<header class="sheet"><p class="kicker">Topics</p><h1>Clubhouse</h1>
      <p class="lede">Pick a username and post. Threads are plain text. A short language filter runs first, and anything else can be reported.</p></header>
      ${cards(
        categories
          .map(
            (category) =>
              `<article class="card"><h2><a href="/clubhouse/${category.slug}/">${escapeHtml(category.name)}</a></h2><p>${escapeHtml(category.description)}</p></article>`,
          )
          .join(""),
      )}`,
  });

  for (const category of categories) {
    await writePage(`clubhouse/${category.slug}`, {
      title: `${category.name} · Clubhouse · athleticsfan.co`,
      description: category.description,
      path: `/clubhouse/${category.slug}/`,
      script: "clubhouse",
      jsonLd: {
        "@context": "https://schema.org",
        "@graph": [
          websiteNode(origin),
          { "@type": "WebPage", name: category.name, description: category.description, url: `${origin}/clubhouse/${category.slug}/` },
        ],
      },
      body: `<article>
        <nav class="crumbs" aria-label="Breadcrumb"><a href="/clubhouse/">Clubhouse</a></nav>
        <h1>${escapeHtml(category.name)}</h1>
        <p class="lede">${escapeHtml(category.description)}</p>
        <section id="thread-list" aria-live="polite"><p>Loading threads.</p></section>
        <section>
          <h2>Start a thread</h2>
          <form id="thread-form">
            <label for="thread-title">Title</label>
            <input id="thread-title" name="title" required minlength="4" maxlength="140">
            <label for="thread-body">Post</label>
            <textarea id="thread-body" name="body" required minlength="8" maxlength="4000"></textarea>
            <button type="submit">Post thread</button>
            <p id="thread-status" role="alert"></p>
          </form>
        </section>
        <aside class="further"><h2>Related reading</h2>${renderNewsList(linksByIds(category.linkIds))}</aside>
      </article>`,
    });
    const mainOpen = `<main id="content" data-category="${category.slug}">`;
    const filePath = resolve(web, `clubhouse/${category.slug}/index.html`);
    const { readFileSync } = await import("node:fs");
    const html = readFileSync(filePath, "utf8").replace("<main id=\"content\">", mainOpen);
    writeFileSync(filePath, html);
  }

  await writePage("players", {
    title: "Players and prospects · athleticsfan.co",
    description:
      "A fan-curated set of Athletics names from the November 16, 2026 40-man snapshot, with links to official MLB.com player pages and no scraped stats.",
    path: "/players/",
    script: "static",
    body: `<header class="sheet"><p class="kicker">Roster</p><h1>Players and prospects</h1>
      <p class="lede">${escapeHtml(rosterSnapshot)}</p>
      <p><a href="https://www.mlb.com/athletics/roster" rel="noopener" target="_blank">Official Athletics roster<span class="sr-only"> (opens in a new tab)</span></a>
      · <a href="https://www.mlb.com/milb/prospects/athletics" rel="noopener" target="_blank">MLB Pipeline prospects<span class="sr-only"> (opens in a new tab)</span></a></p></header>
      ${playerGroups
        .map((group) => {
          const groupPlayers = players.filter((player) => player.group === group.id);
          return `<section><h2>${escapeHtml(group.title)}</h2><p>${escapeHtml(group.lede)}</p><div class="player-grid">${groupPlayers
            .map(
              (player) => `<article class="player-card"><h3>${escapeHtml(player.name)}</h3>
              <p>${escapeHtml(player.position)}</p>
              ${player.note ? `<p class="fine">${escapeHtml(player.note)}</p>` : ""}
              <a href="${mlbPlayerUrl(player.mlbId)}" rel="noopener" target="_blank">Official MLB.com page<span class="sr-only"> (opens in a new tab)</span></a></article>`,
            )
            .join("")}</div></section>`;
        })
        .join("")}`,
  });

  await writePage("polls", {
    title: "Polls · athleticsfan.co",
    description: "Athletics fans with an account can post a poll and vote once. Results update for everyone on this page.",
    path: "/polls/",
    script: "polls",
    body: `<header class="sheet"><p class="kicker">Votes</p><h1>Polls</h1>
      <p class="lede">One vote per fan, and it sticks. Sign in, then ask the room something that is actually a choice.</p></header>
      <div id="poll-list" aria-live="polite"><p>Loading polls.</p></div>
      <section><h2>New poll</h2>
        <form id="poll-form">
          <label for="poll-question">Question</label>
          <input id="poll-question" name="question" required minlength="8" maxlength="140">
          <label for="poll-options">Choices, one per line</label>
          <textarea id="poll-options" name="options" required placeholder="Yankees&#10;Dodgers"></textarea>
          <button type="submit">Create poll</button>
          <p id="poll-status" role="alert"></p>
        </form>
      </section>`,
  });

  await writePage("shoutouts", {
    title: "Callout or praise · athleticsfan.co",
    description:
      "A civil board for Athletics fans to praise or call out the team, other fans, players, or athleticsfan.co. Reports go to a moderator.",
    path: "/shoutouts/",
    script: "shoutouts",
    body: `<header class="sheet"><p class="kicker">The board</p><h1>Callout or praise</h1>
      <p class="lede">Say something useful about the team, a player, another fan, or this site. Keep it civil. A report button sits on every note, and a moderator can hide or delete it.</p></header>
      <div id="shout-list" class="stack" aria-live="polite"><p>Loading notes.</p></div>
      <section><h2>Post</h2>
        <form id="shout-form">
          <label for="shout-kind">Which is it?</label>
          <select id="shout-kind" name="kind" required>
            <option value="praise">Praise</option>
            <option value="callout">Callout</option>
          </select>
          <label for="shout-subject">Who or what</label>
          <input id="shout-subject" name="subject" required minlength="2" maxlength="80">
          <label for="shout-body">Note</label>
          <textarea id="shout-body" name="body" required minlength="8" maxlength="1000"></textarea>
          <button type="submit">Post</button>
          <p id="shout-status" role="alert"></p>
        </form>
      </section>`,
  });

  await writePage("gear", {
    title: "Fan Gear by Fans · athleticsfan.co",
    description:
      "Handmade Athletics-fan goods posted by fans. No team or MLB logos. The site does not take payment. Sellers link out.",
    path: "/gear/",
    script: "gear",
    body: `<header class="sheet"><p class="kicker">Handmade</p><h1>Fan Gear by Fans</h1>
      <p class="lede">Fans post their own work and an external link. athleticsfan.co does not process payments, hold inventory, or take a cut of fan-made sales.</p></header>
      <section class="rules"><h2>Posting rules</h2>
        <ul>
          <li>Handmade or fan-original items only.</li>
          <li>No MLB or Athletics logos, trademarks, wordmarks, or licensed designs. Color alone, green and gold, is fine.</li>
          <li>Use an https link to the place you actually sell or give the item away.</li>
          <li>Photos must be ones you have the right to show. This site does not host uploads.</li>
          <li>Other fans can report a listing. Moderators can hide or delete it.</li>
        </ul>
      </section>
      <div id="gear-list" class="gear-grid" aria-live="polite"><p>Loading listings.</p></div>
      <section><h2>Post a listing</h2>
        <form id="gear-form">
          <label for="gear-title">Title</label>
          <input id="gear-title" name="title" required minlength="4" maxlength="80">
          <label for="gear-price">Price, as you want it read</label>
          <input id="gear-price" name="price" required maxlength="24" placeholder="$36 or free">
          <label for="gear-link">External link</label>
          <input id="gear-link" name="externalUrl" required type="url" placeholder="https://">
          <label for="gear-photo">Photo URL</label>
          <input id="gear-photo" name="photoUrl" required placeholder="https://">
          <label for="gear-desc">Description</label>
          <textarea id="gear-desc" name="description" required minlength="10" maxlength="500"></textarea>
          <label class="check"><input type="checkbox" name="noLicensedMarks" required> This item contains no MLB or Athletics logos, trademarks, or licensed designs.</label>
          <button type="submit">Post listing</button>
          <p id="gear-status" role="alert"></p>
        </form>
      </section>
      <p>Licensed merchandise belongs on <a href="/official-gear/">Official Gear</a>, which only links out.</p>`,
  });

  const affiliate = affiliateFile as {
    disclosure: string;
    links: { partner?: string; category: string; label: string; url: string; image?: string; note?: string }[];
  };
  const grouped = new Map<string, typeof affiliate.links>();
  for (const link of affiliate.links) {
    const partner = link.partner?.trim() || "Fanatics";
    const list = grouped.get(partner) ?? [];
    list.push(link);
    grouped.set(partner, list);
  }
  const affiliateHtml = [...grouped.entries()]
    .map(([partner, links]) => {
      return `<section class="partner-block"><h2>${escapeHtml(partner)}</h2><div class="card-grid">${links
        .map((link) => {
          const placeholder = link.url.includes("REPLACE-WITH");
          const image =
            link.image && link.image.startsWith("https://")
              ? `<img src="${escapeHtml(link.image)}" alt="" width="640" height="360">`
              : "";
          return `<article class="card"><p class="kicker">${escapeHtml(link.category)}</p>
            <h3>${escapeHtml(link.label)}</h3>
            ${image}
            ${placeholder ? `<p class="placeholder">Placeholder URL. Replace it in config before sending fans here.</p>` : ""}
            ${link.note ? `<p class="fine">${escapeHtml(link.note)}</p>` : ""}
            <a href="${escapeHtml(link.url)}" rel="sponsored noopener" target="_blank">Open on ${escapeHtml(partner)}<span class="sr-only"> (opens in a new tab)</span></a>
          </article>`;
        })
        .join("")}</div></section>`;
    })
    .join("");

  await writePage("official-gear", {
    title: "Official Gear · athleticsfan.co",
    description:
      "Affiliate links to Fanatics for Athletics merchandise. athleticsfan.co sells nothing. Placeholder URLs are marked until the owner replaces them.",
    path: "/official-gear/",
    script: "static",
    robots: "index, follow",
    body: `<header class="sheet"><p class="kicker">Affiliate</p><h1>Official Gear</h1>
      <div class="disclosure"><p>${escapeHtml(affiliate.disclosure)}</p></div></header>
      ${affiliateHtml}
      <p>Fan-made goods, with a no-logo rule, are a different page: <a href="/gear/">Fan Gear by Fans</a>.</p>`,
  });

  await writePage("about", {
    title: "About · athleticsfan.co",
    description:
      "What athleticsfan.co is: an unofficial fan journal and clubhouse that links to MLB.com, skips team logos, and does not sell merchandise.",
    path: "/about/",
    script: "static",
    body: `<article class="sheet"><p class="kicker">About</p><h1>About this site</h1>
      <p class="lede">${escapeHtml(unofficialDisclaimer)} The brief from the people who asked for it, paraphrased: help the Athletics, not take them away.</p>
      <h2>What you will find</h2>
      <p>A journal on the franchise from Philadelphia through Oakland, the Sacramento years at Sutter Health Park, and the Las Vegas ballpark. A clubhouse with topics, polls, and a callout-or-praise board. Player cards that link to MLB.com instead of copying stats. Two gear pages that do not check out: handmade listings that leave the site, and Fanatics affiliate links.</p>
      <h2>Marks</h2>
      <p>The wordmark is original. Green and gold are colors, not a logo. Team and MLB marks are not displayed. Trademarks belong to their owners. Names of players are used to identify them and to point at official pages.</p>
      <h2>Accounts and moderation</h2>
      <p>Pick a username and a password. Passwords are hashed with Web Crypto (PBKDF2) and never stored in the clear. A session cookie keeps you signed in. There is no email address on the account, so a lost password is an administrator reset, not a magic link. A short language filter blocks slurs and a few threats. Everything else can be reported. An admin can hide or delete posts, listings, polls, and shout-outs.</p>
      <h2>Polls</h2>
      <p>One vote per account, and the vote is final. Results are counted in the open.</p>
      <h2>Gear</h2>
      <p>Fan Gear requires a checkbox: the item contains no MLB or Athletics logos, trademarks, or licensed designs. Official Gear is a config file of outbound affiliate links. The seeded partner is Fanatics. The site sells nothing itself.</p>
      <p><a href="/news/">News &amp; Links</a> explains the outbound desk. Deploy notes for the owner live in the project README.</p>
    </article>`,
  });

  await writePage("account", {
    title: "Sign in · athleticsfan.co",
    description: "Create a username or sign in to post on athleticsfan.co.",
    path: "/account/",
    script: "account",
    robots: "noindex, follow",
    body: `<header class="sheet"><h1>Sign in</h1>
      <p>Usernames are public. Passwords stay hashed. Demo accounts on a local preview are labeled on their posts.</p></header>
      <section><h2>I have an account</h2>
        <form id="login-form">
          <label for="login-user">Username</label>
          <input id="login-user" name="username" required autocomplete="username" minlength="3" maxlength="20">
          <label for="login-pass">Password</label>
          <input id="login-pass" name="password" type="password" required autocomplete="current-password" minlength="10">
          <button type="submit">Sign in</button>
          <p id="login-form-status" role="alert"></p>
        </form>
      </section>
      <section><h2>I'm new</h2>
        <form id="register-form">
          <label for="reg-user">Username</label>
          <input id="reg-user" name="username" required autocomplete="username" minlength="3" maxlength="20" pattern="[A-Za-z0-9_]+">
          <label for="reg-pass">Password</label>
          <input id="reg-pass" name="password" type="password" required autocomplete="new-password" minlength="10">
          <button type="submit">Create account</button>
          <p id="register-form-status" role="alert"></p>
        </form>
      </section>`,
  });

  await writePage("moderation", {
    title: "Moderation · athleticsfan.co",
    description: "Hide or delete reported posts on athleticsfan.co.",
    path: "/moderation/",
    script: "moderation",
    robots: "noindex, nofollow",
    body: `<header class="sheet"><h1>Moderation</h1>
      <p>Open reports. Hide keeps a row out of public lists. Delete removes it.</p>
      <p id="mod-status" role="alert"></p></header>
      <div id="mod-list"></div>`,
  });

  const notFound = await renderDocument({
    title: "Page not found · athleticsfan.co",
    description: "That page is not on athleticsfan.co.",
    path: "/404.html",
    stylesheetHref: "../src/styles/site.css",
    scriptSrc: "../src/client/pages/static.ts",
    robots: "noindex, follow",
    origin,
    body: `<article class="sheet"><h1>Page not found</h1><p>Try the <a href="/">home page</a> or the <a href="/clubhouse/">clubhouse</a>.</p></article>`,
  });
  writeFileSync(resolve(web, "404.html"), notFound);
}

await main();
