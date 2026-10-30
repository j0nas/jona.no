/**
 * Private pages: write-ups for a few people, kept out of this public repo. A page's files live in
 * the PRIVATE R2 bucket under "<slug>/" (uploaded from wherever the page is made, never committed
 * here) and are served at /<slug>/ to whoever has its password, a Worker secret. Every response
 * under /<slug> says noindex, the password form included.
 */
export interface PrivatePage {
  /** The Worker secret holding the page's password (listed in wrangler.jsonc's `secrets`). */
  password: Secret;
}

type Secret = { [K in keyof Env]: Env[K] extends string ? K : never }[keyof Env];

export const PAGES: Record<string, PrivatePage> = {
  pilestredet: { password: "PILESTREDET_PASSWORD" },
};

const NOINDEX = "noindex, nofollow, noarchive";

export async function privatePage(
  req: Request,
  env: Env,
  slug: string,
  page: PrivatePage,
  rest: string | undefined,
): Promise<Response> {
  const url = new URL(req.url);
  // The page's relative URLs need the trailing slash.
  if (!rest) return redirect(301, `${url.origin}/${slug}/${url.search}`);

  const password = env[page.password];
  // An unset secret must not make the empty password (or "undefined") a valid one.
  if (!password) return text(404, "Finnes ikke.");
  const token = await digest(`${slug}\n${password}`);
  const cookie = `private-${slug}`;

  if (req.method === "POST") {
    const tried = (await req.formData()).get("password");
    if (typeof tried !== "string" || !same(await digest(`${slug}\n${tried}`), token)) {
      return form(401, true);
    }
    const res = redirect(303, `${url.pathname}${url.search}`);
    res.headers.set(
      "set-cookie",
      `${cookie}=${token}; Path=/${slug}; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax`,
    );
    return res;
  }
  if (!same(readCookie(req, cookie), token)) return form(401, false);

  const key = slug + (rest.endsWith("/") ? `${rest}index.html` : rest);
  const obj = await env.PRIVATE.get(key, { onlyIf: req.headers, range: req.headers });
  if (!obj) return text(404, "Finnes ikke.");
  const headers = new Headers({
    "x-robots-tag": NOINDEX,
    "cache-control": key.endsWith(".html") ? "private, no-cache" : "private, max-age=86400",
    "accept-ranges": "bytes",
    etag: obj.httpEtag,
  });
  obj.writeHttpMetadata(headers);
  // No body: the client's copy is current (If-None-Match matched).
  if (!("body" in obj)) return new Response(null, { status: 304, headers });
  const range = req.headers.has("range") ? obj.range : undefined;
  if (!range) return new Response(obj.body, { headers });
  // Video seeking (Safari won't play without it). R2 may list every key, unset ones undefined.
  const suffix = "suffix" in range ? range.suffix : undefined;
  const start = suffix !== undefined ? obj.size - suffix : ("offset" in range && range.offset) || 0;
  const length = suffix ?? (("length" in range && range.length) || obj.size - start);
  headers.set("content-range", `bytes ${start}-${start + length - 1}/${obj.size}`);
  return new Response(obj.body, { status: 206, headers });
}

function form(status: number, wrong: boolean) {
  const html = `<!doctype html>
<html lang="no">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Passord</title>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f6f3ee; color: #2b2622; font: 16px/1.5 system-ui, sans-serif; }
  form { display: grid; gap: 12px; width: min(320px, 100% - 32px); }
  input, button { font: inherit; padding: 10px 12px; border-radius: 8px; border: 1px solid #cfc6bb; }
  button { background: #2b2622; color: #f6f3ee; border: 0; cursor: pointer; }
  p { margin: 0; color: #a3402c; }
</style>
<form method="post">
  <label for="password">Passord</label>
  <input id="password" name="password" type="password" autocomplete="current-password" autofocus required>
  ${wrong ? "<p>Feil passord.</p>" : ""}
  <button>Åpne</button>
</form>
</html>`;
  return new Response(html, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": NOINDEX,
    },
  });
}

function redirect(status: number, location: string) {
  return new Response(null, { status, headers: { location, "x-robots-tag": NOINDEX } });
}

function text(status: number, body: string) {
  return new Response(body, { status, headers: { "x-robots-tag": NOINDEX } });
}

function readCookie(req: Request, name: string) {
  return req.headers
    .get("cookie")
    ?.split(/;\s*/)
    .find((c) => c.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

async function digest(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Constant-time comparison, so the response time doesn't leak how much of a guess matched. */
function same(a: string | undefined, b: string) {
  if (a?.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < b.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
