import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import type { D1Database } from "@cloudflare/workers-types";

type Statement = {
  bind: (...params: Array<string | number>) => Statement;
  first: <T>() => Promise<T | null>;
  all: <T>() => Promise<{ results: T[] }>;
  run: () => Promise<{ success: true; meta: { changes: number } }>;
};

export function createTestDb(): { db: D1Database; raw: DatabaseSync } {
  const raw = new DatabaseSync(":memory:");
  raw.exec("PRAGMA foreign_keys = ON");
  raw.exec(readFileSync("migrations/0001_schema.sql", "utf8"));
  raw.exec(readFileSync("migrations/0002_categories.sql", "utf8"));

  const db = {
    prepare(sql: string) {
      const make = (params: Array<string | number>): Statement => ({
        bind(...next: Array<string | number>) {
          return make(next);
        },
        async first<T>() {
          const row = raw.prepare(sql).get(...params) as T | undefined;
          return row ?? null;
        },
        async all<T>() {
          const rows = raw.prepare(sql).all(...params) as T[];
          return { results: rows };
        },
        async run() {
          const info = raw.prepare(sql).run(...params);
          return { success: true as const, meta: { changes: Number(info.changes) } };
        },
      });
      return make([]);
    },
    async batch(statements: Statement[]) {
      const results = [];
      for (const statement of statements) results.push(await statement.run());
      return results;
    },
  };
  return { db: db as unknown as D1Database, raw };
}
