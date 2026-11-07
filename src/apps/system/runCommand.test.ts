import { describe, expect, test } from "vite-plus/test";
import { resolveRun } from "./runCommand";

describe("Start › Run", () => {
  test("opens programs by their Win95 name, id or title", () => {
    expect(resolveRun("NOTEPAD.EXE")).toEqual({ window: "personal-details" });
    expect(resolveRun("write")).toEqual({ window: "wordpad" });
    expect(resolveRun("floor-planner")).toEqual({ window: "floor-planner" });
    expect(resolveRun("Floor Planner")).toEqual({ window: "floor-planner" });
    expect(resolveRun("IEXPLORE.EXE")).toEqual({ window: "internet" });
    expect(resolveRun("winword")).toEqual({ window: "cv" });
  });

  test("opens web addresses", () => {
    expect(resolveRun("https://example.com/a")).toEqual({ url: "https://example.com/a" });
    expect(resolveRun("example.com")).toEqual({ url: "https://example.com" });
  });

  test("finds nothing for anything else", () => {
    expect(resolveRun("format c:")).toBeNull();
    expect(resolveRun("  ")).toBeNull();
  });
});
