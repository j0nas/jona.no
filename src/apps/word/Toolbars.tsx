import { Tooltip } from "../../win95";
import styles from "./Word.module.css";

// Word 97's toolbar buttons, one 23×22 cell each in word-toolbar.png: cut from a 1:1 capture
// (SOURCES.md §Word 97) with the face colour keyed out, disabled looks included.
const CELLS = [
  "new",
  "open",
  "save",
  "print",
  "preview",
  "spelling",
  "cut",
  "copy",
  "paste",
  "painter",
  "undo",
  "redo",
  "hyperlink",
  "web",
  "tables",
  "table",
  "excel",
  "columns",
  "drawing",
  "docmap",
  "pilcrow",
  "assistant",
  "bold",
  "italic",
  "underline",
  "left",
  "center",
  "right",
  "justify",
  "numbering",
  "bullets",
  "outdent",
  "indent",
  "borders",
  "highlight",
  "color",
  "drop",
  "drop-off",
] as const;

type Cell = (typeof CELLS)[number];

export function Grip() {
  return <span className={styles.grip} aria-hidden="true" />;
}

function Separator() {
  return <span className={styles.separator} aria-hidden="true" />;
}

function ToolButton({
  cell,
  label,
  onClick,
  disabled = false,
  on = false,
}: {
  cell: Cell;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  on?: boolean;
}) {
  return (
    <Tooltip text={label} className={styles.toolSlot}>
      <button
        type="button"
        className={`${styles.tool}${on ? ` ${styles.toolOn}` : ""}`}
        disabled={disabled}
        aria-label={label}
        tabIndex={-1}
        onClick={onClick}
      >
        <span
          className={styles.toolGlyph}
          style={{ backgroundPositionX: -23 * CELLS.indexOf(cell) }}
        />
      </button>
    </Tooltip>
  );
}

/** A button with its own little arrow beside it, as Undo and Font Color have. */
function DropButton({
  cell,
  label,
  disabled = false,
}: {
  cell: Cell;
  label: string;
  disabled?: boolean;
}) {
  return (
    <>
      <ToolButton cell={cell} label={label} disabled={disabled} />
      <button
        type="button"
        className={`${styles.tool} ${styles.toolDrop}`}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
      >
        <span
          className={styles.toolGlyph}
          style={{ backgroundPositionX: -23 * CELLS.indexOf(disabled ? "drop-off" : "drop") }}
        />
      </button>
    </>
  );
}

/** An Office 97 flat combo box, as a read-only document leaves it: showing its value, nothing more. */
function Combo({ value, width }: { value: string; width: number }) {
  return (
    <span className={styles.combo} style={{ flexBasis: width }}>
      <span className={styles.comboValue}>{value}</span>
      <span className={styles.comboDrop} aria-hidden="true" />
    </span>
  );
}

export function StandardToolbar({
  zoom,
  onPrint,
  onAssistant,
}: {
  zoom: number;
  onPrint: () => void;
  onAssistant: () => void;
}) {
  return (
    <div className={styles.toolbar}>
      <Grip />
      <ToolButton cell="new" label="New" />
      <ToolButton cell="open" label="Open" />
      <ToolButton cell="save" label="Save" />
      <Separator />
      <ToolButton cell="print" label="Print" onClick={onPrint} />
      <ToolButton cell="preview" label="Print Preview" />
      <ToolButton cell="spelling" label="Spelling and Grammar" />
      <Separator />
      <ToolButton cell="cut" label="Cut" disabled />
      <ToolButton cell="copy" label="Copy" disabled />
      <ToolButton cell="paste" label="Paste" />
      <ToolButton cell="painter" label="Format Painter" />
      <Separator />
      <DropButton cell="undo" label="Undo" />
      <DropButton cell="redo" label="Redo" disabled />
      <Separator />
      <ToolButton cell="hyperlink" label="Insert Hyperlink" />
      <ToolButton cell="web" label="Web Toolbar" />
      <Separator />
      <ToolButton cell="tables" label="Tables and Borders" />
      <ToolButton cell="table" label="Insert Table" />
      <ToolButton cell="excel" label="Insert Microsoft Excel Worksheet" disabled />
      <ToolButton cell="columns" label="Columns" />
      <ToolButton cell="drawing" label="Drawing" />
      <Separator />
      <ToolButton cell="docmap" label="Document Map" />
      <ToolButton cell="pilcrow" label="Show/Hide ¶" />
      <Combo value={`${Math.round(zoom * 100)}%`} width={52} />
      <Separator />
      <ToolButton cell="assistant" label="Office Assistant" onClick={onAssistant} />
    </div>
  );
}

export function FormattingToolbar() {
  return (
    <div className={styles.toolbar}>
      <Grip />
      <Combo value="Normal" width={90} />
      <Combo value="Times New Roman" width={110} />
      <Combo value="11" width={35} />
      <Separator />
      <ToolButton cell="bold" label="Bold" />
      <ToolButton cell="italic" label="Italic" />
      <ToolButton cell="underline" label="Underline" />
      <Separator />
      <ToolButton cell="left" label="Align Left" on />
      <ToolButton cell="center" label="Center" />
      <ToolButton cell="right" label="Align Right" />
      <ToolButton cell="justify" label="Justify" />
      <Separator />
      <ToolButton cell="numbering" label="Numbering" />
      <ToolButton cell="bullets" label="Bullets" />
      <ToolButton cell="outdent" label="Decrease Indent" />
      <ToolButton cell="indent" label="Increase Indent" />
      <Separator />
      <DropButton cell="borders" label="Borders" />
      <DropButton cell="highlight" label="Highlight" />
      <DropButton cell="color" label="Font Color" />
    </div>
  );
}
