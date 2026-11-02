// A photo from the reviewer's phone or computer, made ready for the page: turned upright, drawn
// at the page's two sizes (fits 900 px and 2000 px, as the page's own photos are) and re-encoded
// as JPEG, which leaves its metadata behind (a phone's photos carry where they were taken). Then
// uploaded to /<slug>/_edits/img/ (worker/edits.ts).

import { api } from "./ui.js";

/** Opens the file picker. Call it from a tap: browsers only open it for one. */
export function pickPhoto() {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.hidden = true;
    const done = (file) => {
      input.remove();
      resolve(file);
    };
    input.addEventListener("change", () => done(input.files?.[0] ?? null), { once: true });
    input.addEventListener("cancel", () => done(null), { once: true });
    // In the page rather than detached: older Safari ignores a click on a detached input.
    document.body.append(input);
    input.click();
  });
}

/** Resizes and uploads a photo; resolves to { name, w, h, wl } for an edit. */
export async function uploadPhoto(file) {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const name = `u-${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
  const [s, l] = await Promise.all([jpeg(bitmap, 900), jpeg(bitmap, 2000)]);
  bitmap.close();
  for (const [size, { blob }] of [
    ["s", s],
    ["l", l],
  ]) {
    const res = await fetch(api(`_edits/img/${name}-${size}.jpg`), {
      method: "PUT",
      headers: { "content-type": "image/jpeg" },
      body: blob,
    });
    if (!res.ok) throw new Error(`upload ${res.status}`);
  }
  return { name, w: s.w, h: s.h, wl: l.w };
}

async function jpeg(bitmap, edge) {
  const scale = Math.min(1, edge / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, w, h);
  const encoded = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode"))), "image/jpeg", 0.82),
  );
  const bytes = withoutExif(new Uint8Array(await encoded.arrayBuffer()));
  return { blob: new Blob([bytes], { type: "image/jpeg" }), w, h };
}

const EXIF = [0x45, 0x78, 0x69, 0x66, 0, 0]; // "Exif\0\0"

// Safari's encoder writes a small Exif block (colour space and pixel size, no location) into
// every JPEG a canvas makes, and the Worker refuses any JPEG that has one, so it's cut out.
function withoutExif(b) {
  if (b[0] !== 0xff || b[1] !== 0xd8) return b;
  const keep = [b.subarray(0, 2)];
  let i = 2;
  // Segments up to the start of scan; after it comes the image data.
  while (i + 4 <= b.length && b[i] === 0xff && b[i + 1] !== 0xda) {
    const end = i + 2 + ((b[i + 2] << 8) | b[i + 3]);
    const exif = b[i + 1] === 0xe1 && EXIF.every((v, k) => b[i + 4 + k] === v);
    if (!exif) keep.push(b.subarray(i, end));
    i = end;
  }
  keep.push(b.subarray(i));
  const out = new Uint8Array(keep.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of keep) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}
