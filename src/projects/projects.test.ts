import { existsSync } from "node:fs";
import { describe, expect, test } from "vite-plus/test";
import { KINDS, parse, projects } from ".";

const inPublic = (url: string) => existsSync(new URL(`../../public${url}`, import.meta.url));

describe("the projects", () => {
  test("every kind has projects, each in its own place", () => {
    for (const kind of KINDS) {
      const orders = projects.filter((p) => p.kind === kind.id).map((p) => p.order);
      expect(orders.length).toBeGreaterThan(0);
      expect(new Set(orders).size).toBe(orders.length);
    }
  });

  test("every icon and picture a project names is in public/", () => {
    for (const p of projects) {
      expect(inPublic(p.iconLarge), p.iconLarge).toBe(true);
      expect(inPublic(p.iconSmall), p.iconSmall).toBe(true);
      if (p.imageUrl) expect(inPublic(p.imageUrl), p.imageUrl).toBe(true);
      for (const [, src] of p.html.matchAll(/<img src="(\/img\/[^"]+)"/g)) {
        expect(inPublic(src), src).toBe(true);
      }
    }
  });

  test("a picture says what it shows", () => {
    for (const p of projects) {
      if (p.image) expect(p.imageAlt, p.slug).toBeTruthy();
    }
  });

  test("the facts block must be there and complete", () => {
    expect(() => parse("x", "# No block\n")).toThrow(/no --- block/);
    expect(() => parse("x", "---\ntitle: X\n---\n")).toThrow(/has no tagline/);
    const block = "title: X\ntagline: Y\nkind: games\norder: 1\nwhen: 2026\nstack: Z\nicon: x";
    expect(() => parse("x", `---\n${block}\n---\n`)).toThrow(/unknown kind/);
  });
});
