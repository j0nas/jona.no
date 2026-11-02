/**
 * Direct edits to a private page by whoever signed in with its review password (worker/private.ts):
 * text changed in place, paragraphs, list items and photos added or removed, photos replaced.
 *
 * The page's HTML marks what can be edited with data-edit="<id>" and data-edit-kind: "text"
 * (edit it), "p" and "li" (edit, add another below, remove), "shot" (a photo's figure: replace,
 * add another after, remove) or "fixed" (replace the photo only). A photo's figure holds its
 * media as "<id>/photo" and its caption text as "<id>/cap". The edits are a log in the bucket at
 * "_edits/<slug>.json", applied to the page for every visitor as it's served, until whoever makes
 * the page folds them into its source and marks them "folded". The editor uploads photos already
 * resized and stripped of metadata, into the page's folder as img/u-<id>-s.jpg and -l.jpg.
 *
 * - GET   /<slug>/_edits             the log
 * - POST  /<slug>/_edits             one edit; answers with it and the HTML it puts on the page
 * - PATCH /<slug>/_edits/<id>        { status }: "live", "undone" or "folded"
 * - PUT   /<slug>/_edits/img/<file>  a photo: u-<id>-s.jpg (fits 900 px) or u-<id>-l.jpg (2000 px)
 */

export interface Photo {
  /** "u-<id>": served as img/<name>-s.jpg and img/<name>-l.jpg. */
  name: string;
  /** The small version's size, and the large one's width. */
  w: number;
  h: number;
  wl: number;
}

export type Block =
  | { type: "p" | "li"; text: string }
  | { type: "shot"; photo: Photo; caption: string };

type Change =
  | { kind: "text"; target: string; text: string }
  | { kind: "photo"; target: string; photo: Photo }
  | { kind: "remove"; target: string }
  | { kind: "insert"; after: string; block: Block };

export type Edit = Change & {
  id: string;
  at: number;
  status: Status;
  /** What was there before, for whoever folds the edit in. */
  before?: string;
};

type Status = "live" | "undone" | "folded";
const STATUSES: readonly string[] = ["live", "undone", "folded"] satisfies Status[];

const TARGET = /^[a-z0-9][a-z0-9/._-]{0,99}$/;
const PHOTO_NAME = /^u-[a-z0-9]{6,40}$/;
const UPLOAD = /^(u-[a-z0-9]{6,40})-([sl])\.jpg$/;
const MAX_TEXT = 2000;
const MAX_PHOTO = 6_000_000;
/** Sizes for a photo that replaces or joins a row: the widest a row's photo is drawn. */
const SIZES = "(max-width: 639px) 100vw, 50vw";

const logKey = (slug: string) => `_edits/${slug}.json`;

export async function edits(
  req: Request,
  bucket: R2Bucket,
  slug: string,
  rest: string,
): Promise<Response> {
  const upload = /^\/img\/(.+)$/.exec(rest);
  if (upload) {
    if (req.method !== "PUT") return json(405, { error: "method" });
    return savePhoto(req, bucket, slug, upload[1]);
  }
  if (rest === "") {
    if (req.method === "GET") return json(200, (await load(bucket, slug)).edits);
    if (req.method !== "POST") return json(405, { error: "method" });
    const raw = parse(await req.text());
    const change = parseChange(raw);
    if (!change) return json(400, { error: "bad_edit" });
    const edit = {
      ...change,
      id: Date.now().toString(36) + crypto.randomUUID().slice(0, 6),
      at: Date.now(),
      status: "live",
      before: typeof raw?.before === "string" ? raw.before.slice(0, MAX_TEXT) : undefined,
    } as Edit;
    await update(bucket, slug, (log) => [...log, edit]);
    return json(200, { edit, html: fragment(edit, raw?.media === "img" ? "img" : "button") });
  }
  const one = /^\/([a-z0-9]{1,40})$/.exec(rest);
  if (!one) return json(404, { error: "not_found" });
  if (req.method !== "PATCH") return json(405, { error: "method" });
  const status = parse(await req.text())?.status;
  if (typeof status !== "string" || !STATUSES.includes(status)) {
    return json(400, { error: "status" });
  }
  let found: Edit | undefined;
  await update(bucket, slug, (log) =>
    log.map((e) => (e.id === one[1] ? (found = { ...e, status: status as Status }) : e)),
  );
  return found ? json(200, found) : json(404, { error: "no_edit" });
}

