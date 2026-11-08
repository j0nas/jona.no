import { esc, touchup, type AddedPhoto, type Touchup } from "./touchup/index.js";

/**
 * Private pages: write-ups for a few people, kept out of this public repo. A page's files live in
 * the PRIVATE R2 bucket under "<slug>/" (uploaded from wherever the page is made, never committed
 * here) and are served at /<slug>/ to whoever has its password, a Worker secret. Every response
 * under /<slug> says noindex, the password form included. A page can take part in Touchup
 * (`touchup`): its HTML carries Touchup's script tag, which does something only for a reviewer
 * with an invite link, and the edits reviewers have made are applied to it as it's served.
 */
export interface PrivatePage {
  /** The Worker secret holding the page's password (listed in wrangler.jsonc's `secrets`). */
  password: Secret;
  /**
   * The page is a Touchup project with the slug as its id. `renderPhoto` is the page's own markup
   * for a photo a reviewer added, which `block()` in the page's build.py makes for the others.
   */
  touchup?: { renderPhoto: (photo: AddedPhoto) => string };
}

type Secret = { [K in keyof Env]: Env[K] extends string ? K : never }[keyof Env];

export const PAGES: Record<string, PrivatePage> = {
  pilestredet: {
    password: "PILESTREDET_PASSWORD",
    touchup: {
      renderPhoto: (p) =>
        `<figure class="shot" style="--r:${(p.photo.w / p.photo.h).toFixed(4)}" data-edit="${p.id}" data-edit-kind="shot">` +
        `<button class="zoom" type="button" data-edit="${p.id}/photo" data-full="${p.large}" aria-label="Vis større">` +
        `<img src="${p.small}" srcset="${p.small} ${p.photo.w}w, ${p.large} ${p.photo.wl}w" sizes="(max-width: 639px) 100vw, 50vw" ` +
        `width="${p.photo.w}" height="${p.photo.h}" alt="" loading="lazy" decoding="async"></button>` +
        `<figcaption><span data-edit="${p.id}/cap" data-edit-kind="text">${esc(p.caption)}</span></figcaption></figure>`,
    },
  },
};

const TOUCHUP = "https://touchup.jona.no";

const NOINDEX = "noindex, nofollow, noarchive";
/** `?logg-inn` shows the password form even when signed in, to switch to the other password. */
const LOGIN = "logg-inn";
const SCRIPT = (project: string) =>
  `<script src="${TOUCHUP}/t.js" data-project="${project}" async></script>`;

/** One per page, so that its cache of the page's edits lasts between requests. */
const instances = new Map<string, Touchup>();
function editsFor(env: Env, slug: string, page: PrivatePage) {
  if (!page.touchup) return undefined;
  const id = `${slug}\n${env.TOUCHUP_SITE_KEY}`;
  let edits = instances.get(id);
  if (!edits) {
    edits = touchup({
      api: TOUCHUP,
      project: slug,
      key: env.TOUCHUP_SITE_KEY,
      renderPhoto: page.touchup.renderPhoto,
    });
    instances.set(id, edits);
  }
  return edits;
}

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
  const expected = await token(slug, password);
  const cookie = `private-${slug}`;
  const signedIn = same(readCookie(req, cookie), expected);

  if (req.method === "POST") {
    const tried = (await req.formData()).get("password");
    if (typeof tried !== "string" || !same(await token(slug, tried), expected)) {
      return form(401, true);
    }
    url.searchParams.delete(LOGIN);
    const res = redirect(303, `${url.pathname}${url.search}`);
    res.headers.set(
      "set-cookie",
      `${cookie}=${expected}; Path=/${slug}; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax`,
    );
    return res;
  }
  if (!signedIn) return form(401, false);
  if (url.searchParams.has(LOGIN)) return form(200, false);

  const key = slug + (rest.endsWith("/") ? `${rest}index.html` : rest);
  if (key.endsWith(".html")) {
    // A page is put together as it's served: the uploaded file, Touchup's script tag and the edits
    // made since (for everyone). So it's never cached.
    const obj = await env.PRIVATE.get(key);
    if (!obj) return text(404, "Finnes ikke.");
    const headers = new Headers({ "x-robots-tag": NOINDEX, "cache-control": "private, no-store" });
    obj.writeHttpMetadata(headers);
    const edits = editsFor(env, slug, page);
    if (!edits) return new Response(obj.body, { headers });
    // The script tag is added here, so the uploaded file stays as the page's maker wrote it.
    const res = new Response(withScript(await obj.text(), slug), { headers });
    return edits.apply(req, res);
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

/** The cookie for a page: a hash of its password, never the password itself. */
function token(slug: string, password: string) {
  return digest(`${slug}\n${password}`);
}

function withScript(html: string, project: string) {
  const tag = SCRIPT(project);
  const at = html.lastIndexOf("</body>");
  return at < 0 ? html + tag : html.slice(0, at) + tag + html.slice(at);
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
