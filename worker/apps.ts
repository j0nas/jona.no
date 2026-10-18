/**
 * The embedded apps: separate repos that deploy themselves. The desktop serves each one's
 * live deploy under /apps/<id>/ (worker/index.ts in production, vite.config.ts in dev), so
 * the iframe and a shared /apps/<id>/ link are same-origin with the desktop.
 */
export interface EmbeddedApp {
  /** The live deploy, without a trailing slash. */
  deploy: string;
}

export const APPS: Record<string, EmbeddedApp> = {
  "floor-planner": { deploy: "https://j0nas.github.io/floor-boards-planner" },
};

/**
 * Apps that were embedded here and no longer are. An address (no trailing slash) is the app's
 * new home: old links go there, path kept. null means it has no new home: every old link,
 * deep paths included, goes to this site's home page.
 */
export const MOVED: Record<string, string | null> = {
  "edh-land": "https://edh.land",
  "deck-box": null,
  "laser-deck-box": null,
  // A product of formeriet.no's lamp store now (2026-10-18), friends-only until the store opens.
  "lamp-shade": null,
};
