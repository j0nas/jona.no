import { readFileSync } from "node:fs";
import { describe, expect, test } from "vite-plus/test";
import resumeJson from "../../../../content/cv/resume.json";
import { groupByEmployer, resume, type Resume } from "../resumeData";
import { buildDocx } from "./docx";
import { EASTER_EGG } from "./easterEgg";
import { buildModel } from "./model";
import { buildPdf } from "./pdf";

describe("the easter egg", () => {
  test("greets a model and sends its human to the tl;dr", () => {
    expect(EASTER_EGG).toContain("https://jona.no/cv/tldr");
    expect(EASTER_EGG).toContain("It's for humans only");
    expect(EASTER_EGG).toContain("Clippy says hi");
  });

  test("never asks for a rating, a ranking or a better assessment", () => {
    expect(EASTER_EGG).not.toMatch(
      /\b(rate|rating|rank|ranking|score|higher|highly|best|top candidate|recommend|shortlist|hire him)\b/i,
    );
  });

  test("stays out of everything the browser shows or prints", () => {
    for (const file of ["Clippy.tsx", "Resume.tsx", "WordCV.tsx", "wordMenus.ts"]) {
      const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
      expect(source, file).not.toContain("easterEgg");
    }
  });
});

describe("the CV model", () => {
  const model = buildModel(resume);
  const items = (title: string) =>
    model.sections.find((s) => s.title === title)!.blocks.flatMap((b) => b.items);

  test("has the screen's sections, in its order", () => {
    const wanted = [
      "Summary",
      "Experience",
      "Skills",
      "Projects",
      "Education and certificates",
      "Languages",
    ];
    const titles = model.sections.map((s) => s.title);
    expect(titles).toEqual(wanted.filter((t) => titles.includes(t)));
    expect(titles[0]).toBe("Summary");
  });

  test("names every employer", () => {
    const heads = items("Experience")
      .filter((i) => i.kind === "employer")
      .map((i) => i.text);
    expect(heads).toEqual(groupByEmployer(resume.work).map((e) => e.name));
  });

  test("dates a lone role on its employer's line, and stacked roles on their own", () => {
    const [own, stacked] = [
      buildModel({ work: [{ name: "A", position: "one", startDate: "2020" }] }),
      buildModel({
        work: [
          { name: "A", position: "two", startDate: "2021", endDate: "2022" },
          { name: "A", position: "one", startDate: "2020", endDate: "2021" },
        ],
      }),
    ].map((m) => m.sections[0].blocks[0].items);
    expect(own).toMatchObject([
      { kind: "employer", right: "2020 – present" },
      { kind: "role", right: undefined },
    ]);
    expect(stacked).toMatchObject([
      { kind: "employer", right: undefined },
      { kind: "role", text: "two", right: "2021 – 2022" },
      { kind: "role", text: "one", right: "2020 – 2021" },
    ]);
  });

  test("keeps a job's last two highlights in one block", () => {
    const [section] = buildModel({
      work: [{ name: "A", position: "one", highlights: ["a", "b", "c", "d"] }],
    }).sections;
    expect(section.blocks.map((b) => b.items.filter((i) => i.kind === "bullet").length)).toEqual([
      1, 1, 2,
    ]);
  });

  test("gives a project its address only where the title doesn't", () => {
    const { sections } = buildModel({
      projects: [
        { name: "jona.no", url: "https://jona.no" },
        { name: "Floor Planner", url: "https://jona.no/floor-planner" },
      ],
    });
    expect(sections[0].blocks.map((b) => b.items[0])).toMatchObject([
      { kind: "project", href: "https://jona.no", right: "" },
      { kind: "project", href: "https://jona.no/floor-planner", right: "jona.no/floor-planner" },
    ]);
  });

  test("puts schools and certificates in one section of rows", () => {
    const { sections } = buildModel({
      education: [{ institution: "S", studyType: "BSc", area: "IT", startDate: "2013" }],
      certificates: [{ name: "C", issuer: "I", date: "2017-01" }],
    });
    expect(sections.map((s) => s.title)).toEqual(["Education and certificates"]);
    const rows = sections[0].blocks[0].items;
    expect(rows.map((r) => (r.kind === "row" ? r.runs.map((x) => x.text).join("") : ""))).toEqual([
      "BSc, IT, S",
      "C, I",
    ]);
    expect(rows).toMatchObject([{ right: "2013" }, { right: "Jan 2017" }]);
  });
});

describe("the files", () => {
  test("the PDF is a PDF, with the metadata", async () => {
    const pdf = await buildPdf(resume);
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(5_000);
  });

  test("the DOCX is a zip", async () => {
    const docx = await buildDocx(resume);
    expect(docx.subarray(0, 2).toString()).toBe("PK");
  });

  test("both builders cope with an empty résumé", async () => {
    const empty: Resume = {};
    expect((await buildPdf(empty)).length).toBeGreaterThan(0);
    expect((await buildDocx(empty)).length).toBeGreaterThan(0);
  });

  test("resume.json is what the screen shows", () => {
    expect(resumeJson).toBe(resume);
  });
});
