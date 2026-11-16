import type { D1Database } from "@cloudflare/workers-types";
import { containsBlockedLanguage } from "./profanity";
import { hashPassword, sha256Hex, verifyPassword } from "./password";
import {
  ApiError,
  assertMutation,
  clientIp,
  cookieValue,
  isId,
  json,
  readJson,
  sessionCookie,
  textField,
} from "./http";

export type AppEnv = { DB: D1Database };

type UserRow = { id: string; username: string; role: string; is_demo: number };
type PublicUser = { id: string; username: string; role: string; isDemo: boolean };

const SESSION_DAYS = 14;
let dummySalt: Uint8Array | null = null;

function getDummySalt(): Uint8Array {
  if (!dummySalt) dummySalt = crypto.getRandomValues(new Uint8Array(16));
  return dummySalt;
}

function publicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    username: row.username,
    role: row.role,
    isDemo: row.is_demo === 1,
  };
}

function author(row: { username: string; is_demo: number }) {
  return { username: row.username, isDemo: row.is_demo === 1 };
}

async function one<T>(db: D1Database, sql: string, ...params: Array<string | number>): Promise<T | null> {
  const row = await db.prepare(sql).bind(...params).first<T>();
  return row ?? null;
}

async function many<T>(db: D1Database, sql: string, ...params: Array<string | number>): Promise<T[]> {
  const result = await db.prepare(sql).bind(...params).all<T>();
  return result.results ?? [];
}

async function rateLimit(db: D1Database, bucket: string, limit: number, windowMs: number): Promise<void> {
  const now = Date.now();
  const resetAt = now + windowMs;
  await db
    .prepare(
      `INSERT INTO rate_limits (bucket, count, reset_at)
       VALUES (?, 1, ?)
       ON CONFLICT(bucket) DO UPDATE SET
         count = CASE WHEN rate_limits.reset_at <= ? THEN 1 ELSE rate_limits.count + 1 END,
         reset_at = CASE WHEN rate_limits.reset_at <= ? THEN ? ELSE rate_limits.reset_at END`,
    )
    .bind(bucket, resetAt, now, now, resetAt)
    .run();
  const row = await one<{ count: number }>(db, "SELECT count FROM rate_limits WHERE bucket = ?", bucket);
  if (row && row.count > limit) throw new ApiError(429, "Too many requests. Try again in a little while.");
}

function bounded(value: string, min: number, max: number, label: string, screen = true): string {
  if (value.length < min || value.length > max) {
    throw new ApiError(400, `${label} needs to be between ${min} and ${max} characters.`);
  }
  if (screen && containsBlockedLanguage(value)) {
    throw new ApiError(
      400,
      "That text breaks the language rules. Rewrite it, or report someone else's post instead of repeating it.",
    );
  }
  return value;
}

function httpsUrl(value: string, label: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ApiError(400, `${label} needs a full https link.`);
  }
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new ApiError(400, `${label} needs a full https link.`);
  }
  return url.toString();
}

function photoRef(value: string): string {
  if (/^\/artwork\/[a-z0-9-]+\.svg$/.test(value)) return value;
  return httpsUrl(value, "Photo");
}

async function currentUser(request: Request, db: D1Database): Promise<UserRow | null> {
  const token = cookieValue(request, "af_session");
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const tokenHash = await sha256Hex(token);
  return one<UserRow>(
    db,
    `SELECT u.id, u.username, u.role, u.is_demo
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at > ?`,
    tokenHash,
    new Date().toISOString(),
  );
}

async function requireUser(request: Request, db: D1Database): Promise<UserRow> {
  const user = await currentUser(request, db);
  if (!user) throw new ApiError(401, "Sign in first.");
  return user;
}

