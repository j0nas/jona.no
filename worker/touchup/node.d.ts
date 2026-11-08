import { n as Options, s as touchup } from "./index-CysZA5uh.js";
import { IncomingMessage, ServerResponse } from "node:http";
type Next = (err?: unknown) => void;
export declare function middleware(options: Options): (
  req: IncomingMessage & {
    originalUrl?: string;
  },
  res: ServerResponse,
  next: Next,
) => void;
export { type Options, touchup };
