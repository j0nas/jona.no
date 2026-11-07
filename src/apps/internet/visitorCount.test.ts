import { describe, expect, test } from "vite-plus/test";
import { visitorCount } from "./visitorCount";

describe("the visitor counter", () => {
  test("starts at its base and climbs by the day", () => {
    const start = visitorCount(Date.UTC(2026, 10, 6));
    expect(visitorCount(Date.UTC(2026, 10, 6, 23))).toBe(start);
    expect(visitorCount(Date.UTC(2026, 10, 8))).toBe(start + 6);
  });

  test("never runs backwards from a wrong clock", () => {
    expect(visitorCount(0)).toBe(visitorCount(Date.UTC(2026, 10, 6)));
  });
});
