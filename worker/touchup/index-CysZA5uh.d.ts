/**
 * Where an item points. A page that marks what's editable gives an exact id (tier 1); anywhere
 * else the element is found again by its text, with a CSS path and the text's position as
 * fallbacks (tier 2). The quote and position follow the W3C Web Annotation TextQuoteSelector and
 * TextPositionSelector, over the page's text with whitespace collapsed.
 */
interface Anchor {
  /** data-edit id on a page that has them. */
  editId?: string;
  /** Structural CSS path, from the nearest element with a stable id or from body. */
  selector?: string;
  /** The element's tag, lowercase. */
  tag?: string;
  quote?: {
    exact: string;
    prefix: string;
    suffix: string;
  };
  position?: {
    start: number;
    end: number;
  };
  /** For an image: its src as written in the page. */
  src?: string;
  /**
   * The reviewer selected text: `quote` is exactly that text, which can run across elements, and
   * `selector` and `tag` are the nearest element holding all of it. Its `position` counts the
   * characters a reader sees, without whitespace.
   */
  selection?: boolean;
  /** Where the selected words were one of several places they occur on the page: which, from 1. */
  occurrence?: {
    index: number;
    count: number;
  };
  /**
   * The field ref (data-touchup-field) of the element whose whole text this is: which value in
   * which source it shows, "<sink>:<locator>" (docs/direct-edits.md). A text edit with one goes by
   * it, on every copy of the field on the page.
   */
  field?: string;
  /** The revision of its source the page says it was built from (meta touchup-revision). */
  revision?: string;
  /**
   * What the field's value is (data-touchup-kind), where the page says it isn't plain text: a
   * template with {arguments}, or markdown. Only plain values are published.
   */
  fieldKind?: FieldKind;
}
type FieldKind = "plain" | "template" | "markdown";
/** A photo uploaded from the reviewer's device, already resized and stripped of metadata. */
interface Photo {
  /** "u-<hex>": stored as <name>-s.jpg (fits 900 px) and <name>-l.jpg (fits 2000 px). */
  name: string;
  /** The small version's size, and the large one's width. */
  w: number;
  h: number;
  wl: number;
}
type Block =
  | {
      type: "p" | "li";
      text: string;
    }
  | {
      type: "shot";
      photo: Photo;
      caption: string;
    };
/** What an edit does to the element its anchor points at. */
type Change =
  | {
      kind: "text";
      text: string;
      before: string;
    }
  | {
      kind: "photo";
      photo: Photo;
      before?: string;
    }
  | {
      kind: "remove";
      before?: string;
    }
  | {
      kind: "insert";
      block: Block;
    };
/** A live edit as the page needs it to replay: no reviewer, no context. */
interface LiveEdit {
  id: string;
  /**
   * The host it was made on. Where the project keeps edits to their own host, the server sends a
   * page only its host's; a client that reads every host's edits can tell them apart by this.
   */
  host?: string;
  page: string;
  anchor: Anchor;
  change: Change;
  /**
   * Published to its source, and live until the page shows it: a reviewer's browser that finds
   * the page showing its text says so (replay.ts), and Touchup folds it.
   */
  published?: true;
  /**
   * On the oldest live edit to a field, where its `before` is the text of an older edit to the
   * field that has been dismissed since, which the source never held: the text the server traced
   * back to the source through such edits, or null where it couldn't tell (db.ts liveEdits). A
   * page served with the edits in it shows this when they go.
   */
  original?: string | null;
}
interface Where {
  /** Touchup's origin, "https://touchup.example". */
  api: string;
  project: string;
  /** The HTML of a photo added by an edit. The default is a plain figure; see figure(). */
  renderPhoto?: (photo: AddedPhoto) => string;
}
interface AddedPhoto {
  /** Its data-edit id, "new/<edit id>"; its media is "<id>/photo" and its caption "<id>/cap". */
  id: string;
  photo: Photo;
  /**
   * What the reviewer wrote, as plain text. It goes into every visitor's page, so escape it
   * (esc() does) wherever it goes into markup, as figure() does.
   */
  caption: string;
  small: string;
  large: string;
  /** The class of the figure it was added after, so it can look the same. */
  className: string | null;
}
/** A page's edits, oldest first, applied to its HTML. */
declare function editHtml(html: string, edits: LiveEdit[], where: Where): string;
/** The default markup of an added photo: a figure with the image and an editable caption. */
declare function figure(p: AddedPhoto): string;
/** An img for an uploaded photo, at the size that fits, with the large one for wide screens. */
declare function image(
  id: string,
  p: Photo,
  u: {
    small: string;
    large: string;
  },
): string;
/** Escapes text for HTML, for a site's renderPhoto: safe in text and in quoted attributes. */
declare function esc(s: string): string;
interface Options extends Where {
  /** The project's site key, made under Agent in the app. */
  key: string;
  /** How long a host's edits are kept before Touchup is asked again, in seconds. Default 5. */
  ttl?: number;
  /** How long to wait for Touchup before a page goes out without its edits, in ms. Default 1500. */
  timeout?: number;
  /**
   * The site's host as Touchup knows it ("jona.no"), for a server behind a proxy that changes the
   * Host header. By default it's the host of the URL the page was asked for.
   */
  host?: string;
  /** For tests. */
  fetch?: typeof fetch;
}
/** A page's HTML: a string, a standard stream of its bytes, or a fetch Response. */
type Html = string | ReadableStream<Uint8Array> | Response;
declare function touchup(options: Options): {
  editsFor: (url: string | URL) => Promise<LiveEdit[]>;
  edit: (html: string, edits: LiveEdit[]) => string;
  html: (url: string | URL, page: Html) => Promise<string>;
  apply: (req: Request, res: Response, edits?: LiveEdit[]) => Promise<Response>;
  handle: (req: Request, next: (req: Request) => Response | Promise<Response>) => Promise<Response>;
};
type Touchup = ReturnType<typeof touchup>;
/** A request without the headers that let a server answer 304. */
declare function unconditional(req: Request): Request;
/** HTML in UTF-8: what the parser reads. A page in another encoding goes out as it is. */
declare function isHtml(type: string | null | undefined): boolean;
/**
 * A page's bytes, and its text as UTF-8. `utf8` is false for a page that says near its start that
 * it's in another encoding: its bytes go out untouched.
 */
declare function read(page: Html): Promise<{
  text: string;
  bytes: Uint8Array;
  utf8: boolean;
}>;
/** False for a page whose meta tag, near its start, names another encoding than UTF-8. */
declare function declaresUtf8(html: string): boolean;
export {
  isHtml as a,
  unconditional as c,
  editHtml as d,
  esc as f,
  LiveEdit as h,
  declaresUtf8 as i,
  AddedPhoto as l,
  image as m,
  Options as n,
  read as o,
  figure as p,
  Touchup as r,
  touchup as s,
  Html as t,
  Where as u,
};
