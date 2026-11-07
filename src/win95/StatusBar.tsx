import type { CSSProperties, ReactNode } from "react";
import styles from "./StatusBar.module.css";

// The size grip (Marlett "o"): three diagonal highlight/shadow ridges, drawn over
// the last field's bottom-right corner on a face-coloured square.
const GRIP = [
  "...........W",
  "..........WD",
  ".........WDD",
  "........WDD.",
  ".......WDD.W",
  "......WDD.WD",
  ".....WDD.WDD",
  "....WDD.WDD.",
  "...WDD.WDD.W",
  "..WDD.WDD.WD",
  ".WDD.WDD.WDD",
  "WDD.WDD.WDD.",
];

function gripPath(ink: "W" | "D"): string {
  return GRIP.flatMap((row, y) =>
    [...row].map((c, x) => (c === ink ? `M${x} ${y}h1v1h-1z` : "")),
  ).join("");
}

function Grip() {
  return (
    <svg
      className={styles.grip}
      width="13"
      height="13"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <rect width="13" height="13" fill="var(--w95-3d-face)" />
      <path d={gripPath("W")} fill="var(--w95-3d-highlight)" />
      <path d={gripPath("D")} fill="var(--w95-3d-shadow)" />
    </svg>
  );
}

/** One recessed (sunken-thin) pane within a status bar. */
function Field({
  children,
  grow = false,
  style,
}: {
  children?: ReactNode;
  grow?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div className={`${styles.field}${grow ? ` ${styles.grow}` : ""}`} style={style}>
      {children}
    </div>
  );
}

/**
 * The strip across the bottom of a window (SOURCES.md §Status bar): 17px sunken
 * fields 2px apart below a 2px gap, the size grip in the last one's corner. A
 * plain string child is wrapped in a single field.
 */
function StatusBar({ children }: { children?: ReactNode }) {
  const wrapped = typeof children === "string" ? <Field grow>{children}</Field> : children;
  return (
    <div className={styles.bar}>
      {wrapped}
      <Grip />
    </div>
  );
}

StatusBar.Field = Field;
export default StatusBar;
