import { useEffect, useRef, useState } from "react";
import MenuPopup, { type MenuItem } from "./Menu";
import Mnemonic from "./mnemonic";
import styles from "./MenuBar.module.css";

export type { MenuItem };

export interface Menu {
  label: string;
  items: MenuItem[];
}

/**
 * A window's menu bar (File / Edit / …). Pressing a title drops its menu; with a
 * menu already open, hovering another title switches to it and Left / Right step
 * between them (Win95 "menu track"). An outside press or Escape closes. The open
 * title turns to the navy selection, as Win95 draws it (the sunken 3D title is
 * Win98's). `flat` is the Office 97 command bar's look instead: a title lifts under the pointer
 * and sinks when open, with no navy.
 */
export default function MenuBar({ menus, flat = false }: { menus: Menu[]; flat?: boolean }) {
  const [open, setOpen] = useState<{ index: number; keyboard: boolean } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(null);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const step = (by: 1 | -1) =>
    setOpen((o) => o && { index: (o.index + by + menus.length) % menus.length, keyboard: true });

  return (
    <div className={`${styles.bar}${flat ? ` ${styles.flat}` : ""}`} ref={ref}>
      {menus.map((menu, i) => (
        <div className={styles.slot} key={menu.label}>
          <div
            className={`${styles.title}${open?.index === i ? ` ${styles.titleOpen}` : ""}`}
            onMouseDown={(e) => {
              e.preventDefault();
              setOpen(open?.index === i ? null : { index: i, keyboard: false });
            }}
            onMouseEnter={() => open && open.index !== i && setOpen({ index: i, keyboard: false })}
          >
            <Mnemonic label={menu.label} />
          </div>
          {open?.index === i && (
            <MenuPopup
              key={i}
              items={menu.items}
              keyboard={open.keyboard}
              onClose={() => setOpen(null)}
              onLeft={() => step(-1)}
              onRight={() => step(1)}
              className={styles.dropdown}
            />
          )}
        </div>
      ))}
    </div>
  );
}
