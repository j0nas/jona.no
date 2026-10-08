import { docBySlug } from "../docs";

// App metadata. Icons are the authentic Win95 icon bitmaps (16-colour shell
// icons) in public/img/win95 — `icon` is the 32px size for the desktop and
// Start menu, `iconSmall` the 16px size for title bars and taskbar buttons.
interface AppMeta {
  icon: string;
  iconSmall: string;
  title: string;
  defaultSize: { width: number; height: number };
  // Set for an *embedded* app: a standalone web app in its own repo that deploys
  // itself, served here by a same-origin proxy to that live deploy (see the
  // /apps/<id>/ rule in netlify.toml). The value is the path the hosting <iframe>
  // points at; presence of this field is what makes the desktop render the app
  // via EmbeddedApp and auto-surface it as an icon + Start entry.
  embed?: string;
}

export const apps = {
  wordpad: {
    icon: "/img/win95/wordpad-32.png",
    iconSmall: "/img/win95/wordpad-16.png",
    title: "Document.rtf - WordPad",
    defaultSize: { width: 500, height: 350 },
  },
  "my-computer": {
    icon: "/img/win95/computer-32.png",
    iconSmall: "/img/win95/computer-16.png",
    title: "My Computer",
    defaultSize: { width: 600, height: 400 },
  },
  "recycle-bin": {
    icon: "/img/win95/recycle-32.png",
    iconSmall: "/img/win95/recycle-16.png",
    title: "Recycle Bin",
    defaultSize: { width: 400, height: 300 },
  },
  "personal-details": {
    icon: "/img/win95/notepad-32.png",
    iconSmall: "/img/win95/notepad-16.png",
    title: "personal-details.txt - Notepad",
    defaultSize: { width: 480, height: 420 },
  },
  personal: {
    icon: "/img/win95/folder-32.png",
    iconSmall: "/img/win95/folder-16.png",
    title: "Personal",
    defaultSize: { width: 400, height: 300 },
  },
  documents: {
    icon: "/img/win95/folder-32.png",
    iconSmall: "/img/win95/folder-16.png",
    title: "Documents",
    defaultSize: { width: 400, height: 300 },
  },
  domains: {
    icon: "/img/win95/folder-32.png",
    iconSmall: "/img/win95/folder-16.png",
    title: "Domains",
    defaultSize: { width: 480, height: 300 },
  },
  "floor-planner": {
    icon: "/img/apps/floor-planner.svg",
    iconSmall: "/img/apps/floor-planner.svg",
    title: "Floor Planner",
    defaultSize: { width: 940, height: 660 },
    embed: "/apps/floor-planner/",
  },
  "deck-box": {
    icon: "/img/apps/deck-box.svg",
    iconSmall: "/img/apps/deck-box.svg",
    title: "Deck Box Builder",
    defaultSize: { width: 980, height: 680 },
    embed: "/apps/deck-box/",
  },
  "laser-deck-box": {
    icon: "/img/apps/laser-deck-box.svg",
    iconSmall: "/img/apps/laser-deck-box.svg",
    title: "Laser Deck Box",
    defaultSize: { width: 980, height: 680 },
    embed: "/apps/laser-deck-box/",
  },
  "lamp-shade": {
    icon: "/img/apps/lamp-shade.svg",
    iconSmall: "/img/apps/lamp-shade.svg",
    title: "Lamp Shade Designer",
    defaultSize: { width: 1040, height: 720 },
    embed: "/apps/lamp-shade/",
  },
} satisfies Record<string, AppMeta>;

export type AppId = keyof typeof apps;

// `apps` is declared with `satisfies` so its keys stay literal (for AppId); that
// also narrows each value to its own literal type, hiding optional fields like
// `embed`. Go through this accessor when you need the full AppMeta shape.
export function appMeta(id: AppId): AppMeta {
  return apps[id];
}

/** Ids of embedded apps (separate self-deploying apps shown via a proxied iframe). */
export const embeddedAppIds = (Object.keys(apps) as AppId[]).filter((id) => appMeta(id).embed);

// A *document* window shows one markdown file from content/docs/ (see
// src/docs). Its id doubles as its route: /docs/<slug>. Documents aren't apps —
// they're data, so they don't get registry entries; windowMeta() synthesises
// their metadata (a read-only WordPad) from the docs index instead.
export type DocWindowId = `docs/${string}`;
export type WindowId = AppId | DocWindowId;

export function isDocWindow(id: string): id is DocWindowId {
  return id.startsWith("docs/");
}

export function docSlug(id: DocWindowId): string {
  return id.slice("docs/".length);
}

export function isWindowId(id: string): id is WindowId {
  return isDocWindow(id) ? docBySlug.has(docSlug(id)) : id in apps;
}

const DOC_WINDOW_SIZE = { width: 780, height: 580 };

/** Metadata for any window — a registered app or a document. */
export function windowMeta(id: WindowId): AppMeta {
  if (isDocWindow(id)) {
    const doc = docBySlug.get(docSlug(id));
    return {
      icon: apps.wordpad.icon,
      iconSmall: apps.wordpad.iconSmall,
      title: `${doc?.fileName ?? id} - WordPad`,
      defaultSize: DOC_WINDOW_SIZE,
    };
  }
  return appMeta(id);
}
