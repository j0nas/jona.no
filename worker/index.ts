import { APPS, type EmbeddedApp, MOVED } from "./apps";
import { PAGES, privatePage } from "./private";

// The site's Worker. Cloudflare serves the built desktop (dist/) as static assets, unknown
// paths getting index.html so the desktop's own routes work; every request comes here first
// (run_worker_first) so that:
// - the other addresses (www, and the old jonas-jensen.com) 301 to jona.no, path kept;
// - /<slug>/* of a private page (worker/private.ts) is served from R2 behind its password;
// - /apps/<id>/* is the embedded app's live deploy, fetched and passed back same-origin;
//   an app that moved to its own address (MOVED) redirects there, path kept, and one that
//   left with no new home redirects to the home page.

const CANONICAL = "jona.no";
const ALIASES = new Set(["www.jona.no", "jonas-jensen.com", "www.jonas-jensen.com"]);

export default {
  async fetch(req, env): Promise<Response> {
    const url = new URL(req.url);
    // (http:// is the zone's Always Use HTTPS, before the Worker.)
    if (ALIASES.has(url.hostname)) {
      return Response.redirect(`https://${CANONICAL}${url.pathname}${url.search}`, 301);
    }
    const p = /^\/([^/]+)(\/.*)?$/.exec(url.pathname);
    if (p && Object.hasOwn(PAGES, p[1])) return privatePage(req, env, p[1], PAGES[p[1]], p[2]);
    const m = /^\/apps\/([^/]+)(\/.*)?$/.exec(url.pathname);
    if (m && Object.hasOwn(MOVED, m[1])) {
      const to = MOVED[m[1]];
      if (to === null) return Response.redirect(`${url.origin}/`, 301);
      return Response.redirect(`${to}${m[2] ?? "/"}${url.search}`, 301);
    }
    const app = m && Object.hasOwn(APPS, m[1]) ? APPS[m[1]] : undefined;
    if (m && app) {
      // The app's relative URLs need the trailing slash.
      if (!m[2]) return Response.redirect(`${url.origin}/apps/${m[1]}/${url.search}`, 301);
      return proxy(req, m[1], app, m[2] + url.search);
    }
    return env.ASSETS.fetch(req);
  },
} satisfies ExportedHandler<Env>;

async function proxy(req: Request, id: string, app: EmbeddedApp, rest: string) {
  const res = await fetch(app.deploy + rest, {
    method: req.method,
    headers: req.headers,
    body: req.body,
    redirect: "manual",
  });
  // A redirect within the deploy (GitHub Pages adding a slash) stays under /apps/<id>/.
  const location = res.headers.get("location");
  if (!location?.startsWith(app.deploy + "/")) return res;
  const out = new Response(res.body, res);
  out.headers.set("location", `/apps/${id}${location.slice(app.deploy.length)}`);
  return out;
}
