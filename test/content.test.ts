import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { articles } from "../src/content/articles";
import { categories } from "../src/content/categories";
import { mlbPlayerUrl, players } from "../src/content/players";

const news = JSON.parse(readFileSync("config/news-links.json", "utf8")) as {
  links: { id: string; url: string; verified: boolean; label: string; publisher: string }[];
};
const affiliate = JSON.parse(readFileSync("config/affiliate-links.json", "utf8")) as {
  disclosure: string;
  links: { label: string; url: string; category: string; partner?: string }[];
};

describe("content contracts", () => {
  it("keeps demo fans out of production migrations", () => {
    const migrations = readdirSync("migrations").filter((name) => name.endsWith(".sql"));
    const sql = migrations.map((name) => readFileSync(`migrations/${name}`, "utf8")).join("\n");
    expect(sql).not.toContain("coliseum_kid");
    expect(sql).not.toContain("rivercity_ana");
    expect(readFileSync("seeds/demo.sql", "utf8")).toContain("coliseum_kid");
  });

  it("seeds the same category slugs the pages use", () => {
    const sql = readFileSync("migrations/0002_categories.sql", "utf8");
    for (const category of categories) expect(sql).toContain(category.slug);
  });

  it("points news and player links at https pages and flags unverified rows", () => {
    const ids = new Set<string>();
    for (const link of news.links) {
      expect(link.url.startsWith("https://")).toBe(true);
      expect(typeof link.verified).toBe("boolean");
      expect(ids.has(link.id)).toBe(false);
      ids.add(link.id);
    }
    expect(news.links.find((link) => link.id === "bee")?.verified).toBe(false);
    for (const article of articles) {
      for (const id of article.linkIds) expect(ids.has(id)).toBe(true);
    }
    for (const category of categories) {
      for (const id of category.linkIds) expect(ids.has(id)).toBe(true);
    }
    for (const player of players) {
      expect(mlbPlayerUrl(player.mlbId)).toBe(`https://www.mlb.com/player/${player.mlbId}`);
    }
  });

  it("keeps official gear as outbound partner links with a disclosure", () => {
    expect(affiliate.disclosure.toLowerCase()).toContain("commission");
    const categoriesSeen = new Set(affiliate.links.map((link) => link.category));
    expect(categoriesSeen).toEqual(new Set(["Jerseys", "Caps", "Tees", "Collectibles"]));
    for (const link of affiliate.links) {
      expect(link.url.startsWith("https://")).toBe(true);
      expect(link.partner || "Fanatics").toBe("Fanatics");
    }
  });
});
