import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import worker from "./index";

const assets = vi.fn(async (_req: Request) => new Response("desktop"));
const files: Record<string, string> = {
  "pilestredet/index.html": "<h1>før og etter</h1>",
  "pilestredet/img/a.jpg": "0123456789",
};
const bucket = {
  get: vi.fn(async (key: string, opts?: { range?: Headers }) => {
    if (!(key in files)) return null;
    const range = opts?.range?.get("range")?.match(/^bytes=(\d+)-(\d+)$/);
    const [offset, end] = range ? [+range[1], +range[2]] : [0, files[key].length - 1];
    return {
      body: new Response(files[key].slice(offset, end + 1)).body,
      size: files[key].length,
      // As R2 returns it: every key present, the unused one undefined.
      range: { offset, length: end - offset + 1, suffix: undefined },
      httpEtag: '"e"',
      writeHttpMetadata: (h: Headers) => h.set("content-type", "text/html"),
    };
  }),
};
const env = {
  ASSETS: { fetch: assets },
  PRIVATE: bucket,
  PILESTREDET_PASSWORD: "hemmelig",
} as unknown as Env;
const get = (url: string, init?: RequestInit, e = env) =>
  worker.fetch(new Request(url, init) as never, e);

afterEach(() => {
  vi.unstubAllGlobals();
  assets.mockClear();
  bucket.get.mockClear();
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

describe("private pages", () => {
  const login = (password: string) =>
    get("https://jona.no/pilestredet/", {
      method: "POST",
      body: new URLSearchParams({ password }),
    });
  const cookieFor = async (password: string) =>
    (await login(password)).headers.get("set-cookie")!.split(";")[0];

  test("ask for the password, and never touch the bucket before it's given", async () => {
    for (const path of ["/pilestredet/", "/pilestredet/img/a.jpg"]) {
      const res = await get(`https://jona.no${path}`);
      expect(res.status).toBe(401);
      expect(await res.text()).toContain('type="password"');
      expect(res.headers.get("x-robots-tag")).toContain("noindex");
    }
    expect(bucket.get).not.toHaveBeenCalled();
  });

  test("the right password sets a cookie that opens the page; a wrong one doesn't", async () => {
    const wrong = await login("feil");
    expect([wrong.status, wrong.headers.get("set-cookie")]).toEqual([401, null]);
    expect(await wrong.text()).toContain("Feil passord");

    const right = await login("hemmelig");
    expect([right.status, right.headers.get("location")]).toEqual([303, "/pilestredet/"]);
    expect(right.headers.get("set-cookie")).toMatch(/Path=\/pilestredet;.*HttpOnly; Secure/);

    const page = await get("https://jona.no/pilestredet/", {
      headers: { cookie: `other=1; ${await cookieFor("hemmelig")}` },
    });
    expect([page.status, await page.text()]).toEqual([200, "<h1>før og etter</h1>"]);
    expect(page.headers.get("x-robots-tag")).toContain("noindex");
    expect(bucket.get.mock.calls[0][0]).toBe("pilestredet/index.html");
  });

  test("files are served from the page's folder, with byte ranges for video", async () => {
    const cookie = await cookieFor("hemmelig");
    const res = await get("https://jona.no/pilestredet/img/a.jpg", {
      headers: { cookie, range: "bytes=2-5" },
    });
    expect([res.status, res.headers.get("content-range"), await res.text()]).toEqual([
      206,
      "bytes 2-5/10",
      "2345",
    ]);
    expect(
      (await get("https://jona.no/pilestredet/nope.jpg", { headers: { cookie } })).status,
    ).toBe(404);
  });

  test("the bare path gets its slash", async () => {
    const res = await get("https://jona.no/pilestredet?x=1");
    expect([res.status, res.headers.get("location")]).toEqual([
      301,
      "https://jona.no/pilestredet/?x=1",
    ]);
  });

  test("an unset password opens nothing", async () => {
    const unset = { ...env, PILESTREDET_PASSWORD: undefined } as unknown as Env;
    for (const password of ["", "undefined"]) {
      const res = await get(
        "https://jona.no/pilestredet/",
        { method: "POST", body: new URLSearchParams({ password }) },
        unset,
      );
      expect([res.status, res.headers.get("set-cookie")]).toEqual([404, null]);
    }
  });
});
