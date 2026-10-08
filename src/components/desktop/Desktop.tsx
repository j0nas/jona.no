import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactElement } from "react";
import { DesktopIcon, StartMenu, TaskBar, type StartEntry } from "../../win95";
import type { WindowControls } from "../window/AppWindow";
import { windowIdFromPath, syncPath } from "./route";
import WordPad from "../../apps/wordpad/WordPad";
import MyComputer from "../../apps/my-computer/MyComputer";
import RecycleBin from "../../apps/recycle-bin/RecycleBin";
import Notepad from "../../apps/notepad/Notepad";
import Personal from "../../apps/personal/Personal";
import Documents from "../../apps/documents/Documents";
import Domains from "../../apps/domains/Domains";
import DocViewer from "../../apps/documents/DocViewer";
import EmbeddedApp from "../../apps/embedded/EmbeddedApp";
import ShutDown from "../../apps/system/ShutDown";
import Run from "../../apps/system/Run";
import { resolveRun } from "../../apps/system/runCommand";
import {
  apps,
  embeddedAppIds,
  isDocWindow,
  windowMeta,
  type AppId,
  type WindowId,
} from "../../apps/registry";
import { docs } from "../../docs";
import styles from "./Desktop.module.css";

// Desktop icons down the left edge. Labels differ from window titles (e.g. the
// file name rather than "… - WordPad").
const DESKTOP_ICONS: { id: string; appId: AppId; label: string }[] = [
  { id: "my-computer", appId: "my-computer", label: "My Computer" },
  { id: "recycle-bin", appId: "recycle-bin", label: "Recycle Bin" },
  { id: "wordpad", appId: "wordpad", label: "Document.rtf" },
  { id: "personal-details", appId: "personal-details", label: "personal-details.txt" },
  { id: "personal", appId: "personal", label: "Personal" },
  { id: "documents", appId: "documents", label: "Documents" },
  { id: "domains", appId: "domains", label: "Domains" },
  // Embedded apps (registry `embed` field) get a desktop icon automatically.
  ...embeddedAppIds.map((id) => ({ id, appId: id, label: apps[id].title })),
];

const NOTEPAD_CONTENT = `Hi, I'm Jonas. I'm a software developer based in Oslo, Norway. I'm super passionate about computers, technology, animal rights and tinkering.

I love to use my skills to make people's lives better in whatever ways I can and to build things that do so. If you do too, feel free to reach out at: jonas.jensen@msn.com`;

// Each open window's live state — an app or a document (see WindowId). Position
// is fixed at spawn; the window owns its own dragging after that.
interface WinState {
  id: WindowId;
  x: number;
  y: number;
  z: number;
  minimized: boolean;
  maximized: boolean; // spawn state only — the window owns maximize/restore after that
}

// Renders each built-in app's body, handing it the window controls Desktop
// computes. Embedded apps (registry `embed` field) and documents (docs/<slug>
// window ids) aren't listed here — they're rendered generically in the window
// loop below.
type Renderer = (controls: WindowControls, open: (id: WindowId) => void) => ReactElement;
const renderers: Partial<Record<AppId, Renderer>> = {
  "personal-details": (controls) => <Notepad controls={controls} content={NOTEPAD_CONTENT} />,
  wordpad: (controls) => <WordPad controls={controls} />,
  "my-computer": (controls) => <MyComputer controls={controls} />,
  "recycle-bin": (controls) => <RecycleBin controls={controls} />,
  personal: (controls) => <Personal controls={controls} />,
  documents: (controls, open) => <Documents controls={controls} onOpen={open} />,
  domains: (controls) => <Domains controls={controls} />,
};

// Desktop icons fill 75px cells down the left, wrapping into more columns above
// the taskbar; spawn windows clear of them when the viewport has room, otherwise
// fall back to a top-left cascade.
const ICON_CELL = 75;
function iconColumnsWidth(): number {
  const vh = typeof window !== "undefined" ? window.innerHeight : 768;
  const perColumn = Math.max(1, Math.floor((vh - 28) / ICON_CELL));
  return Math.ceil(DESKTOP_ICONS.length / perColumn) * ICON_CELL;
}
function spawnPosition(index: number, width: number): { x: number; y: number } {
  const offset = (index % 8) * 30;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1024;
  const clearX = iconColumnsWidth() + 8 + offset;
  const x = clearX + width + 16 <= vw ? clearX : 50 + offset;
  return { x, y: offset };
}

