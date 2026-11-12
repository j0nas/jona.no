import { Marked, type Tokens } from "marked";
import markedFootnote from "marked-footnote";

// The documents folder: every markdown file in content/docs/ is a document.
// Adding one is adding a file — the folder listing, the Start › Documents
// entry, the viewer window and the /docs/<slug> deep link all derive from it.
// The slug is the file name; the title is the file's first `# ` heading.
// GFM footnotes ([^name] … [^name]: text) render as a "Notes" section at the
// end; ids are prefixed with the slug so two open documents never collide.

export interface Doc {
  slug: string;
  fileName: string;
  title: string;
  html: string;
}

const sources = import.meta.glob("../../content/docs/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

// Links out of a document open in a new tab; footnote refs and other in-page
// anchors keep the default so they scroll within the window.
export const linkRenderer = {
  link(
    this: { parser: { parseInline(tokens: Tokens.Link["tokens"]): string } },
    token: Tokens.Link,
  ) {
    const text = this.parser.parseInline(token.tokens);
    const title = token.title ? ` title="${token.title}"` : "";
    const external = /^https?:\/\//.test(token.href);
    const target = external ? ` target="_blank" rel="noopener"` : "";
    return `<a href="${token.href}"${title}${target}>${text}</a>`;
  },
};

/** Markdown as this site renders it: GFM, links out in a new tab, footnotes as a "Notes" section. */
export function render(slug: string, markdown: string): string {
  return new Marked({ gfm: true })
    .use({ renderer: linkRenderer })
    .use(
      markedFootnote({
        prefixId: `${slug}-note-`,
        description: "Notes",
        headingClass: "",
        footnoteDivider: true,
      }),
    )
    .parse(markdown, { async: false });
}

function titleOf(markdown: string, fallback: string): string {
  return /^#\s+(.+)$/m.exec(markdown)?.[1]?.trim() ?? fallback;
}

export const docs: Doc[] = Object.entries(sources)
  .map(([path, markdown]) => {
    const fileName = path.slice(path.lastIndexOf("/") + 1);
    const slug = fileName.replace(/\.md$/, "");
    return {
      slug,
      fileName,
      title: titleOf(markdown, slug),
      html: render(slug, markdown),
    };
  })
  .sort((a, b) => a.slug.localeCompare(b.slug));

export const docBySlug = new Map(docs.map((d) => [d.slug, d]));
