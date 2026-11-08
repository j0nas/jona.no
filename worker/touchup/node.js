import { i as touchup, n as isHtml, t as declaresUtf8 } from "./src-sKvr1-m-.js";
// src/node.ts
function middleware(options) {
  const edits = touchup(options);
  return (req, res, next) => {
    if (req.method !== "GET") return next();
    let url;
    try {
      url = new URL(req.originalUrl ?? req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
    } catch {
      return next();
    }
    edits.editsFor(url).then((list) => {
      if (list.length) {
        delete req.headers["if-none-match"];
        delete req.headers["if-modified-since"];
        capture(res, (html) => edits.edit(html, list));
      }
      next();
    }, next);
  };
}
/**
 * Holds back what's written to a response that turns out to be an HTML page, and sends it
 * changed by `change` when it ends. Whether it's a page is decided at the first write, from the
 * status and headers the site set by then; headers given to writeHead are set one by one, so they
 * can still be changed before anything is sent.
 */
function capture(res, change) {
  const writeHead = res.writeHead.bind(res);
  const write = res.write.bind(res);
  const end = res.end.bind(res);
  const chunks = [];
  let mode;
  const restore = () => {
    res.writeHead = writeHead;
    res.write = write;
    res.end = end;
  };
  const decide = () => {
    if (!mode) {
      mode =
        res.statusCode === 200 &&
        !res.headersSent &&
        isHtml(String(res.getHeader("content-type") ?? "")) &&
        !res.getHeader("content-encoding")
          ? "hold"
          : "pass";
      if (mode === "pass") restore();
    }
    return mode;
  };
  const bytes = (chunk, encoding) =>
    typeof chunk === "string"
      ? Buffer.from(chunk, typeof encoding === "string" ? encoding : "utf8")
      : Buffer.from(chunk);
  res.writeHead = function (status, ...args) {
    if (typeof args[0] === "string") res.statusMessage = args.shift();
    res.statusCode = status;
    const headers = args[0];
    if (Array.isArray(headers))
      for (let i = 0; i + 1 < headers.length; i += 2) res.appendHeader(headers[i], headers[i + 1]);
    else if (headers && typeof headers === "object") {
      for (const [name, value] of Object.entries(headers))
        if (value !== void 0) res.setHeader(name, value);
    }
    return res;
  };
  res.write = function (chunk, encoding, done) {
    if (decide() === "pass") return write(chunk, encoding, done);
    chunks.push(bytes(chunk, encoding));
    const cb = typeof encoding === "function" ? encoding : done;
    if (typeof cb === "function") queueMicrotask(() => cb());
    return true;
  };
  res.end = function (chunk, encoding, done) {
    if (typeof chunk === "function") [done, chunk] = [chunk, void 0];
    else if (typeof encoding === "function") [done, encoding] = [encoding, void 0];
    if (decide() === "pass") return end(chunk, encoding, done);
    if (chunk !== void 0 && chunk !== null) chunks.push(bytes(chunk, encoding));
    restore();
    const source = Buffer.concat(chunks);
    let body = source;
    if (!res.headersSent) {
      const text = source.toString("utf8");
      const out = declaresUtf8(text) ? change(text) : text;
      if (out !== text) {
        body = out;
        res.removeHeader("etag");
        res.removeHeader("last-modified");
        res.setHeader("content-length", Buffer.byteLength(out));
      }
    }
    return end(body, done);
  };
}
export { middleware, touchup };
