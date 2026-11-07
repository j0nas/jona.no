import { useEffect, useRef, useState } from "react";
import type { MouseEvent, ReactNode } from "react";
import AppWindow, { type WindowControls } from "../../components/window/AppWindow";
import { MenuPopup, StatusBar, type Menu, type MenuItem } from "../../win95";
import { apps, type WindowId } from "../registry";
import HomePage, { CONTACT_EMAIL } from "./HomePage";
import styles from "./InternetExplorer.module.css";

const HOME_URL = "http://www.jona.no/";

// One throbber pass (46 frames, see the stylesheet): the "page load" it animates for.
const LOAD_MS = 4600;

// IE3's View › Fonts, which the toolbar's Font button cycles through.
const FONT_SIZES = [
  { label: "La&rgest", scale: 1.3 },
  { label: "&Large", scale: 1.15 },
  { label: "&Medium", scale: 1 },
  { label: "&Small", scale: 0.9 },
  { label: "Sm&allest", scale: 0.8 },
];

/** Cells of the IE 3.02 toolbar strip (shdocvw.dll #261/#262), each 30×20. */
const CELL = {
  back: 0,
  forward: 1,
  stop: 2,
  refresh: 3,
  home: 4,
  search: 5,
  favorites: 6,
  print: 7,
  font: 8,
  stopLoading: 12,
  mail: 13,
};

interface InternetExplorerProps {
  controls: WindowControls;
  onOpen: (id: WindowId) => void;
}

