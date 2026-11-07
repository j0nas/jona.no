import { isWindowId, type WindowId } from "../../apps/registry";

// The desktop is "routed" by the focused window: each app — built-in or
// embedded — is shareable at /<id> (e.g. /floor-planner), and each document at
// /docs/<slug>, which opens the desktop with that window already open. The bare
// embedded builds live at /apps/<id>/ instead, so there's no collision. The home
// page's one address is "/", which is what /internet also opens and becomes.

/** The address a window keeps while it's focused. */
export function pathOf(id: WindowId | null): string {
  return id && id !== "internet" ? `/${id}` : "/";
}

/** The window id encoded in a URL path, or null for "/" or any path that isn't one. */
export function windowIdFromPath(pathname: string = window.location.pathname): WindowId | null {
  const path = pathname.replace(/^\/+|\/+$/g, "");
  return isWindowId(path) ? path : null;
}

/**
 * Reflect the focused window in the address bar (so it's shareable) without growing history. What
 * comes after the path isn't the desktop's: an invite link's fragment, say, may not have been read yet.
 */
export function syncPath(id: WindowId | null): void {
  const next = pathOf(id);
  const { pathname, search, hash } = window.location;
  if (pathname !== next) {
    window.history.replaceState(null, "", `${next}${search}${hash}`);
  }
}