/** The live edits, folded into what the page should show, or null when there are none. */
export async function liveEdits(bucket: R2Bucket, slug: string): Promise<State | null> {
  const { edits } = await load(bucket, slug);
  return edits.some((e) => e.status === "live") ? reduce(edits) : null;
}

export interface State {
  text: Map<string, string>;
  photo: Map<string, Photo>;
  removed: Set<string>;
  /** Blocks added after an element, nearest first. */
  after: Map<string, string[]>;
  blocks: Map<string, Block>;
}

export function reduce(log: Edit[]): State {
  const s: State = {
    text: new Map(),
    photo: new Map(),
    removed: new Set(),
    after: new Map(),
    blocks: new Map(),
  };
  for (const e of log) {
    if (e.status !== "live") continue;
    if (e.kind === "text") s.text.set(e.target, e.text);
    else if (e.kind === "photo") s.photo.set(e.target, e.photo);
    else if (e.kind === "remove") s.removed.add(e.target);
    else {
      const id = `new/${e.id}`;
      s.blocks.set(id, e.block);
      s.after.set(e.after, [id, ...(s.after.get(e.after) ?? [])]);
    }
  }
  return s;
}

/** The page with the edits applied: the rewriter visits every editable element as it streams. */
export function applyEdits(res: Response, s: State): Response {
  return new HTMLRewriter()
    .on("[data-edit]", {
      element(el) {
        const id = el.getAttribute("data-edit")!;
        const following = chain(id, s);
        if (s.removed.has(id)) return void el.replace(following, { html: true });
        if (id.endsWith("/photo")) {
          const photo = s.photo.get(id.slice(0, -"/photo".length));
          if (photo)
            el.replace(media(id, photo, el.tagName === "img" ? "img" : "button"), { html: true });
          return;
        }
        const text = s.text.get(id);
        if (text !== undefined) el.setInnerContent(text);
        const photo = s.photo.get(id);
        if (photo && el.hasAttribute("style")) el.setAttribute("style", `--r:${ratio(photo)}`);
        if (following) el.after(following, { html: true });
      },
    })
    .transform(res);
}

/** The HTML an edit puts on the page by itself, for the editor to show without a reload. */
function fragment(e: Edit, tag: "img" | "button"): string | undefined {
  if (e.kind === "photo") return media(`${e.target}/photo`, e.photo, tag);
  if (e.kind === "insert") return block(`new/${e.id}`, e.block, reduce([]));
  return undefined;
}

function chain(id: string, s: State): string {
  return (s.after.get(id) ?? [])
    .map(
      (next) => (s.removed.has(next) ? "" : block(next, s.blocks.get(next)!, s)) + chain(next, s),
    )
    .join("");
}

function block(id: string, b: Block, s: State): string {
  if (b.type !== "shot") {
    return `<${b.type} data-edit="${id}" data-edit-kind="${b.type}">${esc(s.text.get(id) ?? b.text)}</${b.type}>`;
  }
  const photo = s.photo.get(id) ?? b.photo;
  const caption = s.text.get(`${id}/cap`) ?? b.caption;
  return (
    `<figure class="shot" style="--r:${ratio(photo)}" data-edit="${id}" data-edit-kind="shot">` +
    media(`${id}/photo`, photo, "button") +
    `<figcaption><span data-edit="${id}/cap" data-edit-kind="text">${esc(caption)}</span></figcaption></figure>`
  );
}

function media(id: string, p: Photo, tag: "img" | "button"): string {
  const src = `img/${p.name}-s.jpg`;
  const img =
    `<img${tag === "img" ? ` data-edit="${id}"` : ""} src="${src}" ` +
    `srcset="${src} ${p.w}w, img/${p.name}-l.jpg ${p.wl}w" sizes="${SIZES}" ` +
    `width="${p.w}" height="${p.h}" alt=""${tag === "img" ? "" : ' loading="lazy" decoding="async"'}>`;
  if (tag === "img") return img;
  return `<button class="zoom" type="button" data-edit="${id}" data-full="img/${p.name}-l.jpg" aria-label="Vis større">${img}</button>`;
}