function openExternal(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

function ToolButton({
  cell,
  label,
  onClick,
  disabled = false,
  children,
}: {
  cell: number;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className={styles.toolSlot}>
      <button type="button" className={styles.tool} disabled={disabled} onClick={onClick}>
        <span className={styles.toolIcon} style={{ backgroundPositionX: -30 * cell }} />
        <span className={styles.toolLabel}>{label}</span>
      </button>
      {children}
    </div>
  );
}

function Grip() {
  return <span className={styles.grip} aria-hidden="true" />;
}

/**
 * Internet Explorer 3.02: its menus, the coolbar over the real shdocvw.dll bitmap
 * (SOURCES.md §Internet Explorer 3) and a status bar, around the home page. The toolbar is
 * real where it can be: Home scrolls to the top, Refresh and Stop run the throbber, Font
 * cycles the page's text size, Favorites and Mail lead to the links the page itself has.
 */
export default function InternetExplorer({ controls, onOpen }: InternetExplorerProps) {
  const pageRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [fontStep, setFontStep] = useState(2);
  const [hoverUrl, setHoverUrl] = useState<string | null>(null);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const favoritesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading) return;
    const timer = window.setTimeout(() => setLoading(false), LOAD_MS);
    return () => window.clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    if (!favoritesOpen) return;
    function onDown(event: globalThis.MouseEvent) {
      if (!favoritesRef.current?.contains(event.target as Node)) setFavoritesOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [favoritesOpen]);

  const goHome = () => pageRef.current?.scrollTo(0, 0);
  const refresh = () => {
    goHome();
    setLoading(true);
  };
  const stop = () => setLoading(false);

  const favorites: MenuItem[] = [
    { label: "My &résumé", onClick: () => onOpen("cv") },
    { label: "&Floor Planner", onClick: () => onOpen("floor-planner") },
    { label: "&Documents", onClick: () => onOpen("documents") },
    { label: "&GitHub", onClick: () => openExternal("https://github.com/j0nas") },
    { label: "&LinkedIn", onClick: () => openExternal("https://www.linkedin.com/in/j0nas") },
  ];

  // The strings are IE's own menu resources (shdocvw.dll #256, #258; mshtml.dll #32515).
  const menu: Menu[] = [
    {
      label: "&File",
      items: [
        { label: "&New Window", shortcut: "Ctrl+N", disabled: true },
        { label: "&Open...", shortcut: "Ctrl+O", disabled: true },
        { label: "&Save", shortcut: "Ctrl+S", disabled: true },
        { label: "Save &As File...", disabled: true },
        "divider",
        { label: "New &Message...", onClick: () => (location.href = `mailto:${CONTACT_EMAIL}`) },
        { label: "Send &To", disabled: true },
        "divider",
        { label: "Page Set&up...", disabled: true },
        { label: "&Print...", shortcut: "Ctrl+P", disabled: true },
        "divider",
        { label: "Cr&eate Shortcut", disabled: true },
        { label: "P&roperties", disabled: true },
        "divider",
        { label: "&Close", onClick: controls.onClose },
      ],
    },
    {
      label: "&Edit",
      items: [
        { label: "Cu&t", shortcut: "Ctrl+X", disabled: true },
        { label: "&Copy", shortcut: "Ctrl+C", disabled: true },
        { label: "&Paste", shortcut: "Ctrl+V", disabled: true },
        "divider",
        { label: "Select &All", shortcut: "Ctrl+A", disabled: true },
        "divider",
        { label: "&Find (on this page)...", shortcut: "Ctrl+F", disabled: true },
      ],
    },
    {
      label: "&View",
      items: [
        { label: "&Toolbar", checked: true, disabled: true },
        { label: "Status &Bar", checked: true, disabled: true },
        "divider",
        {
          label: "Fo&nts",
          submenu: FONT_SIZES.map((size, i) => ({
            label: size.label,
            checked: fontStep === i,
            radio: true,
            onClick: () => setFontStep(i),
          })),
        },
        "divider",
        { label: "Sto&p", shortcut: "Esc", onClick: stop },
        { label: "&Refresh", shortcut: "F5", onClick: refresh },
        "divider",
        { label: "Sour&ce", disabled: true },
        "divider",
        { label: "&Options...", disabled: true },
      ],
    },
    {
      label: "&Go",
      items: [
        { label: "&Back", shortcut: "Alt+Left Arrow", disabled: true },
        { label: "&Forward", shortcut: "Alt+Right Arrow", disabled: true },
        "divider",
        { label: "&Start Page", onClick: goHome },
        { label: "Search the &Web", disabled: true },
        { label: "B&est of the Web", disabled: true },
        "divider",
        { label: "Read &Mail", disabled: true },
        { label: "Read &News", disabled: true },
        "divider",
        { label: "-- No History --", disabled: true },
        "divider",
        { label: "Open &History Folder", disabled: true },
      ],
    },
    {
      label: "F&avorites",
      items: [
        { label: "&Add To Favorites...", disabled: true },
        { label: "&Organize Favorites...", disabled: true },
        "divider",
        ...favorites,
      ],
    },
    {
      label: "&Help",
      items: [
        { label: "&Help Topics", disabled: true },
        { label: "Web &Tutorial", disabled: true },
        "divider",
        { label: "Microsoft on the &Web", disabled: true },
        { label: "Online &Support", disabled: true },
        "divider",
        { label: "&About Internet Explorer", disabled: true },
      ],
    },
  ];

  // IE's status bar names the link under the pointer.
  function onPageOver(event: MouseEvent<HTMLDivElement>) {
    const link = (event.target as Element).closest("a");
    setHoverUrl(link ? link.href.replace(`${location.origin}/`, HOME_URL) : null);
  }

  const status = hoverUrl
    ? `Shortcut to ${hoverUrl}`
    : loading
      ? `Opening page ${HOME_URL}...`
      : "Done";

  return (
    <AppWindow id="internet" controls={controls} menu={menu}>
      <div className={styles.coolbar}>
        <div className={styles.toolbarBand}>
          <Grip />
          <div className={styles.tools}>
            <ToolButton cell={CELL.back} label="Back" disabled />
            <ToolButton cell={CELL.forward} label="Forward" disabled />
            <ToolButton cell={loading ? CELL.stopLoading : CELL.stop} label="Stop" onClick={stop} />
            <ToolButton cell={CELL.refresh} label="Refresh" onClick={refresh} />
            <ToolButton cell={CELL.home} label="Home" onClick={goHome} />
            <ToolButton cell={CELL.search} label="Search" disabled />
            <div ref={favoritesRef}>
              <ToolButton
                cell={CELL.favorites}
                label="Favorites"
                onClick={() => setFavoritesOpen((v) => !v)}
              >
                {favoritesOpen && (
                  <MenuPopup
                    items={favorites}
                    onClose={() => setFavoritesOpen(false)}
                    className={styles.toolMenu}
                  />
                )}
              </ToolButton>
            </div>
            <ToolButton cell={CELL.print} label="Print" disabled />
            <ToolButton
              cell={CELL.font}
              label="Font"
              onClick={() => setFontStep((i) => (i + 1) % FONT_SIZES.length)}
            />
            <ToolButton
              cell={CELL.mail}
              label="Mail"
              onClick={() => (location.href = `mailto:${CONTACT_EMAIL}`)}
            />
          </div>
          <button
            type="button"
            className={`${styles.throbber}${loading ? ` ${styles.throbbing}` : ""}`}
            aria-label="Internet Explorer"
            onClick={refresh}
          >
            <span className={styles.throbberFrame} />
          </button>
        </div>
        <div className={styles.addressBand}>
          <Grip />
          <span className={styles.addressLabel}>Address</span>
          <div className={styles.combo}>
            <input
              type="text"
              className={styles.comboInput}
              readOnly
              value={HOME_URL}
              aria-label="Address"
            />
            <span className={styles.comboDrop} aria-hidden="true" />
          </div>
          <div className={styles.linksBand}>
            <Grip />
            <span className={styles.linksLabel}>Links</span>
          </div>
        </div>
      </div>
      <div className={styles.viewport}>
        <div
          ref={pageRef}
          className={styles.page}
          style={{ fontSize: `${FONT_SIZES[fontStep].scale * 100}%` }}
          onMouseOver={onPageOver}
          onMouseLeave={() => setHoverUrl(null)}
        >
          <HomePage onOpen={onOpen} />
        </div>
      </div>
      <StatusBar>
        <StatusBar.Field grow>{status}</StatusBar.Field>
        <StatusBar.Field style={{ flex: "0 0 101px" }} />
        <StatusBar.Field style={{ flex: "0 0 66px", padding: "1px 0 0 1px" }}>
          <img src={apps.internet.iconSmall} alt="" width={16} height={16} />
        </StatusBar.Field>
      </StatusBar>
    </AppWindow>
  );
}
