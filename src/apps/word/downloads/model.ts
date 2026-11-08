import {
  GAP,
  credentials,
  dateRange,
  displayUrl,
  footerLabel,
  formatBirthDate,
  formatDate,
  formatLocation,
  groupByEmployer,
  inlineRuns,
  isEarly,
  languageList,
  paragraphs,
  projectRight,
  schoolStudy,
  telHref,
  textGroups,
  WORDS,
  type Inline,
  type Lang,
  type Resume,
} from "../resumeData";

// The CV as lists of lines, for the PDF and DOCX builders. What each line says, and which lines stay
// together on a page, is decided here, once, from the same helpers the on-screen document
// (Resume.tsx) uses; how it looks is up to the builder.

export type { Inline };

/** A logo's file and its size in points. */
export interface LogoImage {
  data: Uint8Array;
  format: "png" | "jpg";
  width: number;
  height: number;
}

/** A line of a block, `before` points below the line above it there. */
export type Item = { before?: number } & (
  | /** An employer's logos, side by side over its heading. */
    { kind: "logos"; logos: LogoImage[] }
  /** An employer: bold sans, with its dates flush right when it had just the one role. */
  | { kind: "employer"; text: string; href?: string; right?: string }
  /** A role at an employer: bold italic, with its dates flush right when it's one of several. */
  | { kind: "role"; text: string; right?: string; after: number }
  /** A project: smaller bold sans, with its address flush right unless the title is that. */
  | { kind: "project"; text: string; href?: string; right?: string }
  /** A line of body text. */
  | { kind: "text"; runs: Inline[] }
  /** A line of body text with its dates flush right: a school or a certificate. */
  | { kind: "row"; runs: Inline[]; right?: string }
  /** A row of the skills, set a little tighter. */
  | { kind: "skill"; runs: Inline[] }
  /** A row of the tl;dr: a small bold sans label, and what it says beside it. */
  | { kind: "fact"; label: string; runs: Inline[] }
  /** A small italic line. */
  | { kind: "note"; text: string }
  /** Where to find him, again at the end: small sans, as under his name. */
  | { kind: "contact"; runs: Inline[] }
  | { kind: "bullet"; runs: Inline[] }
);

/** Lines that stay whole on a page, and the points of space above them. */
export interface Block {
  gap: number;
  items: Item[];
}

export interface Section {
  title: string;
  /** The heading is glued to the first, whose `gap` doesn't count: the heading has its own. */
  blocks: Block[];
}

export interface CvModel {
  name?: string;
  /** His date of birth, as the language writes it, beside his name. */
  born?: string;
  label?: string;
  contact: Inline[];
  /** Its paragraphs, under the contact line, with no heading. */
  summary: Inline[][];
  footer: string;
  sections: Section[];
}

export interface ModelOptions {
  lang?: Lang;
  /** A logo's file, from its address on the site. Without it, there are no logos. */
  image?: (src: string) => Uint8Array;
}

const plain = inlineRuns;
const link = (href: string): Inline[] => [{ text: displayUrl(href), href }];

/** Bullets, the first of them `first` points below whatever comes before them in their block. */
function bullets(texts: string[] = [], first = 0): Item[] {
  return texts.map((text, i) => ({
    kind: "bullet",
    runs: plain(text),
    before: i ? GAP.bullet : first,
  }));
}

/** "Thing, its source", the source a link if it has an address. */
function pair(first?: string, second?: string, href?: string): Inline[] {
  const runs: Inline[] = [];
  if (first) runs.push({ text: first });
  if (first && second) runs.push({ text: ", " });
  if (second) runs.push({ text: second, href });
  return runs;
}

