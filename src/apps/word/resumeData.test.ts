import { describe, expect, test } from "vite-plus/test";
import {
  dateRange,
  displayUrl,
  footerLabel,
  formatDate,
  formatLocation,
  groupByEmployer,
  highlightGroups,
  languageList,
  paginate,
  projectRight,
  schoolStudy,
} from "./resumeData";

describe("resume dates", () => {
  test("reads every precision JSON Resume allows", () => {
    expect(formatDate("2022-08-15")).toBe("Aug 2022");
    expect(formatDate("2022-08")).toBe("Aug 2022");
    expect(formatDate("2022")).toBe("2022");
  });

  test("a job with no end is still going; anything else just started then", () => {
    expect(dateRange("2022-08")).toBe("Aug 2022 – present");
    expect(dateRange("2014-06", undefined, false)).toBe("Jun 2014");
    expect(dateRange("2013", "2016")).toBe("2013 – 2016");
    expect(dateRange(undefined, "2016")).toBe("2016");
    expect(dateRange()).toBe("");
  });
});

describe("resume text", () => {
  test("URLs read without their scheme", () => {
    expect(displayUrl("https://www.linkedin.com/in/j0nas/")).toBe("linkedin.com/in/j0nas");
    expect(displayUrl("https://jona.no")).toBe("jona.no");
  });

  test("a location doesn't repeat a region that is its city", () => {
    expect(formatLocation({ city: "Oslo", region: "Oslo", countryCode: "NO" })).toBe(
      "Oslo, Norway",
    );
    expect(formatLocation({ city: "Oslo" })).toBe("Oslo");
    expect(formatLocation()).toBe("");
  });

  test("a project's address shows beside its title, unless the title is the address", () => {
    expect(projectRight({ name: "Floor Planner", url: "https://jona.no/floor-planner" })).toBe(
      "jona.no/floor-planner",
    );
    expect(projectRight({ name: "jona.no", url: "https://jona.no" })).toBe("");
    expect(projectRight({ name: "Old", startDate: "2014" })).toBe("2014");
    expect(projectRight({ name: "Old", url: "https://a.no", startDate: "2014" })).toBe(
      "a.no  ·  2014",
    );
  });

  test("a school's study doesn't say its type twice", () => {
    expect(schoolStudy({ studyType: "Bachelor's degree", area: "IT" })).toBe(
      "Bachelor's degree, IT",
    );
    expect(schoolStudy({ studyType: "Bachelor", area: "Bachelor in IT" })).toBe("Bachelor in IT");
    expect(schoolStudy({})).toBe("");
  });

  test("languages share a line, with their fluency if they have one", () => {
    expect(
      languageList([{ language: "English", fluency: "native" }, { language: "Russian" }]),
    ).toBe("English (native), Russian");
    expect(languageList()).toBe("");
  });

  test("the footer names the document", () => {
    expect(footerLabel("Jonas Jensen")).toBe("Jonas Jensen · CV");
    expect(footerLabel()).toBe("CV");
  });
});

describe("groupByEmployer", () => {
  test("merges consecutive roles at a company under one heading", () => {
    const groups = groupByEmployer([
      { name: "A", position: "one" },
      { name: "B", position: "two" },
      { name: "B", position: "three" },
      { name: "A", position: "four" },
    ]);
    expect(groups.map((g) => g.name)).toEqual(["A", "B", "A"]);
    expect(groups[1].roles.map((r) => r.position)).toEqual(["two", "three"]);
  });

  test("collects the text of all a company's roles", () => {
    const [group] = groupByEmployer([
      { name: "A", summary: "first", highlights: ["x", "y"] },
      { name: "A" },
      { name: "A", summary: "last", highlights: ["z"] },
    ]);
    expect(group.summaries).toEqual(["first", "last"]);
    expect(group.highlights).toEqual(["x", "y", "z"]);
  });

  test("copes with no work at all", () => {
    expect(groupByEmployer()).toEqual([]);
  });
});

describe("highlightGroups", () => {
  const groups = (highlights: string[], summaries: string[] = []) =>
    highlightGroups({ summaries, highlights });

  test("keeps the last two together, and the first with a heading that has nothing else", () => {
    expect(groups(["a", "b", "c", "d"])).toEqual({ head: ["a"], rest: [["b"], ["c", "d"]] });
    expect(groups(["a", "b"])).toEqual({ head: ["a", "b"], rest: [] });
    expect(groups([])).toEqual({ head: [], rest: [] });
  });

  test("lets a summary keep the heading company", () => {
    expect(groups(["a", "b", "c"], ["s"])).toEqual({ head: [], rest: [["a"], ["b", "c"]] });
    expect(groups(["a", "b"], ["s"])).toEqual({ head: [], rest: [["a", "b"]] });
  });

  test("never leaves a lone highlight to start a page", () => {
    expect(groups(["a"], ["s"])).toEqual({ head: ["a"], rest: [] });
  });
});

describe("paginate", () => {
  test("starts a new page when the next block won't fit", () => {
    expect(paginate([40, 40, 40], 100)).toEqual([[0, 1], [2]]);
  });

  test("gives an oversized block a page of its own", () => {
    expect(paginate([10, 500, 10], 100)).toEqual([[0], [1], [2]]);
  });

  test("always has a first page", () => {
    expect(paginate([], 100)).toEqual([[]]);
  });

  test("counts the gap above a block, unless it's first on the page", () => {
    expect(paginate([40, 40], 100, [0, 30])).toEqual([[0], [1]]);
    expect(paginate([60, 80, 20], 100, [0, 30, 0])).toEqual([[0], [1, 2]]);
    expect(paginate([80, 15], 100, [50, 5])).toEqual([[0, 1]]);
  });
});
