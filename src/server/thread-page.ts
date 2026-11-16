import type { D1Database } from "@cloudflare/workers-types";
import { categories } from "../content/categories";
import { siteUrl } from "../content/site";
import { getPublicThread } from "./app";
import { renderDocument, websiteNode } from "./document";
import { escapeHtml, plainToHtml } from "./markup";
import { linksByIds, renderNewsList } from "./news";

function excerpt(text: string): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= 155) return flat;
  return `${flat.slice(0, 152).trimEnd()}...`;
}

export async function renderThreadResponse(db: D1Database, id: string, origin: string): Promise<Response> {
  const thread = await getPublicThread(db, id);
  if (!thread) {
    const html = await renderDocument({
      title: "Thread not found · athleticsfan.co",
      description: "That clubhouse thread is not available.",
      path: `/clubhouse/t/${id}`,
      stylesheetHref: "/assets/site.css",
      scriptSrc: "/assets/thread.js",
      robots: "noindex, follow",
      origin,
      body: `<article class="sheet"><h1>Thread not found</h1><p>It may have been removed. <a href="/clubhouse/">Back to the clubhouse</a>.</p></article>`,
    });
    return new Response(html, {
      status: 404,
      headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
    });
  }

  const category = categories.find((item) => item.slug === thread.category.slug);
  const further = category ? renderNewsList(linksByIds(category.linkIds)) : "";
  const replies = thread.replies
    .map(
      (reply) => `<li class="post" id="reply-${escapeHtml(reply.id)}">
        <header class="post-meta">${authorHtml(reply.author.username, reply.author.isDemo)}
          <time datetime="${escapeHtml(reply.createdAt)}">${escapeHtml(reply.createdAt.slice(0, 10))}</time>
        </header>
        <div class="prose">${plainToHtml(reply.body)}</div>
        <button type="button" class="text-button" data-report-type="reply" data-report-id="${escapeHtml(reply.id)}">Report</button>
      </li>`,
    )
    .join("");

  const path = `/clubhouse/t/${thread.id}`;
  const pageOrigin = origin.replace(/\/$/, "");
  const canonical = `${pageOrigin}${path}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      websiteNode(pageOrigin),
      {
        "@type": "DiscussionForumPosting",
        headline: thread.title,
        text: thread.body,
        datePublished: thread.createdAt,
        dateModified: thread.updatedAt,
        url: canonical,
        author: { "@type": "Person", name: thread.author.username },
        commentCount: thread.replies.length,
        comment: thread.replies.slice(0, 30).map((reply) => ({
          "@type": "Comment",
          text: reply.body,
          datePublished: reply.createdAt,
          author: { "@type": "Person", name: reply.author.username },
          url: `${canonical}#reply-${reply.id}`,
        })),
      },
    ],
  };

  const html = await renderDocument({
    title: `${thread.title} · Clubhouse · athleticsfan.co`,
    description: excerpt(thread.body),
    path,
    stylesheetHref: "/assets/site.css",
    scriptSrc: "/assets/thread.js",
    ogType: "article",
    origin: pageOrigin,
    jsonLd,
    body: `<article class="sheet thread" data-thread-id="${escapeHtml(thread.id)}">
      <nav class="crumbs" aria-label="Breadcrumb">
        <a href="/">Home</a>
        <span aria-hidden="true">/</span>
        <a href="/clubhouse/">Clubhouse</a>
        <span aria-hidden="true">/</span>
        <a href="/clubhouse/${escapeHtml(thread.category.slug)}/">${escapeHtml(thread.category.name)}</a>
      </nav>
      ${thread.announcement ? `<p class="flag">Announcement</p>` : ""}
      <h1>${escapeHtml(thread.title)}</h1>
      <header class="post-meta">${authorHtml(thread.author.username, thread.author.isDemo)}
        <time datetime="${escapeHtml(thread.createdAt)}">${escapeHtml(thread.createdAt.slice(0, 10))}</time>
      </header>
      <div class="prose">${plainToHtml(thread.body)}</div>
      <button type="button" class="text-button" data-report-type="thread" data-report-id="${escapeHtml(thread.id)}">Report this thread</button>
      <section aria-labelledby="replies-heading">
        <h2 id="replies-heading">Replies</h2>
        ${replies ? `<ol class="reply-list">${replies}</ol>` : `<p>No replies yet.</p>`}
      </section>
      <section aria-labelledby="reply-heading">
        <h2 id="reply-heading">Add a reply</h2>
        <p>You need an account. Replies post through the site script.</p>
        <form id="reply-form">
          <label for="reply-body">Reply</label>
          <textarea id="reply-body" name="body" required maxlength="4000" rows="5"></textarea>
          <button type="submit">Post reply</button>
          <p id="reply-status" role="alert"></p>
        </form>
      </section>
      ${
        further
          ? `<aside class="further"><h2>Related reading</h2><p>Editorial links. Numbers and news live on these sites.</p>${further}</aside>`
          : ""
      }
    </article>`,
  });

  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=60" },
  });
}

function authorHtml(username: string, isDemo: boolean): string {
  const badge = isDemo ? `<span class="demo-badge">Demo account</span>` : "";
  return `<span class="author">${escapeHtml(username)}</span>${badge}`;
}

export function requestOrigin(request: Request, configured?: string): string {
  return (configured || siteUrl).replace(/\/$/, "");
}
