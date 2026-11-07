import { ACTION, EMAIL, gatePage } from "./humanGate";
import { digest, NOINDEX, readCookie, redirect, same, text } from "./private";

/**
 * /cv/tldr: the short version of the CV, for people whose language model read the long one. The
 * note hidden in the CV's downloads (src/apps/word/downloads/easterEgg.ts) points here and says the
 * model can't open it. The page's HTML is in the PRIVATE bucket at KEY, never in this public repo,
 * and the Worker hands it over once Turnstile has passed, which it remembers in a signed cookie for
 * a day. Everyone else gets the gate (humanGate.ts). Every response here says noindex.
 */
const KEY = "cv-tldr/index.html";
const COOKIE = "cv-tldr";
const DAY = 86_400;
const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
/** The longest token Turnstile issues. */
const MAX_TOKEN = 2048;
const HOSTNAME = "jona.no";
/** Accepted only when the Worker itself runs there: Cloudflare says to refuse it in production. */
const LOCAL_HOSTNAME = "localhost";
/**
 * Cloudflare's always-passes test secret, for local testing (.dev.vars). Its answers always say
 * example.com and no action, so those two checks can't run against it. They'd add nothing: it
 * accepts any token, and being public it could sign any cookie.
 */
const TEST_SECRET = "1x0000000000000000000000000000000AA";

export async function humanPage(req: Request, env: Env): Promise<Response> {
  const secret = env.TURNSTILE_SECRET;
  // Unset, the cookie would be signed with nothing and no token could be checked.
  if (!secret) return text(503, `Something went wrong. Email ${EMAIL} and he'll send it to you.`);

  if (req.method === "POST") {
    if (!(await passedTurnstile(req, secret))) {
      return gate(
        env,
        403,
        `That didn't pass. Try again, or email ${EMAIL} and he'll send it to you.`,
      );
    }
    const expires = String(Date.now() + DAY * 1000);
    const res = redirect(303, new URL(req.url).pathname);
    res.headers.set(
      "set-cookie",
      `${COOKIE}=${expires}.${await sign(expires, secret)}; Path=/cv/tldr; Max-Age=${DAY}; HttpOnly; Secure; SameSite=Lax`,
    );
    return res;
  }
  if (req.method !== "GET" && req.method !== "HEAD") return text(405, "Method not allowed.");
  if (!(await holdsCookie(req, secret))) return gate(env, 200);

  const obj = await env.PRIVATE.get(KEY);
  if (!obj) return text(404, "Not found.");
  const headers = new Headers({ "content-type": "text/html; charset=utf-8" });
  obj.writeHttpMetadata(headers);
  headers.set("x-robots-tag", NOINDEX);
  headers.set("cache-control", "private, no-store");
  return new Response(obj.body, { headers });
}

/** https://developers.cloudflare.com/turnstile/spin/ */
async function passedTurnstile(req: Request, secret: string) {
  const form = await req.formData().catch(() => null);
  const token = form?.get("cf-turnstile-response");
  if (typeof token !== "string" || !token || token.length > MAX_TOKEN) return false;
  const body = new URLSearchParams({ secret, response: token });
  const ip = req.headers.get("cf-connecting-ip");
  if (ip) body.set("remoteip", ip);
  try {
    const res = await fetch(SITEVERIFY, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return false;
    const answer = await res.json<{ success?: boolean; action?: string; hostname?: string }>();
    if (answer.success !== true) return false;
    if (secret === TEST_SECRET) return true;
    const local = new URL(req.url).hostname === LOCAL_HOSTNAME;
    const hostnameOk =
      answer.hostname === HOSTNAME || (local && answer.hostname === LOCAL_HOSTNAME);
    return answer.action === ACTION && hostnameOk;
  } catch {
    return false;
  }
}

async function holdsCookie(req: Request, secret: string) {
  const [expires, signature] = (readCookie(req, COOKIE) ?? "").split(".");
  return Number(expires) > Date.now() && same(signature, await sign(expires, secret));
}

function sign(expires: string, secret: string) {
  return digest(`${COOKIE}\n${expires}\n${secret}`);
}

function gate(env: Env, status: number, message?: string) {
  const nonce = crypto.randomUUID();
  return new Response(gatePage(env.TURNSTILE_SITE_KEY, nonce, message), {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": NOINDEX,
      "content-security-policy": [
        "default-src 'none'",
        `script-src 'nonce-${nonce}' https://challenges.cloudflare.com`,
        "frame-src https://challenges.cloudflare.com",
        "connect-src https://challenges.cloudflare.com",
        "style-src 'unsafe-inline'",
        "img-src 'self'",
        "font-src 'self'",
        "form-action 'self'",
        "base-uri 'none'",
        "frame-ancestors 'none'",
      ].join("; "),
    },
  });
}
