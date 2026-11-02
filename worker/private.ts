import { applyEdits, edits, liveEdits } from "./edits";
import { feedback, ID } from "./feedback";

/**
 * Private pages: write-ups for a few people, kept out of this public repo. A page's files live in
 * the PRIVATE R2 bucket under "<slug>/" (uploaded from wherever the page is made, never committed
 * here) and are served at /<slug>/ to whoever has its password, a Worker secret. Every response
 * under /<slug> says noindex, the password form included. A page can have a second password
 * (`review`) for someone giving feedback on it, who can comment on it and edit it in place.
 */
export interface PrivatePage {
  /** The Worker secret holding the page's password (listed in wrangler.jsonc's `secrets`). */
  password: Secret;
  /**
   * A second password, for someone giving feedback on the page: it opens the same page with a
   * layer on it (public/private/review.js) for leaving notes (worker/feedback.ts) and editing the
   * page in place (worker/edits.ts). Edits show for everyone; notes only reach the page's maker.
   */
  review?: Secret;
}

type Secret = { [K in keyof Env]: Env[K] extends string ? K : never }[keyof Env];

export const PAGES: Record<string, PrivatePage> = {
  pilestredet: { password: "PILESTREDET_PASSWORD", review: "PILESTREDET_REVIEW_PASSWORD" },
};

type Role = "view" | "review";

const NOINDEX = "noindex, nofollow, noarchive";
/** `?logg-inn` shows the password form even when signed in, to switch to the other password. */
const LOGIN = "logg-inn";
const LAYER = '<script type="module" src="/private/review.js"></script>';

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
  const review = page.review && env[page.review];
  const tokens: [Role, string][] = [["view", await token(slug, "view", password)]];
  if (review) tokens.push(["review", await token(slug, "review", review)]);
  const cookie = `private-${slug}`;
  const held = readCookie(req, cookie);
  const role = tokens.find(([, t]) => same(held, t))?.[0];

  const api = /^\/_feedback(?:\/(.*))?$/.exec(rest);
  if (api) {
    // A note's id is letters, digits, _ and -, so it needs no decoding.
    const id = api[1];
    if (role !== "review" || (id !== undefined && !ID.test(id))) return text(404, "Finnes ikke.");
    return feedback(req, env.PRIVATE, slug, id);
  }
  const editing = /^\/_edits(\/.*)?$/.exec(rest);
  if (editing) {
    if (role !== "review") return text(404, "Finnes ikke.");
    return edits(req, env.PRIVATE, slug, editing[1] ?? "");
  }

  if (req.method === "POST") {
    const tried = (await req.formData()).get("password");
    let match: string | undefined;
    if (typeof tried === "string") {
      for (const [r, t] of tokens) if (same(await token(slug, r, tried), t)) match ??= t;
    }
    if (!match) return form(401, true);
    url.searchParams.delete(LOGIN);
    const res = redirect(303, `${url.pathname}${url.search}`);
    res.headers.set(
      "set-cookie",
      `${cookie}=${match}; Path=/${slug}; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax`,
    );
    return res;
  }
  if (!role) return form(401, false);
  if (url.searchParams.has(LOGIN)) return form(200, false);

  const key = slug + (rest.endsWith("/") ? `${rest}index.html` : rest);
  if (key.endsWith(".html")) {
    // A page is put together as it's served: the uploaded file, the edits made since (for
    // everyone), and the review layer (for the reviewer). So it's never cached, and the reviewer's
    // copy and a viewer's are never served in each other's place.
    const [obj, state] = await Promise.all([env.PRIVATE.get(key), liveEdits(env.PRIVATE, slug)]);
    if (!obj) return text(404, "Finnes ikke.");
    const headers = new Headers({ "x-robots-tag": NOINDEX, "cache-control": "private, no-store" });
    obj.writeHttpMetadata(headers);
    const res = new Response(role === "review" ? withLayer(await obj.text()) : obj.body, {
      headers,
    });
    return state ? applyEdits(res, state) : res;
  }
  const obj = await env.PRIVATE.get(key, { onlyIf: req.headers, range: req.headers });
  if (!obj) return text(404, "Finnes ikke.");
  const headers = new Headers({
    "x-robots-tag": NOINDEX,
    "cache-control": "private, max-age=86400",
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

/** The cookie for a role: a hash of its password, never the password itself. */
function token(slug: string, role: Role, password: string) {
  return digest(role === "view" ? `${slug}\n${password}` : `${slug}\n${role}\n${password}`);
}

function withLayer(html: string) {
  const at = html.lastIndexOf("</body>");
  return at < 0 ? html + LAYER : html.slice(0, at) + LAYER + html.slice(at);
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
