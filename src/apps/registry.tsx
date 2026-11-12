import { docBySlug } from "../docs";
import { projectBySlug } from "../projects";
import { CV_DOCS } from "./word/downloads/files";

// App metadata. Icons are the authentic Win95 icon bitmaps (16-colour shell
// icons) in public/img/win95 — `icon` is the 32px size for the desktop and
// Start menu, `iconSmall` the 16px size for title bars and taskbar buttons.
interface AppMeta {
  icon: string;
  iconSmall: string;
  title: string;
  defaultSize: { width: number; height: number };
  // Opens as tall as the viewport allows, down to the taskbar, however short defaultSize is.
  tall?: boolean;
  // Set for an *embedded* app: a standalone web app in its own repo that deploys
  // itself, served here by a same-origin proxy to that live deploy (see the
  // /apps/<id>/ rule in netlify.toml). The value is the path the hosting <iframe>
  // points at; presence of this field is what makes the desktop render the app
  // via EmbeddedApp and auto-surface it as an icon + Start entry.
  embed?: string;
}

export const apps = {
  internet: {
    icon: "/img/win95/internet-32.png",
    iconSmall: "/img/win95/internet-16.png",
    title: "Jonas's Home Page - Microsoft Internet Explorer",
    defaultSize: { width: 760, height: 560 },
  },
  // The CV, in English at /cv and in Norwegian at /cv/no: two files, each in a Word window of its own.
  cv: {
    icon: "/img/cv/worddoc-32.png",
    iconSmall: "/img/cv/word-16.png",
    title: `${CV_DOCS.en} - Microsoft Word`,
    defaultSize: { width: 1100, height: 720 },
    tall: true,
  },
  "cv/no": {
    icon: "/img/cv/worddoc-32.png",
    iconSmall: "/img/cv/word-16.png",
    title: `${CV_DOCS.no} - Microsoft Word`,
    defaultSize: { width: 1100, height: 720 },
    tall: true,
  },
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
  // The Projects folder (content/projects/): a web-view folder whose icons open each project's window.
  project: {
    icon: "/img/win95/folder-32.png",
    iconSmall: "/img/win95/folder-16.png",
    title: "Projects",
    defaultSize: { width: 860, height: 600 },
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
// A *project* window shows one project from content/projects/ (see src/projects) in a
// read-only WordPad, opened from the Projects folder. Its id is its route too: /project/<slug>.
export type ProjectWindowId = `project/${string}`;
export type WindowId = AppId | DocWindowId | ProjectWindowId;

export function isDocWindow(id: string): id is DocWindowId {
  return id.startsWith("docs/");
}

export function docSlug(id: DocWindowId): string {
  return id.slice("docs/".length);
}

export function isProjectWindow(id: string): id is ProjectWindowId {
  return id.startsWith("project/");
}

export function projectSlug(id: ProjectWindowId): string {
  return id.slice("project/".length);
}

export function isWindowId(id: string): id is WindowId {
  if (isDocWindow(id)) return docBySlug.has(docSlug(id));
  if (isProjectWindow(id)) return projectBySlug.has(projectSlug(id));
  return id in apps;
}

const DOC_WINDOW_SIZE = { width: 780, height: 580 };

const PROJECT_WINDOW_SIZE = { width: 760, height: 620 };

/** Metadata for any window — a registered app, a document or a project. */
export function windowMeta(id: WindowId): AppMeta {
  if (isProjectWindow(id)) {
    const project = projectBySlug.get(projectSlug(id));
    return {
      icon: apps.wordpad.icon,
      iconSmall: apps.wordpad.iconSmall,
      // Explorer hides the extension of a registered file type, as WordPad's title does then.
      title: `${project?.title ?? id} - WordPad`,
      defaultSize: PROJECT_WINDOW_SIZE,
      tall: true,
    };
  }
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
