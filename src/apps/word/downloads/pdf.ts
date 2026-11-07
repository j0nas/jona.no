import { createElement as h, type ReactNode } from "react";
import {
  Document,
  Font,
  Link,
  Page,
  renderToBuffer,
  StyleSheet,
  Text,
  View,
  type Styles,
} from "@react-pdf/renderer";
import { GAP, type Resume } from "../resumeData";
import { EASTER_EGG } from "./easterEgg";
import { buildModel, type Block, type Inline, type Item } from "./model";

// The PDF, in the manner of Resume.module.css: A4, 1" margins left and right and 0.8" top and bottom,
// Times under Arial headings (the built-in Times-Roman and Helvetica, so nothing is embedded). The
// layout is its own code, not shared with the screen or the DOCX: a design change goes in each.

Font.registerHyphenationCallback((word) => [word]);

const SANS = "Helvetica";
const SERIF = "Times-Roman";
const LINK = "#000080";
/** 0.4" up from the foot of an A4 page. From the top, since `bottom` goes wrong on a wrapping page. */
const FOOTER_TOP = 841.89 - 28.8 - 8;

const s = StyleSheet.create({
  page: {
    paddingVertical: 57.6,
    paddingHorizontal: 72,
    fontFamily: SERIF,
    fontSize: 11,
    lineHeight: 1.3,
    color: "#000000",
  },
  footer: {
    position: "absolute",
    left: 72,
    right: 72,
    top: FOOTER_TOP,
    color: "#808080",
    fontFamily: SANS,
    fontSize: 8,
    lineHeight: 1,
    textAlign: "right",
  },
  name: { fontFamily: `${SANS}-Bold`, fontSize: 24, letterSpacing: 0.5, lineHeight: 1.1 },
  label: { marginTop: 4, marginBottom: 10, fontFamily: "Times-Italic", fontSize: 13 },
  contact: {
    borderTopWidth: 1.5,
    borderTopColor: "#000000",
    paddingTop: 7,
    fontFamily: SANS,
    fontSize: 9,
    lineHeight: 1.5,
  },
  section: {
    marginBottom: 8,
    paddingBottom: 3,
    borderBottomWidth: 0.75,
    borderBottomColor: "#000000",
    fontFamily: `${SANS}-Bold`,
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  employer: { fontFamily: `${SANS}-Bold`, fontSize: 13, flexShrink: 1 },
  role: { fontFamily: "Times-BoldItalic", flexShrink: 1 },
  project: { fontFamily: `${SANS}-Bold`, flexShrink: 1 },
  rowLeft: { flex: 1 },
  // Dates, and a project's address: the same in every section.
  right: {
    flexShrink: 0,
    fontFamily: SANS,
    fontSize: 10,
    maxWidth: "55%",
    textAlign: "right",
    marginLeft: 12,
  },
  note: { fontFamily: "Times-Italic", fontSize: 10 },
  // A line height needs its font size beside it: it's a multiple of that, whatever is inherited.
  skill: { fontSize: 11, lineHeight: 16 / 11 },
  bold: { fontFamily: "Times-Bold" },
  link: { color: LINK, textDecoration: "underline" },
  bullet: { flexDirection: "row" },
  bulletMark: { width: 16, paddingLeft: 4 },
  // White and tiny, after the last visible line: for text extractors (easterEgg.ts).
  egg: { color: "#ffffff", fontSize: 1.5, lineHeight: 1, marginTop: 2 },
});

function runs(items: Inline[]): ReactNode {
  return items.map((run, i) =>
    run.href
      ? h(Link, { key: i, src: run.href, style: s.link }, run.text)
      : h(Text, { key: i, style: run.bold ? s.bold : undefined }, run.text),
  );
}

/** Something flush left and something flush right, on a shared baseline. */
function row(i: number, left: ReactNode, right: string | undefined, baseline: number, style = {}) {
  return h(
    View,
    { key: i, style: [s.row, style] },
    left,
    right ? h(Text, { style: [s.right, { marginTop: baseline }] }, right) : null,
  );
}

function heading(item: { text: string; href?: string }, style: Styles[string]): ReactNode {
  return item.href
    ? h(Link, { src: item.href, style: [style, s.link] }, item.text)
    : h(Text, { style }, item.text);
}

function renderItem(item: Item, i: number): ReactNode {
  const marginTop = item.before ?? 0;
  switch (item.kind) {
    case "employer":
      return row(i, heading(item, s.employer), item.right, 2.7);
    case "role":
      return row(i, h(Text, { style: s.role }, item.text), item.right, 0.9, {
        marginBottom: item.after,
      });
    case "project":
      return row(i, heading(item, s.project), item.right, 0.9);
    case "text":
      return h(Text, { key: i, style: { marginTop } }, runs(item.runs));
    case "row":
      return row(i, h(Text, { style: s.rowLeft }, runs(item.runs)), item.right, 0.9, { marginTop });
    case "skill":
      return h(Text, { key: i, style: s.skill }, runs(item.runs));
    case "note":
      return h(Text, { key: i, style: [s.note, { marginTop }] }, item.text);
    case "bullet":
      return h(
        View,
        { key: i, style: [s.bullet, { marginTop }] },
        h(Text, { style: s.bulletMark }, "•"),
        h(Text, { style: { flex: 1 } }, item.text),
      );
  }
}

/**
 * The space above a block. Padding on a view of its own stays on the page it starts on, and a break
 * through it leaves nothing on the next, so a block at the top of a page has none.
 */
function gap(key: string, size: number): ReactNode {
  return h(View, { key, style: { paddingTop: size } });
}

/** Lines that stay whole on a page, under their section's heading if they're the first. */
function block(key: string, { items }: Block, head?: ReactNode): ReactNode {
  return h(View, { key, wrap: false }, head, ...items.map(renderItem));
}

export async function buildPdf(resume: Resume): Promise<Buffer> {
  const model = buildModel(resume);
  const contact: ReactNode[] = [];
  model.contact.forEach((item, i) => {
    if (i) contact.push(h(Text, { key: `d${i}` }, "  ·  "));
    contact.push(...(runs([item]) as ReactNode[]));
  });

  const body = model.sections.flatMap((section) =>
    section.blocks.flatMap((entry, i) => {
      const key = `${section.title}-${i}`;
      return [
        gap(`${key}-gap`, i ? entry.gap : GAP.section),
        block(key, entry, i ? null : h(Text, { style: s.section }, section.title)),
      ];
    }),
  );
  const tail = body.splice(-3);

  const doc = h(
    Document,
    {
      title: `${model.name ?? "Jonas Jensen"} CV`,
      author: model.name ?? "Jonas Jensen",
      subject: EASTER_EGG,
      creator: model.name ?? "Jonas Jensen",
      producer: model.name ?? "Jonas Jensen",
    },
    h(
      Page,
      { size: "A4", style: s.page },
      model.name ? h(Text, { style: s.name }, model.name) : null,
      model.label ? h(Text, { style: s.label }, model.label) : null,
      h(Text, { style: s.contact }, ...contact),
      ...body,
      // The last two blocks stay together, so the last page can't be one short section by itself.
      h(View, { wrap: false }, ...tail),
      h(Text, { style: s.egg }, EASTER_EGG),
      h(Text, {
        style: s.footer,
        fixed: true,
        render: ({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
          `${model.footer} · ${pageNumber}/${totalPages}`,
      }),
    ),
  );
  return renderToBuffer(doc);
}
