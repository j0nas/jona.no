import { i as touchup } from "./src-sKvr1-m-.js";
// src/fetch.ts
/**
 * The site's fetch handler, with every HTML page it serves to a GET given its live edits. Options
 * may be a function of the handler's arguments, for keys that only arrive with a request (a
 * Worker's `env`); it's called once, on the first request.
 */
function withEdits(handler, options) {
  let edits;
  return async (req, ...rest) => {
    edits ??= touchup(typeof options === "function" ? options(req, ...rest) : options);
    return edits.handle(req, (r) => handler(r, ...rest));
  };
}
export { touchup, withEdits };
