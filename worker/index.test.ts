import { afterEach, beforeEach, describe, expect, test, vi } from "vite-plus/test";
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
      text: async () => files[key],
      json: async () => JSON.parse(files[key]),
    };
  }),
  put: vi.fn(async (key: string, value: string) => {
    files[key] = value;
    return { key };
  }),
  delete: vi.fn(async (key: string) => void delete files[key]),
  list: vi.fn(async ({ prefix }: { prefix: string }) => ({
    objects: Object.keys(files)
      .filter((key) => key.startsWith(prefix))
      .map((key) => ({ key })),
    truncated: false,
  })),
};
const env = {
  ASSETS: { fetch: assets },
  PRIVATE: bucket,
  PILESTREDET_PASSWORD: "hemmelig",
  TOUCHUP_SITE_KEY: "tsk_test",
} as unknown as Env;
let live: unknown[] = [];
const touchupApi = vi.fn(async (_url: string, _init?: RequestInit) => Response.json(live));
const get = (url: string, init?: RequestInit, e = env) =>
  worker.fetch(new Request(url, init) as never, e);

beforeEach(() => {
  live = [];
  touchupApi.mockClear();
  vi.stubGlobal("fetch", touchupApi);
});

afterEach(() => {
  vi.unstubAllGlobals();
  assets.mockClear();
  bucket.get.mockClear();
  bucket.put.mockClear();
  for (const key of Object.keys(files)) {
    if (key === "pilestredet/side.html") delete files[key];
  }
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
    expect(page.status).toBe(200);
    expect(await page.text()).toContain("<h1>før og etter</h1>");
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

describe("a private page in Touchup", () => {
  const cookieFor = async (password: string, url = "https://jona.no/pilestredet/") => {
    const res = await get(url, { method: "POST", body: new URLSearchParams({ password }) });
    return res.headers.get("set-cookie")!.split(";")[0];
  };
  const SCRIPT =
    '<script src="https://touchup.jona.no/t.js" data-project="pilestredet" async></script>';
  // Each test gets its own site key, and so its own Touchup client with nothing cached.
  let n = 0;
  const withKey = () => ({ ...env, TOUCHUP_SITE_KEY: `tsk_${++n}` }) as unknown as Env;
  const edited = (cookie: string, path = "pilestredet/") =>
    get(`https://jona.no/${path}`, { headers: { cookie } }, withKey());

  test("the page carries Touchup's script tag for everyone who has the password", async () => {
    const res = await edited(await cookieFor("hemmelig"));
    expect(res.status).toBe(200);
    expect(await res.text()).toBe(`<h1>før og etter</h1>${SCRIPT}`);
    // Never cached, since its edits change.
    expect([res.headers.get("etag"), res.headers.get("cache-control")]).toEqual([
      null,
      "private, no-store",
    ]);
    // Without the password there is no page, and Touchup isn't asked about it.
    expect((await get("https://jona.no/pilestredet/")).status).toBe(401);
  });

  test("a reviewer's edits are applied for every visitor, asked for with the site key", async () => {
    files["pilestredet/side.html"] = '<p data-edit="subtitle" data-edit-kind="text">Før</p>';
    live = [
      {
        id: "e1",
        page: "/pilestredet/side.html",
        anchor: { editId: "subtitle" },
        change: { kind: "text", text: "Etter <b>", before: "Før" },
      },
    ];
    const res = await edited(await cookieFor("hemmelig"), "pilestredet/side.html");
    expect(await res.text()).toBe(
      `<p data-edit="subtitle" data-edit-kind="text">Etter &lt;b&gt;</p>${SCRIPT}`,
    );
    const [url, init] = touchupApi.mock.calls[0];
    expect(url).toBe("https://touchup.jona.no/api/p/pilestredet/edits?host=jona.no");
    expect(new Headers(init?.headers).get("authorization")).toMatch(/^Bearer tsk_\d+$/);
  });

  test("the page still opens when Touchup is down", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    touchupApi.mockRejectedValueOnce(new Error("down"));
    const res = await edited(await cookieFor("hemmelig"));
    expect(await res.text()).toBe(`<h1>før og etter</h1>${SCRIPT}`);
  });

  test("the old layer is gone: no review password, no notes or edits API", async () => {
    const wrong = await get("https://jona.no/pilestredet/", {
      method: "POST",
      body: new URLSearchParams({ password: "kommenter" }),
    });
    expect([wrong.status, wrong.headers.get("set-cookie")]).toEqual([401, null]);
    const cookie = await cookieFor("hemmelig");
    for (const path of ["_feedback", "_feedback/n1", "_edits", "_edits/img/u-abc123-s.jpg"]) {
      const res = await get(`https://jona.no/pilestredet/${path}`, {
        method: "PUT",
        body: "x",
        headers: { cookie },
      });
      expect(res.status).toBe(404);
    }
    expect(bucket.put).not.toHaveBeenCalled();
  });

  test("?logg-inn shows the form to someone signed in, and is dropped after signing in", async () => {
    const cookie = await cookieFor("hemmelig");
    const res = await get("https://jona.no/pilestredet/?logg-inn", { headers: { cookie } });
    expect([res.status, (await res.text()).includes('type="password"')]).toEqual([200, true]);

    const signedIn = await get("https://jona.no/pilestredet/?logg-inn&x=1", {
      method: "POST",
      body: new URLSearchParams({ password: "hemmelig" }),
    });
    expect(signedIn.headers.get("location")).toBe("/pilestredet/?x=1");
  });
});