export function buildModel(resume: Resume, { lang = "en", image }: ModelOptions = {}): CvModel {
  const { basics } = resume;
  const words = WORDS[lang];
  const contact: Inline[] = [];
  const location = formatLocation(basics?.location, lang);
  if (location) contact.push({ text: location });
  if (basics?.email) contact.push({ text: basics.email, href: `mailto:${basics.email}` });
  if (basics?.url) contact.push(...link(basics.url));
  for (const profile of basics?.profiles ?? []) {
    if (profile.url) contact.push(...link(profile.url));
    else if (profile.username) contact.push({ text: `${profile.network}: ${profile.username}` });
  }
  if (basics?.phone) contact.push({ text: basics.phone, href: telHref(basics.phone) });

  const sections: Section[] = [];
  const add = (title: string, blocks: Block[]) => {
    if (blocks.length) sections.push({ title, blocks });
  };

  if (basics?.tldr?.length) {
    const items = basics.tldr.map(({ label, text }, i): Item => ({
      kind: "fact",
      label: label ?? "",
      runs: plain(text ?? ""),
      before: i ? 2 : 0,
    }));
    add("tl;dr", [{ gap: 0, items }]);
  }

  const work: Block[] = [];
  let earlier = false;
  for (const employer of groupByEmployer(resume.work)) {
    const early = isEarly(employer);
    const only = employer.roles.length === 1 ? employer.roles[0] : undefined;
    const pieces: Item[] = [
      ...employer.summaries
        .flatMap(paragraphs)
        .map((text): Item => ({ kind: "text", runs: plain(text) })),
      ...bullets(employer.highlights),
    ];
    // Within a group, a paragraph or a bullet is 4 points below the one before it.
    const spaced = (group: Item[]) =>
      group.map((item, i): Item => ({ ...item, before: i ? GAP.bullet : 0 }));
    const { head, rest } = textGroups(pieces);
    const logos = image
      ? employer.logos.map((logo): LogoImage => ({
          data: image(logo.image!),
          format: /\.png$/i.test(logo.image!) ? "png" : "jpg",
          width: logo.width ?? 0,
          height: logo.height ?? 0,
        }))
      : [];
    const items: Item[] = [
      ...(logos.length ? [{ kind: "logos", logos } as const] : []),
      {
        kind: "employer",
        text: employer.name ?? "",
        href: employer.url,
        right: only && dateRange(only.startDate, only.endDate, true, lang),
        before: logos.length ? 6 : 0,
      },
      ...employer.roles.map((role, i): Item => ({
        kind: "role",
        text: role.position ?? "",
        right: only ? undefined : dateRange(role.startDate, role.endDate, true, lang),
        after: !early && i === employer.roles.length - 1 ? 3 : 0,
      })),
      ...spaced(head),
    ];
    // Early jobs stay together, so a line or two of one can't start a page by itself.
    const previous = work.at(-1);
    if (early && earlier && previous) {
      items[0].before = GAP.earlyJob;
      previous.items.push(...items);
    } else {
      work.push({ gap: early ? GAP.earlyJob : GAP.job, items });
    }
    // The rest of a job's text can run on over a page.
    for (const group of rest) work.push({ gap: GAP.bullet, items: spaced(group) });
    earlier = early;
  }
  add(words.experience, work);

  const skills: Item[] = [];
  const skillList = resume.skills ?? [];
  for (const skill of skillList.filter((s) => s.keywords?.length)) {
    skills.push({
      kind: "skill",
      runs: [
        { text: `${skill.name}${skill.level ? ` (${skill.level})` : ""}:`, bold: true },
        { text: ` ${skill.keywords!.join(", ")}` },
      ],
    });
  }
  const names = skillList
    .filter((s) => !s.keywords?.length)
    .map((s) => s.name)
    .filter(Boolean);
  if (names.length) skills.push({ kind: "skill", runs: plain(names.join(", ")) });

  add(
    words.projects,
    (resume.projects ?? []).map((project) => {
      const items: Item[] = [
        {
          kind: "project",
          text: project.name ?? (project.url ? displayUrl(project.url) : ""),
          href: project.url,
          right: projectRight(project, lang),
        },
      ];
      const note = [project.entity, project.type, ...(project.roles ?? [])]
        .filter(Boolean)
        .join(", ");
      if (note) items.push({ kind: "note", text: note, before: 2 });
      if (project.description) {
        items.push({ kind: "text", runs: plain(project.description), before: 2 });
      }
      items.push(...bullets(project.highlights, GAP.bullet));
      if (project.keywords?.length) {
        items.push({ kind: "note", text: project.keywords.join(", "), before: 4 });
      }
      return { gap: GAP.project, items };
    }),
  );

  // Short enough to stay whole on a page, and a row's a row whichever kind it is.
  const rows: Item[] = [];
  const space = () => (rows.length ? 3 : 0);
  for (const { school, certificate } of credentials(resume)) {
    if (school) {
      rows.push({
        kind: "row",
        runs: pair(schoolStudy(school), school.institution, school.url),
        right: dateRange(school.startDate, school.endDate, false, lang),
        before: space(),
      });
      if (school.score) rows.push({ kind: "text", runs: plain(school.score) });
      if (school.courses?.length) {
        rows.push({ kind: "text", runs: plain(school.courses.join("; ")) });
      }
    } else {
      const { name, url, issuer, date } = certificate;
      const runs = name
        ? [{ text: name, href: url }, ...(issuer ? [{ text: `, ${issuer}` }] : [])]
        : plain(issuer ?? "");
      rows.push({ kind: "row", runs, right: date && formatDate(date, lang), before: space() });
    }
  }
  add(words.education, rows.length ? [{ gap: 0, items: rows }] : []);

  if (resume.languages?.length) {
    add(words.languages, [
      { gap: 0, items: [{ kind: "text", runs: plain(languageList(resume.languages)) }] },
    ]);
  }

  // The skills, then the closing's paragraphs and where to find him, as the end of the letter.
  const other: Block[] = skills.length ? [{ gap: 0, items: skills }] : [];
  const closing = basics?.closing ?? [];
  if (closing.length) {
    const separated = contact.flatMap((run, i) => (i ? [{ text: "  ·  " }, run] : [run]));
    other.push({
      gap: GAP.bullet,
      items: [
        ...closing.map((text, i): Item => ({
          kind: "text",
          runs: plain(text),
          before: i ? GAP.bullet : 0,
        })),
        { kind: "contact", runs: separated, before: 8 },
      ],
    });
  }
  add(words.other, other);

  return {
    name: basics?.name,
    born: basics?.birthDate && formatBirthDate(basics.birthDate, lang),
    label: basics?.label,
    contact,
    summary: paragraphs(basics?.summary).map(plain),
    footer: footerLabel(basics?.name),
    sections,
  };
}
