import { describe, expect, it } from "vitest";
import { handleApi } from "../src/server/app";
import { containsBlockedLanguage } from "../src/server/profanity";
import { createTestDb } from "./d1";

type ApiResult = { status: number; data: { error?: string; id?: string; user?: { username: string } | null }; cookie: string };

async function call(
  db: ReturnType<typeof createTestDb>["db"],
  path: string,
  init: { method?: string; body?: unknown; cookie?: string; ip?: string; origin?: string; header?: boolean } = {},
): Promise<ApiResult> {
  const headers = new Headers();
  const method = init.method ?? "GET";
  if (init.header !== false && method !== "GET") headers.set("X-Athletics-Fan", "1");
  if (init.body !== undefined) headers.set("content-type", "application/json");
  if (init.cookie) headers.set("cookie", init.cookie);
  if (init.ip) headers.set("CF-Connecting-IP", init.ip);
  if (init.origin) headers.set("origin", init.origin);
  const response = await handleApi(
    new Request(`https://athleticsfan.test${path}`, {
      method,
      headers,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    }),
    { DB: db },
  );
  const cookie = response.headers.get("set-cookie") ?? "";
  const data = (await response.json()) as ApiResult["data"];
  const token = cookie.match(/af_session=([^;]+)/)?.[1] ?? "";
  return { status: response.status, data, cookie: token ? `af_session=${token}` : "" };
}

async function register(db: ReturnType<typeof createTestDb>["db"], username: string, ip = "203.0.113.10") {
  return call(db, "/api/auth/register", {
    method: "POST",
    ip,
    body: { username, password: "correct-horse-1" },
  });
}

describe("language filter", () => {
  it("allows ordinary baseball talk", () => {
    expect(containsBlockedLanguage("What a classic night at the park")).toBe(false);
  });
  it("blocks spaced-out slurs", () => {
    expect(containsBlockedLanguage("f u c k this ump")).toBe(true);
  });
});

