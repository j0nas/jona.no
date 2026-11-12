import { afterEach, describe, expect, test, vi } from "vite-plus/test";
import { pathOf, syncPath, windowIdFromPath } from "./route";

function at(url: string) {
  const { pathname, search, hash } = new URL(url, "https://jona.no");
  const replaceState = vi.fn();
  vi.stubGlobal("window", { location: { pathname, search, hash }, history: { replaceState } });
  return replaceState;
}

afterEach(() => vi.unstubAllGlobals());

describe("the address of a window", () => {
  test("a window has its id, and a document its folder too", () => {
    expect(pathOf("cv")).toBe("/cv");
    expect(pathOf("docs/hello")).toBe("/docs/hello");
    expect(pathOf("project/edh-land")).toBe("/project/edh-land");
  });

  test("a project opens from its address, and only a project that exists", () => {
    expect(windowIdFromPath("/project")).toBe("project");
    expect(windowIdFromPath("/project/edh-land/")).toBe("project/edh-land");
    expect(windowIdFromPath("/project/nothing-here")).toBeNull();
  });

  test("the home page has one address, whichever way it was opened", () => {
    expect(pathOf("internet")).toBe("/");
    expect(pathOf(null)).toBe("/");
    expect(windowIdFromPath("/internet")).toBe("internet");
    expect(windowIdFromPath("/")).toBeNull();
    const replaceState = at("/internet");
    syncPath("internet");
    expect(replaceState).toHaveBeenCalledWith(null, "", "/");
  });

  test("stays as it is when it's right", () => {
    const replaceState = at("/cv?x=1#y");
    syncPath("cv");
    expect(replaceState).not.toHaveBeenCalled();
  });
});

describe("rewriting the address", () => {
  test("keeps an invite link's fragment, which may not have been read yet", () => {
    const replaceState = at("/cv/#touchup=tui_abc");
    syncPath("cv");
    expect(replaceState).toHaveBeenCalledWith(null, "", "/cv#touchup=tui_abc");
  });

  test("keeps the query", () => {
    const replaceState = at("/cv/?from=mail#top");
    syncPath("wordpad");
    expect(replaceState).toHaveBeenCalledWith(null, "", "/wordpad?from=mail#top");
  });

  test("a trailing slash is read as the same window", () => {
    expect(windowIdFromPath("/cv/")).toBe("cv");
  });
});
