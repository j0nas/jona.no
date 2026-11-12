import { docs } from "../../docs";
import { apps, type AppId, type WindowId } from "../registry";

// Names Win95 users would type for the built-in apps.
const ALIASES: Record<string, AppId> = {
  notepad: "personal-details",
  wordpad: "wordpad",
  write: "wordpad",
  explorer: "my-computer",
  "my computer": "my-computer",
  "recycle bin": "recycle-bin",
  recycled: "recycle-bin",
  iexplore: "internet",
  "the internet": "internet",
  winword: "cv",
  word: "cv",
  projects: "project",
};

export type RunTarget = { window: WindowId } | { url: string };

/**
 * What Start › Run opens for a command: a program by its Win95 name, id or title
 * ("notepad", "floor-planner", "Floor Planner"), a document by slug or file name,
 * or a web address. Null when nothing matches.
 */
export function resolveRun(command: string): RunTarget | null {
  const name = command
    .trim()
    .toLowerCase()
    .replace(/\.exe$/, "");
  if (!name) return null;
  if (name in ALIASES) return { window: ALIASES[name] };
  for (const [id, meta] of Object.entries(apps) as [AppId, (typeof apps)[AppId]][]) {
    if (name === id || name === meta.title.toLowerCase()) return { window: id };
  }
  const doc = docs.find((d) => name === d.slug || name === d.fileName.toLowerCase());
  if (doc) return { window: `docs/${doc.slug}` };
  if (/^https?:\/\/\S+$/.test(name)) return { url: command.trim() };
  if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(name)) return { url: `https://${command.trim()}` };
  return null;
}