// A window whose default frame can't fit the viewport spawns maximized: win95 chrome at 980px on
// a 390px phone is unusable, and a deep-linked builder should land ready to use. Height leaves
// room for the taskbar and a little cascade offset. Desktop-sized viewports are unaffected.
function spawnMaximized({ width, height }: { width: number; height: number }): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth < width + 16 || window.innerHeight < height + 76;
}

export default function Desktop() {
  const topZ = useRef(1);
  const [wins, setWins] = useState<WinState[]>(() => {
    // A /<id> or /docs/<slug> deep link opens straight into that window; otherwise land on Notepad.
    const id = windowIdFromPath() ?? "personal-details";
    const pos = spawnPosition(0, windowMeta(id).defaultSize.width);
    return [
      {
        id,
        x: pos.x,
        y: pos.y,
        z: 1,
        minimized: false,
        maximized: spawnMaximized(windowMeta(id).defaultSize),
      },
    ];
  });
  const [selected, setSelected] = useState<string | null>(null);
  const [startOpen, setStartOpen] = useState(false);
  const [dialog, setDialog] = useState<"run" | "shutdown" | null>(null);
  // Opened with Ctrl+Esc: the Start menu highlights its first entry for the arrow keys.
  const [startKeyboard, setStartKeyboard] = useState(false);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.ctrlKey && event.key === "Escape") {
        event.preventDefault();
        setStartKeyboard(true);
        setStartOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const openApp = useCallback((id: WindowId) => {
    setWins((prev) => {
      topZ.current += 1;
      const existing = prev.find((w) => w.id === id);
      if (existing) {
        return prev.map((w) => (w.id === id ? { ...w, z: topZ.current, minimized: false } : w));
      }
      const pos = spawnPosition(prev.length, windowMeta(id).defaultSize.width);
      return [
        ...prev,
        {
          id,
          x: pos.x,
          y: pos.y,
          z: topZ.current,
          minimized: false,
          maximized: spawnMaximized(windowMeta(id).defaultSize),
        },
      ];
    });
  }, []);

  const closeApp = useCallback((id: WindowId) => {
    setWins((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const focusApp = useCallback((id: WindowId) => {
    setWins((prev) => {
      const w = prev.find((x) => x.id === id);
      if (w && w.z === topZ.current && !w.minimized) return prev;
      topZ.current += 1;
      return prev.map((x) => (x.id === id ? { ...x, z: topZ.current, minimized: false } : x));
    });
  }, []);

  const minimizeApp = useCallback((id: WindowId) => {
    setWins((prev) => prev.map((w) => (w.id === id ? { ...w, minimized: true } : w)));
  }, []);

  // The active window is the topmost (highest z) one that isn't minimized.
  const activeId = useMemo(() => {
    const visible = wins.filter((w) => !w.minimized);
    if (!visible.length) return null;
    return visible.reduce((a, b) => (b.z > a.z ? b : a)).id;
  }, [wins]);

  // Keep the URL in sync with the focused window so it's shareable as /<id> or
  // /docs/<slug>. We skip a plain "/" landing (don't rewrite it to the default
  // Notepad's id); once the user opens or focuses anything, the address bar
  // tracks the active window.
  const routed = useRef(windowIdFromPath() !== null);
  useEffect(() => {
    if (!routed.current) {
      routed.current = true;
      return;
    }
    syncPath(activeId);
  }, [activeId]);

  // Win95 taskbar toggle: clicking the active window minimizes it; any other
  // click restores + raises.
  const onTaskClick = useCallback(
    (id: string) => {
      const appId = id as WindowId;
      setWins((prev) => {
        const w = prev.find((x) => x.id === appId);
        if (!w) return prev;
        if (appId === activeId && !w.minimized) {
          return prev.map((x) => (x.id === appId ? { ...x, minimized: true } : x));
        }
        topZ.current += 1;
        return prev.map((x) => (x.id === appId ? { ...x, z: topZ.current, minimized: false } : x));
      });
    },
    [activeId],
  );

  const startEntries: StartEntry[] = useMemo(
    () => [
      {
        label: "&Programs",
        icon: "/img/win95/programs-32.png",
        submenu: [
          { label: "&WordPad", icon: apps.wordpad.iconSmall, onClick: () => openApp("wordpad") },
          { label: "&Personal", icon: apps.personal.iconSmall, onClick: () => openApp("personal") },
          {
            label: "&Documents",
            icon: apps.documents.iconSmall,
            onClick: () => openApp("documents"),
          },
          { label: "Do&mains", icon: apps.domains.iconSmall, onClick: () => openApp("domains") },
          // Embedded apps (registry `embed` field) get a Programs entry automatically.
          ...embeddedAppIds.map((id) => ({
            label: apps[id].title,
            icon: apps[id].iconSmall,
            onClick: () => openApp(id),
          })),
        ],
      },
      {
        label: "&Documents",
        icon: "/img/win95/documents-32.png",
        submenu: [
          {
            label: "personal-details.txt",
            icon: apps["personal-details"].iconSmall,
            onClick: () => openApp("personal-details"),
          },
          // Every document in content/docs/ is listed automatically.
          ...docs.map((doc) => ({
            label: doc.fileName,
            icon: apps.wordpad.iconSmall,
            onClick: () => openApp(`docs/${doc.slug}` as const),
          })),
        ],
      },
      {
        label: "&Settings",
        icon: "/img/win95/settings-32.png",
        submenu: [{ label: "&Control Panel" }, { label: "&Printers" }],
      },
      {
        label: "&Find",
        icon: "/img/win95/find-32.png",
        submenu: [{ label: "&Files or Folders..." }],
      },
      { label: "&Help", icon: "/img/win95/help-32.png" },
      { label: "&Run...", icon: "/img/win95/run-32.png", onClick: () => setDialog("run") },
      "divider",
      {
        label: "Sh&ut Down...",
        icon: "/img/win95/shutdown-32.png",
        onClick: () => setDialog("shutdown"),
      },
    ],
    [openApp],
  );

  const taskButtons = wins.map((w) => ({
    id: w.id,
    title: windowMeta(w.id).title,
    icon: windowMeta(w.id).iconSmall,
    active: w.id === activeId,
  }));

  return (
    <div
      className={`w95 ${styles.desktop}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setSelected(null);
      }}
    >
      <div className={styles.icons}>
        {DESKTOP_ICONS.map((di) => (
          <DesktopIcon
            key={di.id}
            icon={apps[di.appId].icon}
            label={di.label}
            selected={selected === di.id}
            onSelect={() => setSelected(di.id)}
            onOpen={() => openApp(di.appId)}
          />
        ))}
      </div>

      {wins.map((w) => {
        const controls: WindowControls = {
          initialX: w.x,
          initialY: w.y,
          zIndex: w.z,
          active: w.id === activeId,
          minimized: w.minimized,
          initialMaximized: w.maximized,
          onFocus: () => focusApp(w.id),
          onClose: () => closeApp(w.id),
          onMinimize: () => minimizeApp(w.id),
        };
        return (
          <Fragment key={w.id}>
            {isDocWindow(w.id) ? (
              <DocViewer id={w.id} controls={controls} />
            ) : windowMeta(w.id).embed ? (
              <EmbeddedApp id={w.id} controls={controls} />
            ) : (
              renderers[w.id]?.(controls, openApp)
            )}
          </Fragment>
        );
      })}

      {dialog === "run" && (
        <Run
          onCancel={() => setDialog(null)}
          onRun={(command) => {
            const target = resolveRun(command);
            if (!target) return false;
            if ("url" in target) window.open(target.url, "_blank", "noopener,noreferrer");
            else openApp(target.window);
            return true;
          }}
        />
      )}
      {dialog === "shutdown" && (
        <ShutDown
          onCancel={() => setDialog(null)}
          onLogOff={() => {
            setWins([]);
            setDialog(null);
          }}
        />
      )}

      <TaskBar
        windows={taskButtons}
        onTaskClick={onTaskClick}
        startOpen={startOpen}
        onStartToggle={() => {
          setStartKeyboard(false);
          setStartOpen((v) => !v);
        }}
        onStartClose={() => setStartOpen(false)}
        startMenu={
          <StartMenu
            entries={startEntries}
            keyboard={startKeyboard}
            onClose={() => setStartOpen(false)}
          />
        }
      />
    </div>
  );
}
