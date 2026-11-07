import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  Footer,
  LevelFormat,
  LineRuleType,
  Packer,
  PageNumber,
  Paragraph,
  Tab,
  TabStopType,
  TextRun,
  type ParagraphChild,
} from "docx";
import { estimatePageNumbers } from "docx/layout";
import { GAP, type Resume } from "../resumeData";
import { EASTER_EGG } from "./easterEgg";
import { buildModel, type Inline, type Item } from "./model";

// The DOCX: an ordinary Word document with real styles (Title, Heading 1 to 3, List Bullet), Times
// New Roman under Arial headings, and dates on a right tab stop rather than in a table, so a
// consultancy can paste it into its own template. Its layout is its own code, not shared with the
// screen or the PDF: a design change goes in each.

const SERIF = "Times New Roman";
const SANS = "Arial";
const INCH = 1440;
/** 1" left and right, 0.8" top and bottom, on A4. */
const PAGE = { width: 11906, height: 16838 };
const MARGIN_Y = 0.8 * INCH;
/** Text width of A4 with 1" margins, in twips. */
const TEXT_WIDTH = PAGE.width - 2 * INCH;
const pt = (n: number) => n * 20;
const RIGHT_TAB = [{ type: TabStopType.RIGHT, position: TEXT_WIDTH }];

function runs(items: Inline[]): ParagraphChild[] {
  return items.map((item) =>
    item.href
      ? new ExternalHyperlink({
          link: item.href,
          children: [new TextRun({ text: item.text, style: "Hyperlink", bold: item.bold })],
        })
      : new TextRun({ text: item.text, bold: item.bold }),
  );
}

/**
 * Dates, and a project's address: the same in every section. Direct formatting, since a character
 * style's bold and italic would toggle against the paragraph's rather than turn them off.
 */
function right(text?: string): ParagraphChild[] {
  if (!text) return [];
  return [
    new TextRun({ children: [new Tab(), text], font: SANS, size: 20, bold: false, italics: false }),
  ];
}

/** A line, with the spacing and keep settings that depend on where it is, on top of its style. */
function paragraph(item: Item, before: number, keepNext: boolean): Paragraph {
  const after = item.kind === "role" ? item.after : 0;
  const options = {
    keepNext,
    keepLines: true,
    spacing: { before: pt(before), after: pt(after) },
  };
  switch (item.kind) {
    case "employer":
      return new Paragraph({
        ...options,
        style: "Heading2",
        tabStops: RIGHT_TAB,
        children: [...runs([{ text: item.text, href: item.href }]), ...right(item.right)],
      });
    case "role":
      return new Paragraph({
        ...options,
        style: "Role",
        tabStops: RIGHT_TAB,
        children: [new TextRun(item.text), ...right(item.right)],
      });
    case "project":
      return new Paragraph({
        ...options,
        style: "Heading3",
        tabStops: RIGHT_TAB,
        children: [...runs([{ text: item.text, href: item.href }]), ...right(item.right)],
      });
    case "text":
      return new Paragraph({ ...options, children: runs(item.runs) });
    case "row":
      return new Paragraph({
        ...options,
        tabStops: RIGHT_TAB,
        children: [...runs(item.runs), ...right(item.right)],
      });
    case "skill":
      return new Paragraph({ ...options, style: "Skill", children: runs(item.runs) });
    case "fact":
      return new Paragraph({
        ...options,
        style: "Fact",
        tabStops: [{ type: TabStopType.LEFT, position: pt(60) }],
        children: [
          new TextRun({ children: [item.label, new Tab()], font: SANS, size: 18, bold: true }),
          ...runs(item.runs),
        ],
      });
    case "note":
      return new Paragraph({ ...options, style: "Note", children: [new TextRun(item.text)] });
    case "bullet":
      return new Paragraph({
        ...options,
        style: "ListBullet",
        numbering: { reference: "cv-bullets", level: 0 },
        children: runs(item.runs),
      });
  }
}

