import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import worker from "./index";

const assets = vi.fn(async (_req: Request) => new Response("desktop"));
const env = { ASSETS: { fetch: assets } } as unknown as Env;
const get = (url: string, init?: RequestInit) => worker.fetch(new Request(url, init) as never, env);

afterEach(() => {
  vi.unstubAllGlobals();
  assets.mockClear();
});

describe("addresses", () => {
  test("the others redirect to jona.no, path and query kept", async () => {
    for (const from of [
      "https://www.jona.no",
      "https://jonas-jensen.com",
      "http://www.jonas-jensen.com",
    ]) {
      const res = await get(`${from}/docs/x?y=1`);
      expect([res.status, res.headers.get("location")]).toEqual([
        301,
        "https://jona.no/docs/x?y=1",
      ]);
    }
  });

  test("jona.no itself is the desktop", async () => {
    expect(await (await get("https://jona.no/floor-planner")).text()).toBe("desktop");
  });
});

describe("embedded apps", () => {
  test("are fetched from their deploy", async () => {
    const upstream = vi.fn(async (_url: string, _init: RequestInit) => new Response("app"));
    vi.stubGlobal("fetch", upstream);
    await get("https://jona.no/apps/floor-planner/assets/a.js?v=2");
    expect(upstream.mock.calls[0][0]).toBe(
      "https://j0nas.github.io/floor-boards-planner/assets/a.js?v=2",
    );
  });

  test("an app that moved to its own address is redirected there, path kept", async () => {
    const upstream = vi.fn();
    vi.stubGlobal("fetch", upstream);
    for (const [from, to] of [
      ["https://jona.no/apps/edh-land/", "https://edh.land/"],
      ["https://jona.no/apps/edh-land", "https://edh.land/"],
      ["https://jona.no/apps/edh-land/privacy/?x=1", "https://edh.land/privacy/?x=1"],
    ]) {
      const res = await get(from);
      expect([res.status, res.headers.get("location")]).toEqual([301, to]);
    }
    expect(upstream).not.toHaveBeenCalled();
  });

  test("an app that left with no new home redirects to the home page, whatever the path", async () => {
    const upstream = vi.fn();
    vi.stubGlobal("fetch", upstream);
    for (const from of [
      "https://jona.no/apps/deck-box/",
      "https://jona.no/apps/deck-box",
      "https://jona.no/apps/deck-box/assets/x.js?v=2",
      "https://jona.no/apps/laser-deck-box/",
      "https://jona.no/apps/laser-deck-box/some/deep/path/",
      "https://jona.no/apps/lamp-shade/",
      "https://jona.no/apps/lamp-shade",
      "https://jona.no/apps/lamp-shade/assets/index.js",
    ]) {
      const res = await get(from);
      expect([res.status, res.headers.get("location")]).toEqual([301, "https://jona.no/"]);
    }
    expect(upstream).not.toHaveBeenCalled();
  });

  test("a redirect within the deploy stays under /apps/<id>/", async () => {
    vi.stubGlobal(
      "fetch",
      async () =>
        new Response(null, {
          status: 301,
          headers: { location: "https://j0nas.github.io/floor-boards-planner/docs/" },
        }),
    );
    const res = await get("https://jona.no/apps/floor-planner/docs");
    expect(res.headers.get("location")).toBe("/apps/floor-planner/docs/");
  });

  test("the bare path gets its slash; an unknown app is the desktop's", async () => {
    const res = await get("https://jona.no/apps/floor-planner?x=1");
    expect(res.headers.get("location")).toBe("https://jona.no/apps/floor-planner/?x=1");
    expect(await (await get("https://jona.no/apps/nope/")).text()).toBe("desktop");
  });
});
