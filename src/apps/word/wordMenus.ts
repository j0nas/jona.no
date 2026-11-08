import type { Menu } from "../../win95";
import { CV_DOCS, CV_FILES, cvDownload, otherLang } from "./downloads/files";
import type { Lang } from "./resumeData";

/**
 * Word 97's menu bar. The document is read-only and there's only so much for it to do, so these
 * are greyed out but for Print, Close and Help. The strings are from memory of Word 97, not a
 * resource dump (SOURCES.md §Word 97).
 */
export function wordMenus({
  lang,
  online,
  onPrint,
  onClose,
  onHelp,
  onOpenOther,
}: {
  lang: Lang;
  online: boolean;
  onPrint: () => void;
  onClose: () => void;
  onHelp: () => void;
  /** Opens the CV in the other language, the other file on File's list of recent ones. */
  onOpenOther: () => void;
}): Menu[] {
  // Saving from Word gives a Word document.
  const saveAs = () => {
    const link = document.createElement("a");
    link.href = cvDownload(lang, "docx");
    link.download = `${CV_FILES[lang]}.docx`;
    link.click();
  };
  return [
    {
      label: "&File",
      items: [
        { label: "&New...", shortcut: "Ctrl+N", disabled: true },
        { label: "&Open...", shortcut: "Ctrl+O", disabled: true },
        { label: "&Close", onClick: onClose },
        "divider",
        { label: "&Save", shortcut: "Ctrl+S", disabled: true },
        { label: "Save &As...", onClick: saveAs },
        { label: "Save as &HTML...", disabled: true },
        { label: "Versio&ns...", disabled: true },
        "divider",
        { label: "Page Set&up...", disabled: true },
        { label: "Print Pre&view", disabled: true },
        { label: "&Print...", shortcut: "Ctrl+P", onClick: onPrint },
        "divider",
        { label: "Sen&d To", disabled: true },
        { label: "Propert&ies", disabled: true },
        "divider",
        { label: `&1 ${CV_DOCS[lang]}`, disabled: true },
        { label: `&2 ${CV_DOCS[otherLang(lang)]}`, onClick: onOpenOther },
        "divider",
        { label: "E&xit", onClick: onClose },
      ],
    },
    {
      label: "&Edit",
      items: [
        { label: "&Undo", shortcut: "Ctrl+Z", disabled: true },
        { label: "&Repeat", shortcut: "Ctrl+Y", disabled: true },
        "divider",
        { label: "Cu&t", shortcut: "Ctrl+X", disabled: true },
        { label: "&Copy", shortcut: "Ctrl+C", disabled: true },
        { label: "&Paste", shortcut: "Ctrl+V", disabled: true },
        { label: "Paste &Special...", disabled: true },
        { label: "Paste as &Hyperlink", disabled: true },
        "divider",
        { label: "Cle&ar", shortcut: "Del", disabled: true },
        { label: "Select A&ll", shortcut: "Ctrl+A", disabled: true },
        "divider",
        { label: "&Find...", shortcut: "Ctrl+F", disabled: true },
        { label: "R&eplace...", shortcut: "Ctrl+H", disabled: true },
        { label: "&Go To...", shortcut: "Ctrl+G", disabled: true },
      ],
    },
    {
      label: "&View",
      items: [
        { label: "&Normal", disabled: true },
        online
          ? { label: "&Online Layout", checked: true, radio: true }
          : { label: "&Online Layout", disabled: true },
        online
          ? { label: "&Page Layout", disabled: true }
          : { label: "&Page Layout", checked: true, radio: true },
        { label: "Ou&tline", disabled: true },
        "divider",
        { label: "&Toolbars", disabled: true },
        { label: "&Ruler", checked: !online, disabled: true },
        { label: "&Document Map", disabled: true },
        "divider",
        { label: "&Header and Footer", disabled: true },
        { label: "Foot&notes", disabled: true },
        { label: "&Comments", disabled: true },
        "divider",
        { label: "F&ull Screen", disabled: true },
        { label: "&Zoom...", disabled: true },
      ],
    },
    {
      label: "&Insert",
      items: [
        { label: "&Break...", disabled: true },
        { label: "Page N&umbers...", disabled: true },
        { label: "Date and &Time...", disabled: true },
        { label: "&AutoText", disabled: true },
        { label: "&Field...", disabled: true },
        { label: "&Symbol...", disabled: true },
        { label: "Co&mment", disabled: true },
        { label: "Foot&note...", disabled: true },
        { label: "&Caption...", disabled: true },
        { label: "Cross-&reference...", disabled: true },
        { label: "In&dex and Tables...", disabled: true },
        "divider",
        { label: "&Picture", disabled: true },
        { label: "Te&xt Box", disabled: true },
        { label: "Fi&le...", disabled: true },
        { label: "&Object...", disabled: true },
        { label: "Boo&kmark...", disabled: true },
        { label: "&Hyperlink...", shortcut: "Ctrl+K", disabled: true },
      ],
    },
    {
      label: "F&ormat",
      items: [
        { label: "&Font...", disabled: true },
        { label: "&Paragraph...", disabled: true },
        { label: "Bullets and &Numbering...", disabled: true },
        { label: "&Borders and Shading...", disabled: true },
        { label: "&Columns...", disabled: true },
        { label: "&Tabs...", disabled: true },
        { label: "&Drop Cap...", disabled: true },
        { label: "Te&xt Direction...", disabled: true },
        { label: "Change Cas&e...", disabled: true },
        "divider",
        { label: "&AutoFormat...", disabled: true },
        { label: "Style &Gallery...", disabled: true },
        { label: "&Style...", disabled: true },
        { label: "Bac&kground", disabled: true },
        { label: "&Object...", disabled: true },
      ],
    },
    {
      label: "&Tools",
      items: [
        { label: "&Spelling and Grammar...", shortcut: "F7", disabled: true },
        { label: "&Language", disabled: true },
        { label: "&Word Count...", disabled: true },
        { label: "A&utoSummarize...", disabled: true },
        { label: "&AutoCorrect...", disabled: true },
        "divider",
        { label: "&Track Changes", disabled: true },
        { label: "&Merge Documents...", disabled: true },
        { label: "&Protect Document...", disabled: true },
        "divider",
        { label: "Mail Me&rge...", disabled: true },
        { label: "&Envelopes and Labels...", disabled: true },
        { label: "Le&tter Wizard...", disabled: true },
        "divider",
        { label: "Mac&ro", disabled: true },
        { label: "Templates and Add-&Ins...", disabled: true },
        { label: "&Customize...", disabled: true },
        { label: "&Options...", disabled: true },
      ],
    },
    {
      label: "T&able",
      items: [
        { label: "Dra&w Table", disabled: true },
        { label: "&Insert Table...", disabled: true },
        { label: "&Delete Cells...", disabled: true },
        { label: "&Merge Cells", disabled: true },
        { label: "S&plit Cells...", disabled: true },
        "divider",
        { label: "Select &Row", disabled: true },
        { label: "Select &Column", disabled: true },
        { label: "Select &Table", shortcut: "Alt+Num 5", disabled: true },
        "divider",
        { label: "Table Auto&Format...", disabled: true },
        { label: "Distribute Rows Eve&nly", disabled: true },
        { label: "Distribute Columns Evenl&y", disabled: true },
        { label: "Cell Hei&ght and Width...", disabled: true },
        { label: "&Headings", disabled: true },
        "divider",
        { label: "Convert Te&xt to Table...", disabled: true },
        { label: "&Sort...", disabled: true },
        { label: "F&ormula...", disabled: true },
        { label: "Split T&able", disabled: true },
        "divider",
        { label: "Hide &Gridlines", disabled: true },
      ],
    },
    {
      label: "&Window",
      items: [
        { label: "&New Window", disabled: true },
        { label: "&Arrange All", disabled: true },
        { label: "&Split", disabled: true },
        "divider",
        { label: `&1 ${CV_DOCS[lang]}`, checked: true },
      ],
    },
    {
      label: "&Help",
      items: [
        { label: "Microsoft Word &Help", shortcut: "F1", onClick: onHelp },
        { label: "&Contents and Index", disabled: true },
        { label: "What's &This?", shortcut: "Shift+F1", disabled: true },
        { label: "Microsoft on the &Web", disabled: true },
        { label: "Word&Perfect Help...", disabled: true },
        "divider",
        { label: "&About Microsoft Word", disabled: true },
      ],
    },
  ];
}