export async function buildDocx(resume: Resume): Promise<Buffer> {
  const model = buildModel(resume);
  const children: Paragraph[] = [];

  if (model.name) {
    children.push(new Paragraph({ style: "Title", children: [new TextRun(model.name)] }));
  }
  if (model.label) {
    children.push(new Paragraph({ style: "Subtitle", children: [new TextRun(model.label)] }));
  }
  const contact: ParagraphChild[] = [];
  model.contact.forEach((item, i) => {
    if (i) contact.push(new TextRun("  ·  "));
    contact.push(...runs([item]));
  });
  children.push(new Paragraph({ style: "Contact", children: contact }));

  // The last two blocks stay together, so the last page can't be one short section by itself.
  const lastButOne = model.sections.flatMap((section) => section.blocks).at(-2);

  for (const section of model.sections) {
    children.push(new Paragraph({ style: "Heading1", children: [new TextRun(section.title)] }));
    section.blocks.forEach((block, i) => {
      block.items.forEach((item, j) => {
        const before = j ? (item.before ?? 0) : i ? block.gap : 0;
        // Keep with next is what holds a block whole, as the screen's and the PDF's do. Word drops
        // the space above a paragraph that a page break puts at the top of a page by itself.
        children.push(paragraph(item, before, j < block.items.length - 1 || block === lastButOne));
      });
    });
  }

  // Hidden text (w:vanish): invisible in Word, still in the file's text for anything that reads it.
  // White too, since Quick Look and TextEdit ignore w:vanish.
  children.push(
    new Paragraph({
      spacing: { before: 0, after: 0 },
      children: [new TextRun({ text: EASTER_EGG, vanish: true, size: 2, color: "FFFFFF" })],
    }),
  );

  const doc = new Document({
    creator: model.name ?? "Jonas Jensen",
    title: `${model.name ?? "Jonas Jensen"} CV`,
    // Word works out the total itself; this writes it into the file for viewers that don't.
    pageNumbers: estimatePageNumbers,
    styles: {
      default: {
        document: {
          run: { font: SERIF, size: 22 },
          paragraph: { spacing: { before: 0, after: 0, line: 270 } },
        },
        hyperlink: { run: { color: "000080", underline: {} } },
      },
      paragraphStyles: [
        {
          id: "Title",
          name: "Title",
          basedOn: "Normal",
          next: "Subtitle",
          quickFormat: true,
          run: { font: SANS, bold: true, size: 48, characterSpacing: 10 },
          paragraph: { spacing: { before: 0, after: 0 }, keepNext: true },
        },
        {
          id: "Subtitle",
          name: "Subtitle",
          basedOn: "Normal",
          next: "Contact",
          quickFormat: true,
          run: { italics: true, size: 26 },
          paragraph: { spacing: { before: pt(4), after: pt(10) }, keepNext: true },
        },
        {
          id: "Contact",
          name: "Contact",
          basedOn: "Normal",
          run: { font: SANS, size: 18 },
          paragraph: {
            spacing: { before: 0, after: 0 },
            border: { top: { style: BorderStyle.SINGLE, size: 12, space: 7, color: "000000" } },
          },
        },
        {
          id: "Heading1",
          name: "heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { font: SANS, bold: true, size: 22, allCaps: true, characterSpacing: 8 },
          paragraph: {
            spacing: { before: pt(GAP.section), after: pt(8) },
            keepNext: true,
            keepLines: true,
            outlineLevel: 0,
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, space: 3, color: "000000" } },
          },
        },
        {
          id: "Heading2",
          name: "heading 2",
          basedOn: "Normal",
          next: "Role",
          quickFormat: true,
          run: { font: SANS, bold: true, size: 26 },
          paragraph: {
            spacing: { before: pt(GAP.job), after: 0 },
            keepNext: true,
            keepLines: true,
            outlineLevel: 1,
          },
        },
        {
          id: "Heading3",
          name: "heading 3",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { font: SANS, bold: true, size: 22 },
          paragraph: {
            spacing: { before: pt(GAP.project), after: 0 },
            keepNext: true,
            keepLines: true,
            outlineLevel: 2,
          },
        },
        {
          id: "Role",
          name: "Role",
          basedOn: "Normal",
          next: "Normal",
          run: { bold: true, italics: true },
          paragraph: { spacing: { before: 0, after: 0 }, keepNext: true },
        },
        {
          id: "Note",
          name: "Note",
          basedOn: "Normal",
          run: { italics: true, size: 20 },
          paragraph: { spacing: { before: 0, after: 0 } },
        },
        {
          id: "Skill",
          name: "Skill",
          basedOn: "Normal",
          paragraph: { spacing: { before: 0, after: 0, line: 320, lineRule: LineRuleType.EXACT } },
        },
        {
          id: "Fact",
          name: "Fact",
          basedOn: "Normal",
          paragraph: {
            spacing: { before: 0, after: 0 },
            indent: { left: pt(60), hanging: pt(60) },
          },
        },
        {
          id: "ListBullet",
          name: "List Bullet",
          basedOn: "Normal",
          quickFormat: true,
          paragraph: { spacing: { before: pt(GAP.bullet), after: 0 } },
        },
        {
          id: "Footer",
          name: "footer",
          basedOn: "Normal",
          run: { font: SANS, size: 16, color: "808080" },
          paragraph: {
            spacing: { before: 0, after: 0, line: 240 },
            alignment: AlignmentType.RIGHT,
          },
        },
      ],
    },
    numbering: {
      config: [
        {
          reference: "cv-bullets",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "•",
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: pt(16), hanging: pt(12) } } },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: PAGE,
            margin: {
              top: MARGIN_Y,
              right: INCH,
              bottom: MARGIN_Y,
              left: INCH,
              footer: MARGIN_Y / 2,
            },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                style: "Footer",
                children: [
                  new TextRun({
                    children: [
                      `${model.footer} · `,
                      PageNumber.CURRENT,
                      "/",
                      PageNumber.TOTAL_PAGES,
                    ],
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });
  return Packer.toBuffer(doc);
}
