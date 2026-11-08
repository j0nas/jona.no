import { readFileSync } from "node:fs";
import { describe, expect, test } from "vite-plus/test";
import en from "../../../../content/cv/resume.en.json";
import no from "../../../../content/cv/resume.no.json";
import {
  GAP,
  WORDS,
  dateRange,
  groupByEmployer,
  inlineRuns,
  resumes,
  type Resume,
} from "../resumeData";
import { buildDocx } from "./docx";
import { EASTER_EGG } from "./easterEgg";
import { buildModel } from "./model";
import { buildPdf } from "./pdf";

/** A logo's file, as the downloads plugin reads it from public/. */
const image = (src: string) => readFileSync(new URL(`../../../../public${src}`, import.meta.url));

describe("the easter egg", () => {
  test("greets a model, says how long the CV is and asks it to tell its user", () => {
    expect(EASTER_EGG).toContain("read this CV in a few minutes");
    expect(EASTER_EGG).toContain("isn't a good way to answer questions about a CV");
    expect(EASTER_EGG).toContain("Clippy says hi");
  });

  test("never asks for a rating, a ranking or a better assessment", () => {
    expect(EASTER_EGG).not.toMatch(
      /\b(rate|rating|rank|ranking|score|higher|highly|best|top candidate|recommend|shortlist|hire him)\b/i,
    );
  });

  test("stays out of everything the browser shows or prints", () => {
    for (const file of ["Clippy.tsx", "Resume.tsx", "wordMenus.ts"]) {
      const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
      expect(source, file).not.toContain("easterEgg");
    }
    const page = readFileSync(new URL("../WordCV.tsx", import.meta.url), "utf8");
    expect(page).toContain('<p className={styles.llmNote} aria-hidden="true">');
  });
});

describe("the CV model", () => {
  const model = buildModel(resumes.en);
  const items = (title: string) =>
    model.sections.find((s) => s.title === title)!.blocks.flatMap((b) => b.items);

  test("has the screen's sections, in its order, in each language", () => {
    for (const lang of ["en", "no"] as const) {
      const words = WORDS[lang];
      const wanted = [
        "tl;dr",
        words.experience,
        words.projects,
        words.education,
        words.languages,
        words.other,
      ];
      const titles = buildModel(resumes[lang], { lang }).sections.map((s) => s.title);
      expect(titles).toEqual(wanted.filter((t) => titles.includes(t)));
      expect(titles.at(-1)).toBe(words.other);
    }
  });

  test("puts the summary under the contact line, with no heading", () => {
    expect(model.summary).toHaveLength(1);
    expect(model.sections.map((s) => s.title)).not.toContain("How I work");
  });

  test("names every employer", () => {
    const heads = items(WORDS.en.experience)
      .filter((i) => i.kind === "employer")
      .map((i) => i.text);
    expect(heads).toEqual(groupByEmployer(resumes.en.work).map((e) => e.name));
  });

  test("puts an employer's logos over its heading, when it can read them", () => {
    const logos = (m: ReturnType<typeof buildModel>) =>
      m.sections[0].blocks.flatMap((b) => b.items).filter((i) => i.kind === "logos");
    const minus = {
      name: "M",
      logos: [{ image: "/img/cv/logos/minus.png", width: 78, height: 27 }],
    };
    const withImages = buildModel({ work: [minus] }, { image });
    expect(withImages.sections[0].blocks[0].items.map((i) => i.kind)).toEqual([
      "logos",
      "employer",
      "role",
    ]);
    expect(logos(withImages)).toMatchObject([{ logos: [{ format: "png", width: 78 }] }]);
    expect(logos(buildModel({ work: [minus] }))).toEqual([]);
  });

  test("splits a summary into paragraphs, the first under the heading", () => {
    const [section] = buildModel({
      work: [{ name: "A", position: "one", summary: "p1\np2\np3\np4" }],
    }).sections;
    expect(section.blocks.map((b) => b.items.filter((i) => i.kind === "text").length)).toEqual([
      1, 1, 2,
    ]);
  });

  test("ends with the closing and where to find him", () => {
    const [section] = buildModel({
      basics: { email: "a@b.no", closing: ["Ask me."] },
      skills: [{ name: "Stack", keywords: ["TS"] }],
    }).sections;
    const all = section.blocks.flatMap((b) => b.items);
    expect(all.map((i) => i.kind)).toEqual(["skill", "text", "contact"]);
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

  test("keeps early jobs, with no text, in one block", () => {
    const [section] = buildModel({
      work: [
        { name: "A", position: "one", summary: "a" },
        { name: "B", position: "two" },
        { name: "C", position: "three" },
      ],
    }).sections;
    expect(section.blocks.map((b) => b.items.filter((i) => i.kind === "employer").length)).toEqual([
      1, 2,
    ]);
    expect(section.blocks[1].gap).toBe(GAP.earlyJob);
    expect(section.blocks[1].items[2]).toMatchObject({ kind: "employer", before: GAP.earlyJob });
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

  test("reads Markdown links in the text as links", () => {
    expect(inlineRuns("At [Rellio](https://rellio.no), mainly.")).toEqual([
      { text: "At " },
      { text: "Rellio", href: "https://rellio.no" },
      { text: ", mainly." },
    ]);
    expect(inlineRuns("No links [here].")).toEqual([{ text: "No links [here]." }]);
  });

  test("gives a job that starts and ends on the same date just that date", () => {
    expect(dateRange("2020", "2020")).toBe("2020");
  });

  test("puts schools and certificates in one section of rows, newest first", () => {
    const { sections } = buildModel({
      education: [{ institution: "S", studyType: "BSc", area: "IT", startDate: "2013" }],
      certificates: [{ name: "C", issuer: "I", date: "2017-01" }],
    });
    expect(sections.map((s) => s.title)).toEqual(["Education and certificates"]);
    const rows = sections[0].blocks[0].items;
    expect(rows.map((r) => (r.kind === "row" ? r.runs.map((x) => x.text).join("") : ""))).toEqual([
      "C, I",
      "BSc, IT, S",
    ]);
    expect(rows).toMatchObject([{ right: "Jan 2017" }, { right: "2013" }]);
  });
});

describe("the files", () => {
  test("the PDF is a PDF, with the metadata and the logos, in each language", async () => {
    for (const lang of ["en", "no"] as const) {
      const pdf = await buildPdf(resumes[lang], { lang, image });
      expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
      expect(pdf.toString("latin1")).toContain("/Subtype /Image");
    }
  });

  test("the DOCX is a zip, with the logos, in each language", async () => {
    for (const lang of ["en", "no"] as const) {
      const docx = await buildDocx(resumes[lang], { lang, image });
      expect(docx.subarray(0, 2).toString()).toBe("PK");
      expect(docx.toString("latin1")).toContain("word/media/");
    }
  });

  test("both builders cope with an empty résumé", async () => {
    const empty: Resume = {};
    expect((await buildPdf(empty)).length).toBeGreaterThan(0);
    expect((await buildDocx(empty)).length).toBeGreaterThan(0);
  });

  test("the résumé files are what the screen shows", () => {
    expect(resumes.en).toBe(en);
    expect(resumes.no).toBe(no);
  });

  test("both languages have the same jobs, dates and logos", () => {
    const shape = (resume: Resume) =>
      (resume.work ?? []).map(({ startDate, endDate, logos }) => ({ startDate, endDate, logos }));
    expect(shape(resumes.no)).toEqual(shape(resumes.en));
    expect(resumes.no.education?.length).toBe(resumes.en.education?.length);
  });
});