describe("api", () => {
  it("registers, reads the session, and logs out", async () => {
    const { db } = createTestDb();
    const created = await register(db, "river_fan");
    expect(created.status).toBe(201);
    expect(created.data.user?.username).toBe("river_fan");
    const me = await call(db, "/api/auth/me", { cookie: created.cookie });
    expect(me.data.user?.username).toBe("river_fan");
    const out = await call(db, "/api/auth/logout", { method: "POST", cookie: created.cookie });
    expect(out.status).toBe(200);
    const after = await call(db, "/api/auth/me", { cookie: created.cookie });
    expect(after.data.user).toBeNull();
  });

  it("rejects a duplicate username and a missing site header", async () => {
    const { db } = createTestDb();
    await register(db, "river_fan", "203.0.113.11");
    const again = await register(db, "River_Fan", "203.0.113.12");
    expect(again.status).toBe(409);
    const blocked = await call(db, "/api/auth/login", {
      method: "POST",
      header: false,
      body: { username: "river_fan", password: "correct-horse-1" },
    });
    expect(blocked.status).toBe(403);
  });

  it("rejects a cross-site origin", async () => {
    const { db } = createTestDb();
    const result = await call(db, "/api/auth/login", {
      method: "POST",
      origin: "https://evil.example",
      body: { username: "river_fan", password: "correct-horse-1" },
    });
    expect(result.status).toBe(403);
  });

  it("posts a thread and a reply, and hides them from the public list", async () => {
    const { db, raw } = createTestDb();
    const fan = await register(db, "river_fan", "203.0.113.20");
    const thread = await call(db, "/api/categories/predictions/threads", {
      method: "POST",
      cookie: fan.cookie,
      body: { title: "October will be loud", body: "I think the room is getting ahead of the schedule, in a good way." },
    });
    expect(thread.status).toBe(201);
    const reply = await call(db, `/api/threads/${thread.data.id}/replies`, {
      method: "POST",
      cookie: fan.cookie,
      body: { body: "Bring a reason, not a screenshot of someone else's stat line." },
    });
    expect(reply.status).toBe(201);
    const rude = await call(db, `/api/threads/${thread.data.id}/replies`, {
      method: "POST",
      cookie: fan.cookie,
      body: { body: "f u c k the ump" },
    });
    expect(rude.status).toBe(400);
    const admin = await register(db, "desk_editor", "203.0.113.21");
    raw.prepare("UPDATE users SET role = 'admin' WHERE username = ?").run("desk_editor");
    const hidden = await call(db, "/api/moderation/hide", {
      method: "POST",
      cookie: admin.cookie,
      body: { targetType: "thread", targetId: thread.data.id },
    });
    expect(hidden.status).toBe(200);
    const fanHide = await call(db, "/api/moderation/hide", {
      method: "POST",
      cookie: fan.cookie,
      body: { targetType: "thread", targetId: thread.data.id },
    });
    expect(fanHide.status).toBe(403);
    const list = await call(db, "/api/categories/predictions/threads");
    expect(JSON.stringify(list.data)).not.toContain("October will be loud");
  });

  it("allows one vote per user", async () => {
    const { db } = createTestDb();
    const fan = await register(db, "river_fan", "203.0.113.30");
    const other = await register(db, "other_fan", "203.0.113.31");
    const poll = await call(db, "/api/polls", {
      method: "POST",
      cookie: fan.cookie,
      body: { question: "Yankees or Dodgers in the dream series?", options: ["Yankees", "Dodgers"] },
    });
    expect(poll.status).toBe(201);
    const listed = await call(db, "/api/polls", { cookie: fan.cookie });
    const optionId = (listed.data as { polls: { options: { id: string }[] }[] }).polls[0].options[0].id;
    const vote = await call(db, `/api/polls/${poll.data.id}/vote`, {
      method: "POST",
      cookie: fan.cookie,
      body: { optionId },
    });
    expect(vote.status).toBe(200);
    const again = await call(db, `/api/polls/${poll.data.id}/vote`, {
      method: "POST",
      cookie: fan.cookie,
      body: { optionId },
    });
    expect(again.status).toBe(409);
    const second = await call(db, `/api/polls/${poll.data.id}/vote`, {
      method: "POST",
      cookie: other.cookie,
      body: { optionId },
    });
    expect(second.status).toBe(200);
  });

  it("requires the fan-gear checkbox and accepts a clean listing", async () => {
    const { db } = createTestDb();
    const fan = await register(db, "river_fan", "203.0.113.40");
    const denied = await call(db, "/api/gear", {
      method: "POST",
      cookie: fan.cookie,
      body: {
        title: "Green coasters",
        price: "$36",
        externalUrl: "https://example.com/demo/coasters",
        photoUrl: "/artwork/coaster.svg",
        description: "Glazed forest green and antique gold. No marks.",
        noLicensedMarks: false,
      },
    });
    expect(denied.status).toBe(400);
    const created = await call(db, "/api/gear", {
      method: "POST",
      cookie: fan.cookie,
      body: {
        title: "Green coasters",
        price: "$36",
        externalUrl: "https://example.com/demo/coasters",
        photoUrl: "/artwork/coaster.svg",
        description: "Glazed forest green and antique gold. No marks.",
        noLicensedMarks: true,
      },
    });
    expect(created.status).toBe(201);
    const report = await call(db, "/api/reports", {
      method: "POST",
      cookie: fan.cookie,
      body: { targetType: "gear", targetId: created.data.id, reason: "Please check this demo listing." },
    });
    expect(report.status).toBe(201);
  });

  it("rate limits registration from one address", async () => {
    const { db } = createTestDb();
    const ip = "203.0.113.50";
    for (let i = 0; i < 5; i += 1) {
      const result = await register(db, `fan_${i}_ok`, ip);
      expect(result.status).toBe(201);
    }
    const blocked = await register(db, "fan_6_no", ip);
    expect(blocked.status).toBe(429);
  });
});