async function startSession(user: UserRow, request: Request, db: D1Database): Promise<Response> {
  const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
  const token = [...tokenBytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  const tokenHash = await sha256Hex(token);
  const now = new Date();
  const expires = new Date(now.getTime() + SESSION_DAYS * 86_400_000);
  await db
    .prepare("INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)")
    .bind(tokenHash, user.id, expires.toISOString(), now.toISOString())
    .run();
  const secure = new URL(request.url).protocol === "https:";
  return json({ user: publicUser(user) }, 200, { "Set-Cookie": sessionCookie(token, secure) });
}

async function getThreadRecord(db: D1Database, id: string, includeHidden = false) {
  const hiddenClause = includeHidden ? "" : "AND t.hidden = 0";
  return one<{
    id: string;
    title: string;
    body: string;
    is_announcement: number;
    hidden: number;
    created_at: string;
    updated_at: string;
    username: string;
    is_demo: number;
    category_name: string;
    category_slug: string;
  }>(
    db,
    `SELECT t.id, t.title, t.body, t.is_announcement, t.hidden, t.created_at, t.updated_at,
            u.username, u.is_demo, c.name AS category_name, c.slug AS category_slug
     FROM threads t
     JOIN users u ON u.id = t.user_id
     JOIN categories c ON c.id = t.category_id
     WHERE t.id = ? ${hiddenClause}`,
    id,
  );
}

export async function getPublicThread(db: D1Database, id: string) {
  if (!isId(id)) return null;
  const thread = await getThreadRecord(db, id, false);
  if (!thread) return null;
  const replies = await many<{
    id: string;
    body: string;
    created_at: string;
    username: string;
    is_demo: number;
  }>(
    db,
    `SELECT r.id, r.body, r.created_at, u.username, u.is_demo
     FROM replies r JOIN users u ON u.id = r.user_id
     WHERE r.thread_id = ? AND r.hidden = 0
     ORDER BY r.created_at ASC
     LIMIT 200`,
    id,
  );
  return {
    id: thread.id,
    title: thread.title,
    body: thread.body,
    announcement: thread.is_announcement === 1,
    createdAt: thread.created_at,
    updatedAt: thread.updated_at,
    category: { slug: thread.category_slug, name: thread.category_name },
    author: author(thread),
    replies: replies.map((reply) => ({
      id: reply.id,
      body: reply.body,
      createdAt: reply.created_at,
      author: author(reply),
    })),
  };
}

async function targetVisible(db: D1Database, type: string, id: string): Promise<boolean> {
  const queries: Record<string, string> = {
    thread: "SELECT id FROM threads WHERE id = ? AND hidden = 0",
    reply: "SELECT id FROM replies WHERE id = ? AND hidden = 0",
    shoutout: "SELECT id FROM shoutouts WHERE id = ? AND hidden = 0",
    gear: "SELECT id FROM gear_listings WHERE id = ? AND hidden = 0",
    poll: "SELECT id FROM polls WHERE id = ? AND hidden = 0",
  };
  const sql = queries[type];
  if (!sql) return false;
  const row = await one<{ id: string }>(db, sql, id);
  return Boolean(row);
}

async function hideTarget(db: D1Database, type: string, id: string): Promise<boolean> {
  const queries: Record<string, string> = {
    thread: "UPDATE threads SET hidden = 1 WHERE id = ?",
    reply: "UPDATE replies SET hidden = 1 WHERE id = ?",
    shoutout: "UPDATE shoutouts SET hidden = 1 WHERE id = ?",
    gear: "UPDATE gear_listings SET hidden = 1 WHERE id = ?",
    poll: "UPDATE polls SET hidden = 1 WHERE id = ?",
  };
  const sql = queries[type];
  if (!sql) return false;
  const result = await db.prepare(sql).bind(id).run();
  return (result.meta?.changes ?? 0) > 0;
}

async function deleteTarget(db: D1Database, type: string, id: string): Promise<boolean> {
  const queries: Record<string, string> = {
    thread: "DELETE FROM threads WHERE id = ?",
    reply: "DELETE FROM replies WHERE id = ?",
    shoutout: "DELETE FROM shoutouts WHERE id = ?",
    gear: "DELETE FROM gear_listings WHERE id = ?",
    poll: "DELETE FROM polls WHERE id = ?",
  };
  const sql = queries[type];
  if (!sql) return false;
  const result = await db.prepare(sql).bind(id).run();
  await db.prepare("DELETE FROM reports WHERE target_type = ? AND target_id = ?").bind(type, id).run();
  return (result.meta?.changes ?? 0) > 0;
}

async function pollPayload(db: D1Database, pollId: string, userId: string | null) {
  const poll = await one<{
    id: string;
    question: string;
    created_at: string;
    username: string;
    is_demo: number;
  }>(
    db,
    `SELECT p.id, p.question, p.created_at, u.username, u.is_demo
     FROM polls p JOIN users u ON u.id = p.user_id
     WHERE p.id = ? AND p.hidden = 0`,
    pollId,
  );
  if (!poll) return null;
  const options = await many<{ id: string; label: string; votes: number }>(
    db,
    `SELECT o.id, o.label, COUNT(v.user_id) AS votes
     FROM poll_options o
     LEFT JOIN poll_votes v ON v.option_id = o.id
     WHERE o.poll_id = ?
     GROUP BY o.id
     ORDER BY o.sort_order ASC`,
    pollId,
  );
  const mine = userId
    ? await one<{ option_id: string }>(
        db,
        "SELECT option_id FROM poll_votes WHERE poll_id = ? AND user_id = ?",
        pollId,
        userId,
      )
    : null;
  const total = options.reduce((sum, option) => sum + Number(option.votes), 0);
  return {
    id: poll.id,
    question: poll.question,
    createdAt: poll.created_at,
    author: author(poll),
    total,
    yourVote: mine?.option_id ?? null,
    options: options.map((option) => ({ id: option.id, label: option.label, votes: Number(option.votes) })),
  };
}

export async function handleApi(request: Request, env: AppEnv): Promise<Response> {
  const url = new URL(request.url);
  let path = url.pathname;
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  const method = request.method.toUpperCase();
  const db = env.DB;

  try {
    if (method === "GET" && path === "/api/health") {
      const row = await one<{ n: number }>(db, "SELECT COUNT(*) AS n FROM categories");
      return json({ ok: true, categories: Number(row?.n ?? 0) });
    }

    if (path === "/api/auth/register" && method === "POST") {
      assertMutation(request);
      await rateLimit(db, `reg:${clientIp(request)}`, 5, 60 * 60 * 1000);
      const body = await readJson(request);
      const username = textField(body, "username");
      const password = textField(body, "password");
      if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) {
        throw new ApiError(400, "Usernames are 3 to 20 characters: letters, numbers, and underscores.");
      }
      bounded(username, 3, 20, "Username");
      bounded(password, 10, 200, "Password", false);
      const existing = await one<{ id: string }>(
        db,
        "SELECT id FROM users WHERE username = ? COLLATE NOCASE",
        username,
      );
      if (existing) throw new ApiError(409, "That username is taken.");
      const hashed = await hashPassword(password);
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      await db
        .prepare(
          "INSERT INTO users (id, username, password_hash, salt, role, is_demo, created_at) VALUES (?, ?, ?, ?, 'fan', 0, ?)",
        )
        .bind(id, username, hashed.hash, hashed.salt, now)
        .run();
      const user = await one<UserRow>(db, "SELECT id, username, role, is_demo FROM users WHERE id = ?", id);
      if (!user) throw new ApiError(500, "The account was not saved.");
      const response = await startSession(user, request, db);
      return new Response(response.body, { status: 201, headers: response.headers });
    }

    if (path === "/api/auth/login" && method === "POST") {
      assertMutation(request);
      await rateLimit(db, `login:${clientIp(request)}`, 10, 15 * 60 * 1000);
      const body = await readJson(request);
      const username = textField(body, "username");
      const password = textField(body, "password");
      bounded(password, 1, 200, "Password", false);
      const user = await one<UserRow & { password_hash: string; salt: string }>(
        db,
        "SELECT id, username, role, is_demo, password_hash, salt FROM users WHERE username = ? COLLATE NOCASE",
        username,
      );
      const salt = user?.salt ?? bytesToCompareSalt();
      const hash = user?.password_hash ?? (await dummyPasswordHash());
      const match = await verifyPassword(password, salt, hash);
      if (!user || !match) throw new ApiError(401, "That username and password did not match.");
      return startSession(user, request, db);
    }

    if (path === "/api/auth/logout" && method === "POST") {
      assertMutation(request);
      const token = cookieValue(request, "af_session");
      if (token && /^[a-f0-9]{64}$/.test(token)) {
        await db.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await sha256Hex(token)).run();
      }
      const secure = new URL(request.url).protocol === "https:";
      return json({ ok: true }, 200, { "Set-Cookie": sessionCookie("gone", secure, 0) });
    }

    if (path === "/api/auth/me" && method === "GET") {
      const user = await currentUser(request, db);
      return json({ user: user ? publicUser(user) : null });
    }

    if (path === "/api/categories" && method === "GET") {
      const rows = await many<{
        slug: string;
        name: string;
        description: string;
        threads: number;
      }>(
        db,
        `SELECT c.slug, c.name, c.description,
                (SELECT COUNT(*) FROM threads t WHERE t.category_id = c.id AND t.hidden = 0) AS threads
         FROM categories c
         ORDER BY c.sort_order ASC`,
      );
      return json({
        categories: rows.map((row) => ({
          slug: row.slug,
          name: row.name,
          description: row.description,
          threads: Number(row.threads),
        })),
      });
    }

    const categoryThreads = path.match(/^\/api\/categories\/([a-z0-9-]{2,40})\/threads$/);
    if (categoryThreads && method === "GET") {
      const slug = categoryThreads[1];
      const category = await one<{ id: string; name: string; description: string }>(
        db,
        "SELECT id, name, description FROM categories WHERE slug = ?",
        slug,
      );
      if (!category) throw new ApiError(404, "That topic was not found.");
      const threads = await many<{
        id: string;
        title: string;
        created_at: string;
        updated_at: string;
        is_announcement: number;
        username: string;
        is_demo: number;
        reply_count: number;
      }>(
        db,
        `SELECT t.id, t.title, t.created_at, t.updated_at, t.is_announcement, u.username, u.is_demo,
                (SELECT COUNT(*) FROM replies r WHERE r.thread_id = t.id AND r.hidden = 0) AS reply_count
         FROM threads t JOIN users u ON u.id = t.user_id
         WHERE t.category_id = ? AND t.hidden = 0
         ORDER BY t.updated_at DESC
         LIMIT 50`,
        category.id,
      );
      return json({
        category: { slug, name: category.name, description: category.description },
        threads: threads.map((thread) => ({
          id: thread.id,
          title: thread.title,
          createdAt: thread.created_at,
          updatedAt: thread.updated_at,
          announcement: thread.is_announcement === 1,
          replyCount: Number(thread.reply_count),
          author: author(thread),
        })),
      });
    }

    if (categoryThreads && method === "POST") {
      assertMutation(request);
      const user = await requireUser(request, db);
      await rateLimit(db, `post:${user.id}`, 20, 10 * 60 * 1000);
      const slug = categoryThreads[1];
      const category = await one<{ id: string }>(db, "SELECT id FROM categories WHERE slug = ?", slug);
      if (!category) throw new ApiError(404, "That topic was not found.");
      const body = await readJson(request);
      const title = bounded(textField(body, "title"), 4, 140, "Title");
      const text = bounded(textField(body, "body"), 8, 4000, "Post");
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      await db
        .prepare(
          `INSERT INTO threads (id, category_id, user_id, title, body, is_announcement, hidden, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, 0, 0, ?, ?)`,
        )
        .bind(id, category.id, user.id, title, text, now, now)
        .run();
      return json({ id }, 201);
    }

    const threadPath = path.match(/^\/api\/threads\/([A-Za-z0-9_-]{8,80})$/);
    if (threadPath && method === "GET") {
      const thread = await getPublicThread(db, threadPath[1]);
      if (!thread) throw new ApiError(404, "That thread was not found.");
      return json({ thread });
    }

    const replyPath = path.match(/^\/api\/threads\/([A-Za-z0-9_-]{8,80})\/replies$/);
    if (replyPath && method === "POST") {
      assertMutation(request);
      const user = await requireUser(request, db);
      await rateLimit(db, `post:${user.id}`, 20, 10 * 60 * 1000);
      const thread = await getThreadRecord(db, replyPath[1], false);
      if (!thread) throw new ApiError(404, "That thread was not found.");
      const body = await readJson(request);
      const text = bounded(textField(body, "body"), 1, 4000, "Reply");
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      await db
        .prepare("INSERT INTO replies (id, thread_id, user_id, body, hidden, created_at) VALUES (?, ?, ?, ?, 0, ?)")
        .bind(id, thread.id, user.id, text, now)
        .run();
      await db.prepare("UPDATE threads SET updated_at = ? WHERE id = ?").bind(now, thread.id).run();
      return json({ id }, 201);
    }

    if (path === "/api/gear" && method === "GET") {
      const rows = await many<{
        id: string;
        title: string;
        price: string;
        external_url: string;
        photo_url: string;
        description: string;
        created_at: string;
        username: string;
        is_demo: number;
      }>(
        db,
        `SELECT g.id, g.title, g.price, g.external_url, g.photo_url, g.description, g.created_at,
                u.username, u.is_demo
         FROM gear_listings g JOIN users u ON u.id = g.user_id
         WHERE g.hidden = 0
         ORDER BY g.created_at DESC
         LIMIT 60`,
      );
      return json({
        listings: rows.map((row) => ({
          id: row.id,
          title: row.title,
          price: row.price,
          externalUrl: row.external_url,
          photoUrl: row.photo_url,
          description: row.description,
          createdAt: row.created_at,
          author: author(row),
        })),
      });
    }

    if (path === "/api/gear" && method === "POST") {
      assertMutation(request);
      const user = await requireUser(request, db);
      await rateLimit(db, `post:${user.id}`, 20, 10 * 60 * 1000);
      const body = await readJson(request);
      if (body.noLicensedMarks !== true) {
        throw new ApiError(
          400,
          "Confirm that the item contains no MLB or Athletics logos, trademarks, or licensed designs.",
        );
      }
      const title = bounded(textField(body, "title"), 4, 80, "Title");
      const price = bounded(textField(body, "price"), 1, 24, "Price");
      const description = bounded(textField(body, "description"), 10, 500, "Description");
      const externalUrl = httpsUrl(textField(body, "externalUrl"), "Link");
      const photoUrl = photoRef(textField(body, "photoUrl"));
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      await db
        .prepare(
          `INSERT INTO gear_listings
             (id, user_id, title, price, external_url, photo_url, description, no_licensed_marks, hidden, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, ?)`,
        )
        .bind(id, user.id, title, price, externalUrl, photoUrl, description, now)
        .run();
      return json({ id }, 201);
    }

    if (path === "/api/polls" && method === "GET") {
      const user = await currentUser(request, db);
      const polls = await many<{ id: string }>(
        db,
        "SELECT id FROM polls WHERE hidden = 0 ORDER BY created_at DESC LIMIT 40",
      );
      const payloads = [];
      for (const poll of polls) {
        const payload = await pollPayload(db, poll.id, user?.id ?? null);
        if (payload) payloads.push(payload);
      }
      return json({ polls: payloads });
    }

    if (path === "/api/polls" && method === "POST") {
      assertMutation(request);
      const user = await requireUser(request, db);
      await rateLimit(db, `post:${user.id}`, 20, 10 * 60 * 1000);
      const body = await readJson(request);
      const question = bounded(textField(body, "question"), 8, 140, "Question");
      if (!Array.isArray(body.options)) throw new ApiError(400, "Add at least two choices.");
      const options = body.options.map((option) => (typeof option === "string" ? option.trim() : ""));
      if (options.length < 2 || options.length > 6) throw new ApiError(400, "Use two to six choices.");
      const clean = options.map((option) => bounded(option, 1, 80, "Choice"));
      if (new Set(clean.map((option) => option.toLowerCase())).size !== clean.length) {
        throw new ApiError(400, "Choices should be different from each other.");
      }
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      const statements = [
        db
          .prepare("INSERT INTO polls (id, user_id, question, hidden, created_at) VALUES (?, ?, ?, 0, ?)")
          .bind(id, user.id, question, now),
        ...clean.map((label, index) =>
          db
            .prepare("INSERT INTO poll_options (id, poll_id, label, sort_order) VALUES (?, ?, ?, ?)")
            .bind(crypto.randomUUID(), id, label, index),
        ),
      ];
      await db.batch(statements);
      return json({ id }, 201);
    }

    const votePath = path.match(/^\/api\/polls\/([A-Za-z0-9_-]{8,80})\/vote$/);
    if (votePath && method === "POST") {
      assertMutation(request);
      const user = await requireUser(request, db);
      await rateLimit(db, `post:${user.id}`, 30, 10 * 60 * 1000);
      const body = await readJson(request);
      const optionId = textField(body, "optionId");
      if (!isId(optionId)) throw new ApiError(400, "Pick a choice.");
      const poll = await one<{ id: string }>(db, "SELECT id FROM polls WHERE id = ? AND hidden = 0", votePath[1]);
      if (!poll) throw new ApiError(404, "That poll was not found.");
      const option = await one<{ id: string }>(
        db,
        "SELECT id FROM poll_options WHERE id = ? AND poll_id = ?",
        optionId,
        poll.id,
      );
      if (!option) throw new ApiError(400, "That choice is not on this poll.");
      try {
        await db
          .prepare("INSERT INTO poll_votes (poll_id, user_id, option_id, created_at) VALUES (?, ?, ?, ?)")
          .bind(poll.id, user.id, optionId, new Date().toISOString())
          .run();
      } catch (error) {
        if (error instanceof Error && /UNIQUE/i.test(error.message)) {
          throw new ApiError(409, "You already voted in this poll.");
        }
        throw error;
      }
      const payload = await pollPayload(db, poll.id, user.id);
      return json({ poll: payload });
    }

    if (path === "/api/shoutouts" && method === "GET") {
      const rows = await many<{
        id: string;
        kind: string;
        subject: string;
        body: string;
        created_at: string;
        username: string;
        is_demo: number;
      }>(
        db,
        `SELECT s.id, s.kind, s.subject, s.body, s.created_at, u.username, u.is_demo
         FROM shoutouts s JOIN users u ON u.id = s.user_id
         WHERE s.hidden = 0
         ORDER BY s.created_at DESC
         LIMIT 60`,
      );
      return json({
        shoutouts: rows.map((row) => ({
          id: row.id,
          kind: row.kind,
          subject: row.subject,
          body: row.body,
          createdAt: row.created_at,
          author: author(row),
        })),
      });
    }

    if (path === "/api/shoutouts" && method === "POST") {
      assertMutation(request);
      const user = await requireUser(request, db);
      await rateLimit(db, `post:${user.id}`, 20, 10 * 60 * 1000);
      const body = await readJson(request);
      const kind = textField(body, "kind");
      if (kind !== "callout" && kind !== "praise") throw new ApiError(400, "Choose callout or praise.");
      const subject = bounded(textField(body, "subject"), 2, 80, "Subject");
      const text = bounded(textField(body, "body"), 8, 1000, "Note");
      const id = crypto.randomUUID();
      await db
        .prepare(
          "INSERT INTO shoutouts (id, user_id, kind, subject, body, hidden, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)",
        )
        .bind(id, user.id, kind, subject, text, new Date().toISOString())
        .run();
      return json({ id }, 201);
    }

    if (path === "/api/reports" && method === "POST") {
      assertMutation(request);
      const user = await requireUser(request, db);
      await rateLimit(db, `report:${user.id}`, 10, 60 * 60 * 1000);
      const body = await readJson(request);
      const targetType = textField(body, "targetType");
      const targetId = textField(body, "targetId");
      const reason = bounded(textField(body, "reason"), 8, 500, "Reason", false);
      if (!["thread", "reply", "shoutout", "gear", "poll"].includes(targetType) || !isId(targetId)) {
        throw new ApiError(400, "That report target was not understood.");
      }
      if (!(await targetVisible(db, targetType, targetId))) throw new ApiError(404, "That post is not available.");
      const id = crypto.randomUUID();
      await db
        .prepare(
          "INSERT INTO reports (id, reporter_id, target_type, target_id, reason, status, created_at) VALUES (?, ?, ?, ?, ?, 'open', ?)",
        )
        .bind(id, user.id, targetType, targetId, reason, new Date().toISOString())
        .run();
      return json({ id }, 201);
    }

    if (path === "/api/moderation/reports" && method === "GET") {
      const user = await requireUser(request, db);
      if (user.role !== "admin") throw new ApiError(403, "Moderators only.");
      const reports = await many<{
        id: string;
        target_type: string;
        target_id: string;
        reason: string;
        status: string;
        created_at: string;
        username: string;
      }>(
        db,
        `SELECT r.id, r.target_type, r.target_id, r.reason, r.status, r.created_at, u.username
         FROM reports r JOIN users u ON u.id = r.reporter_id
         ORDER BY r.created_at DESC
         LIMIT 100`,
      );
      return json({
        reports: reports.map((report) => ({
          id: report.id,
          targetType: report.target_type,
          targetId: report.target_id,
          reason: report.reason,
          status: report.status,
          createdAt: report.created_at,
          reporter: report.username,
        })),
      });
    }

    if (path === "/api/moderation/hide" && method === "POST") {
      assertMutation(request);
      const user = await requireUser(request, db);
      if (user.role !== "admin") throw new ApiError(403, "Moderators only.");
      const body = await readJson(request);
      const targetType = textField(body, "targetType");
      const targetId = textField(body, "targetId");
      if (!isId(targetId) || !(await hideTarget(db, targetType, targetId))) {
        throw new ApiError(404, "Nothing to hide.");
      }
      return json({ ok: true });
    }

    const resolvePath = path.match(/^\/api\/moderation\/reports\/([A-Za-z0-9_-]{8,80})\/resolve$/);
    if (resolvePath && method === "POST") {
      assertMutation(request);
      const user = await requireUser(request, db);
      if (user.role !== "admin") throw new ApiError(403, "Moderators only.");
      const result = await db
        .prepare("UPDATE reports SET status = 'resolved' WHERE id = ?")
        .bind(resolvePath[1])
        .run();
      if ((result.meta?.changes ?? 0) < 1) throw new ApiError(404, "That report was not found.");
      return json({ ok: true });
    }

    const deletePath = path.match(/^\/api\/moderation\/(thread|reply|shoutout|gear|poll)\/([A-Za-z0-9_-]{8,80})$/);
    if (deletePath && method === "DELETE") {
      assertMutation(request);
      const user = await requireUser(request, db);
      if (user.role !== "admin") throw new ApiError(403, "Moderators only.");
      const removed = await deleteTarget(db, deletePath[1], deletePath[2]);
      if (!removed) throw new ApiError(404, "Nothing to delete.");
      return json({ ok: true });
    }

    return json({ error: "Not found." }, 404);
  } catch (error) {
    if (error instanceof ApiError) return json({ error: error.message }, error.status);
    console.error(
      JSON.stringify({
        message: "api failure",
        path,
        method,
        error: error instanceof Error ? error.message : "unknown",
      }),
    );
    return json({ error: "Something went wrong." }, 500);
  }
}

function bytesToCompareSalt(): string {
  let binary = "";
  for (const byte of getDummySalt()) binary += String.fromCharCode(byte);
  return btoa(binary);
}

let dummyHashPromise: Promise<string> | null = null;
function dummyPasswordHash(): Promise<string> {
  if (!dummyHashPromise) {
    dummyHashPromise = hashPassword("not-a-login", getDummySalt()).then((result) => result.hash);
  }
  return dummyHashPromise;
}
