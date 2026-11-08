import { n as Options, s as touchup } from "./index-CysZA5uh.js";
/**
 * The site's fetch handler, with every HTML page it serves to a GET given its live edits. Options
 * may be a function of the handler's arguments, for keys that only arrive with a request (a
 * Worker's `env`); it's called once, on the first request.
 */
export declare function withEdits<A extends unknown[]>(
  handler: (req: Request, ...rest: A) => Response | Promise<Response>,
  options: Options | ((req: Request, ...rest: A) => Options),
): (req: Request, ...rest: A) => Promise<Response>;
export { type Options, touchup };
