import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import TitleBar from "./TitleBar";
import { beginDrag } from "./drag";
import styles from "./Dialog.module.css";

interface DialogProps {
  title: string;
  onClose: () => void;
  /** Enter (or the default button, type="submit") runs this. */
  onSubmit?: () => void;
  /** Dim the whole screen behind it with a 50% black dither, as Shut Down does. */
  dimScreen?: boolean;
  children: ReactNode;
}

/**
 * A modal dialog (SOURCES.md §Dialogs): the 3px dialog frame, a caption with only
 * the Close button and no icon, then the face-coloured body. Opens centred and
 * moves by its caption; Escape and Close cancel, Enter submits.
 */
export default function Dialog({
  title,
  onClose,
  onSubmit,
  dimScreen = false,
  children,
}: DialogProps) {
  const ref = useRef<HTMLFormElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragEnd = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    const el = ref.current!;
    setPos({
      x: Math.max(0, Math.round((window.innerWidth - el.offsetWidth) / 2)),
      y: Math.max(0, Math.round((window.innerHeight - 28 - el.offsetHeight) / 2)),
    });
    return () => dragEnd.current?.();
  }, []);

  // Hidden until it has its position, and what's hidden can't take focus.
  const placed = pos !== null;
  useEffect(() => {
    if (placed) ref.current?.querySelector<HTMLElement>("input, button[type=submit]")?.focus();
  }, [placed]);

  function submit(event: FormEvent) {
    event.preventDefault();
    onSubmit?.();
  }

  return (
    <div className={`${styles.overlay}${dimScreen ? ` ${styles.dim}` : ""}`}>
      <form
        ref={ref}
        className={styles.dialog}
        style={pos ? { left: pos.x, top: pos.y } : { visibility: "hidden" }}
        onSubmit={submit}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            onClose();
          }
        }}
        role="dialog"
        aria-label={title}
      >
        <TitleBar
          title={title}
          active
          closeOnly
          onClose={onClose}
          onDoubleClick={() => undefined}
          onMouseDown={(event) => {
            if ((event.target as HTMLElement).closest("[data-w95-no-drag]") || !pos) return;
            const origin = pos;
            dragEnd.current = beginDrag(event, (dx, dy) =>
              setPos({ x: origin.x + dx, y: Math.max(0, origin.y + dy) }),
            );
          }}
        />
        <div className={styles.body}>{children}</div>
      </form>
    </div>
  );
}

// The option button (DFCS_BUTTONRADIO), 12×12, sampled from a Win95 dialog: a
// SHADOW/DKSHADOW ring top-left, a 3DLIGHT/HIGHLIGHT ring bottom-right, a white
// well, and the 4×4 dot when chosen.
const RADIO = [
  "....DDDD....",
  "..DDKKKKDD..",
  ".DKKwwwwKKW.",
  ".DKwwwwwwLW.",
  "DKwwwwwwwwLW",
  "DKwwwwwwwwLW",
  "DKwwwwwwwwLW",
  "DKwwwwwwwwLW",
  ".DKwwwwwwLW.",
  ".DLLwwwwLLW.",
  "..WWLLLLWW..",
  "....WWWW....",
];
const DOT = [
  [5, 4, 2],
  [4, 5, 4],
  [4, 6, 4],
  [5, 7, 2],
];
const RADIO_INK: Record<string, string> = {
  D: "var(--w95-3d-shadow)",
  K: "var(--w95-3d-dark-shadow)",
  L: "var(--w95-3d-light)",
  W: "var(--w95-3d-highlight)",
  w: "var(--w95-window)",
};

function RadioGlyph({ checked }: { checked: boolean }) {
  return (
    <svg
      className={styles.radioGlyph}
      width="12"
      height="12"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {Object.entries(RADIO_INK).map(([c, fill]) => (
        <path
          key={c}
          fill={fill}
          d={RADIO.flatMap((row, y) =>
            [...row].map((ch, x) => (ch === c ? `M${x} ${y}h1v1h-1z` : "")),
          ).join("")}
        />
      ))}
      {checked && (
        <path fill="#000000" d={DOT.map(([x, y, w]) => `M${x} ${y}h${w}v1h-${w}z`).join("")} />
      )}
    </svg>
  );
}

/** An option button with its label; the focused one's label carries the focus rectangle. */
export function RadioButton({
  name,
  checked,
  onChange,
  children,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  children: ReactNode;
}) {
  return (
    <label className={styles.radio}>
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className={styles.native}
      />
      <RadioGlyph checked={checked} />
      <span className={styles.radioLabel}>{children}</span>
    </label>
  );
}
