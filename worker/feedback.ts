/**
 * Notes left on a private page by whoever signed in with its review password (worker/private.ts),
 * sent by the comment layer (public/private/feedback.js) as soon as each is written. A note is a
 * JSON object in the private bucket at "_feedback/<slug>/<id>.json": outside the page's folder,
 * so it is never served as one of the page's files. Whoever makes the page reads them back with
 * the same password and marks each one done.
 *
 * - GET    /<slug>/_feedback       every note, oldest first
 * - PUT    /<slug>/_feedback/<id>  a new note, or an edit (the status and creation time are kept)
 * - PATCH  /<slug>/_feedback/<id>  { status }: "open", "resolved" or "dismissed"
 * - DELETE /<slug>/_feedback/<id>  its author taking it back; a note that's been dealt with stays
 */

export interface Note {
  id: string;
  /** "agentation" from the toolbar on a computer, "tap" from the phone's comment button. */
  source: "agentation" | "tap";
  /** Path and query of the page it was left on. */
  page: string;
  comment: string;
  element: string;
  elementPath: string;
  /** Whatever else the layer saw: nearby text, image, caption, viewport. Free-form. */
  context: Record<string, unknown>;
  status: Status;
  createdAt: number;
  updatedAt: number;
}

type Status = "open" | "resolved" | "dismissed";
const STATUSES: readonly string[] = ["open", "resolved", "dismissed"] satisfies Status[];

export const ID = /^[\w-]{1,64}$/;
const MAX_BODY = 64_000;
const CONTEXT_BUDGET = 32_000;

export async function feedback(
  req: Request,
  bucket: R2Bucket,
  slug: string,
  id: string | undefined,
): Promise<Response> {
  const prefix = `_feedback/${slug}/`;
  if (id === undefined) {
    if (req.method !== "GET") return json(405, { error: "method" });
    return json(200, await list(bucket, prefix));
  }
  const key = `${prefix}${id}.json`;
  const old = await bucket.get(key).then((o) => (o ? o.json<Note>() : null));

  if (req.method === "PUT") {
    const body = await req.text();
    if (body.length > MAX_BODY) return json(413, { error: "too_big" });
    const raw = parse(body);
    const comment = clip(raw?.comment, 4000).trim();
    if (!raw || !comment) return json(400, { error: "empty" });
    const now = Date.now();
    const note: Note = {
      id,
      source: raw.source === "tap" ? "tap" : "agentation",
      page: old?.page ?? clip(raw.page, 500),
      comment,
      element: clip(raw.element, 200),
      elementPath: clip(raw.elementPath, 500),
      context: trim(raw.context),
      status: old?.status ?? "open",
      createdAt: old?.createdAt ?? now,
      updatedAt: now,
    };
    await put(bucket, key, note);
    return json(200, note);
  }
  if (!old) return json(404, { error: "no_note" });
  if (req.method === "PATCH") {
    const status = parse(await req.text())?.status;
    if (typeof status !== "string" || !STATUSES.includes(status)) {
      return json(400, { error: "status" });
    }
    const note: Note = { ...old, status: status as Status, updatedAt: Date.now() };
    await put(bucket, key, note);
    return json(200, note);
  }
  if (req.method === "DELETE") {
    if (old.status === "open") await bucket.delete(key);
    return json(200, { ok: true });
  }
  return json(405, { error: "method" });
}

async function list(bucket: R2Bucket, prefix: string): Promise<Note[]> {
  const keys: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await bucket.list({ prefix, cursor });
    keys.push(...page.objects.map((o) => o.key));
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  const notes = await Promise.all(
    keys.map((k) => bucket.get(k).then((o) => (o ? o.json<Note>() : null))),
  );
  return notes.filter((n) => n !== null).sort((a, b) => a.createdAt - b.createdAt);
}

const put = (bucket: R2Bucket, key: string, note: Note) =>
  bucket.put(key, JSON.stringify(note), { httpMetadata: { contentType: "application/json" } });

const clip = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

function parse(body: string): Record<string, unknown> | null {
  try {
    const v: unknown = JSON.parse(body);
    return typeof v === "object" && v !== null ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Agentation's context can be large; the bulkiest optional parts go first. */
function trim(v: unknown): Record<string, unknown> {
  const context = typeof v === "object" && v !== null ? { ...(v as Record<string, unknown>) } : {};
  for (const key of ["computedStyles", "nearbyElements", "accessibility", "boundingBox"]) {
    if (JSON.stringify(context).length <= CONTEXT_BUDGET) break;
    delete context[key];
  }
  return JSON.stringify(context).length <= CONTEXT_BUDGET ? context : {};
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow, noarchive",
    },
  });
}