const ratio = (p: Photo) => (p.w / p.h).toFixed(4);

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

async function savePhoto(req: Request, bucket: R2Bucket, slug: string, file: string) {
  if (!UPLOAD.test(file)) return json(400, { error: "name" });
  const bytes = new Uint8Array(await req.arrayBuffer());
  if (bytes.length > MAX_PHOTO) return json(413, { error: "too_big" });
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff)
    return json(400, { error: "jpeg" });
  // The editor re-encodes every photo, which drops its metadata (a phone's carries where it was
  // taken). A file that still has an Exif block didn't come through that way.
  if (hasExif(bytes)) return json(400, { error: "exif" });
  await bucket.put(`${slug}/img/${file}`, bytes, { httpMetadata: { contentType: "image/jpeg" } });
  return json(200, { ok: true });
}

function hasExif(b: Uint8Array) {
  const head = b.subarray(0, 65_536);
  for (let i = 0; i < head.length - 5; i++) {
    // "Exif\0\0", the start of an APP1 Exif segment.
    if (head[i] === 0x45 && head[i + 1] === 0x78 && head[i + 2] === 0x69 && head[i + 3] === 0x66) {
      if (head[i + 4] === 0 && head[i + 5] === 0) return true;
    }
  }
  return false;
}

function parseChange(raw: Record<string, unknown> | null): Change | null {
  if (!raw) return null;
  const target = typeof raw.target === "string" && TARGET.test(raw.target) ? raw.target : null;
  switch (raw.kind) {
    case "text": {
      const text = cleanText(raw.text);
      return target && text !== null ? { kind: "text", target, text } : null;
    }
    case "photo": {
      const photo = parsePhoto(raw.photo);
      return target && photo ? { kind: "photo", target, photo } : null;
    }
    case "remove":
      return target ? { kind: "remove", target } : null;
    case "insert": {
      const after = typeof raw.after === "string" && TARGET.test(raw.after) ? raw.after : null;
      const b =
        typeof raw.block === "object" && raw.block ? (raw.block as Record<string, unknown>) : {};
      if (!after) return null;
      if (b.type === "p" || b.type === "li") {
        const text = cleanText(b.text);
        return text ? { kind: "insert", after, block: { type: b.type, text } } : null;
      }
      const photo = b.type === "shot" ? parsePhoto(b.photo) : null;
      if (!photo) return null;
      return {
        kind: "insert",
        after,
        block: { type: "shot", photo, caption: cleanText(b.caption) ?? "" },
      };
    }
  }
  return null;
}

/** Plain text on one line; the page's paragraphs, captions and list items have no breaks. */
function cleanText(v: unknown): string | null {
  return typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, MAX_TEXT) : null;
}

function parsePhoto(v: unknown): Photo | null {
  const p = typeof v === "object" && v ? (v as Record<string, unknown>) : {};
  const size = (n: unknown) => typeof n === "number" && Number.isInteger(n) && n > 0 && n <= 4000;
  if (typeof p.name !== "string" || !PHOTO_NAME.test(p.name)) return null;
  if (!size(p.w) || !size(p.h) || !size(p.wl)) return null;
  return { name: p.name, w: p.w as number, h: p.h as number, wl: p.wl as number };
}

async function load(bucket: R2Bucket, slug: string): Promise<{ edits: Edit[]; etag?: string }> {
  const obj = await bucket.get(logKey(slug));
  if (!obj) return { edits: [] };
  return { edits: (await obj.json<{ edits: Edit[] }>()).edits, etag: obj.etag };
}

/** Read, change, write back; tried again if another write came in between. */
async function update(bucket: R2Bucket, slug: string, change: (log: Edit[]) => Edit[]) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const { edits, etag } = await load(bucket, slug);
    const body = JSON.stringify({ edits: change(edits) });
    const put = await bucket.put(logKey(slug), body, {
      httpMetadata: { contentType: "application/json" },
      ...(etag ? { onlyIf: { etagMatches: etag } } : {}),
    });
    if (put) return;
  }
  throw new Error("edit log kept changing");
}

function parse(body: string): Record<string, unknown> | null {
  try {
    const v: unknown = JSON.parse(body);
    return typeof v === "object" && v !== null ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
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
