import type { D1Database } from "@cloudflare/workers-types";
import { siteUrl } from "../../../src/content/site";
import { renderThreadResponse } from "../../../src/server/thread-page";

type Env = { DB: D1Database; SITE_URL?: string };

export const onRequest: PagesFunction<Env> = async (context) => {
  const raw = context.params.id;
  const id = Array.isArray(raw) ? raw[0] : raw;
  if (!id) {
    return new Response("Not found", { status: 404 });
  }
  return renderThreadResponse(context.env.DB, id, context.env.SITE_URL || siteUrl);
};
