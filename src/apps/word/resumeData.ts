import en from "../../../content/cv/resume.en.json";
import no from "../../../content/cv/resume.no.json";

// The CV's data: content/cv/resume.<lang>.json (JSON Resume v1.0.0), one file in each language. Every
// field is optional here, whatever the files happen to hold today, so a section or field that isn't
// there just doesn't render.

export type Lang = "en" | "no";

/** Each language's tag, for `lang`, Intl and the files' metadata. The English is British. */
export const LOCALE: Record<Lang, string> = { en: "en-GB", no: "nb-NO" };
export interface Location {
  address?: string;
  postalCode?: string;
  city?: string;
  region?: string;
  countryCode?: string;
}

export interface Profile {
  network?: string;
  username?: string;
  url?: string;
}

/** A row of the tl;dr. Not in JSON Resume's schema, which leaves basics open to more fields. */
export interface Fact {
  label?: string;
  text?: string;
}

export interface Basics {
  name?: string;
  label?: string;
  /** Beside his name, as Norwegian CVs have it. Not in JSON Resume's schema either. */
  birthDate?: string;
  email?: string;
  phone?: string;
  url?: string;
  tldr?: Fact[];
  summary?: string;
  /** Paragraphs that end the CV, after its skills and before its contact line again. Not in JSON Resume's schema either. */
  closing?: string[];
  location?: Location;
  profiles?: Profile[];
}

/** A logo over an employer's heading, at its size in points. Not in JSON Resume's schema either. */
export interface Logo {
  /** Its address on this site: the file is in public/. */
  image?: string;
  width?: number;
  height?: number;
}

export interface Work {
  name?: string;
  logos?: Logo[];
  position?: string;
  url?: string;
  startDate?: string;
  endDate?: string;
  summary?: string;
  highlights?: string[];
}

export interface Education {
  institution?: string;
  url?: string;
  area?: string;
  studyType?: string;
  startDate?: string;
  endDate?: string;
  score?: string;
  courses?: string[];
}

export interface Certificate {
  name?: string;
  date?: string;
  issuer?: string;
  url?: string;
}

export type Credential =
  | { school: Education; certificate?: undefined }
  | { certificate: Certificate; school?: undefined };

export interface Skill {
  name?: string;
  level?: string;
  keywords?: string[];
}

export interface Language {
  language?: string;
  fluency?: string;
}

export interface Project {
  name?: string;
  description?: string;
  url?: string;
  highlights?: string[];
  keywords?: string[];
  roles?: string[];
  entity?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
}

export interface Resume {
  basics?: Basics;
  work?: Work[];
  education?: Education[];
  certificates?: Certificate[];
  skills?: Skill[];
  languages?: Language[];
  projects?: Project[];
}

export const resumes: Record<Lang, Resume> = { en, no } as unknown as Record<Lang, Resume>;

/** A date of birth's parts, as each language's `born` puts them together. */
interface Birth {
  year: string;
  month: string;
  monthName: string;
  day: string;
}

/** The CV's own words, where the data has none: its section headings, months and an open end. */
export const WORDS = {
  en: {
    months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    present: "present",
    born: ({ year, monthName, day }: Birth) => `b. ${Number(day)} ${monthName} ${year}`,
    experience: "Work experience",
    projects: "Projects",
    education: "Education and certificates",
    languages: "Languages",
    other: "Other information",
  },
  no: {
    months: ["Jan", "Feb", "Mar", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Des"],
    present: "nå",
    born: ({ year, month, day }: Birth) => `f. ${day}.${month}.${year}`,
    experience: "Arbeidserfaring",
    projects: "Prosjekter",
    education: "Utdanning og sertifikat",
    languages: "Språk",
    other: "Annen info",
  },
} satisfies Record<Lang, unknown>;

/** An ISO 8601 date as JSON Resume allows it: "2022-08-15" or "2022-08" → "Aug 2022", "2022" → "2022". */
export function formatDate(date: string, lang: Lang = "en"): string {
  const [year, month] = date.split("-");
  const name = WORDS[lang].months[Number(month) - 1];
  return name ? `${name} ${year}` : year;
}

/** "f. 24.12.1992", "b. 24 Dec 1992": a full ISO date of birth, as each language writes it. */
export function formatBirthDate(date: string, lang: Lang = "en"): string {
  const [year, month, day] = date.split("-");
  const monthName = WORDS[lang].months[Number(month) - 1];
  return monthName && day ? WORDS[lang].born({ year, month, monthName, day }) : year;
}

/**
 * "Aug 2022 – present": a job with no end is still going. Other entries (`open` false) with no end
 * only say when they started, since a project from 2014 hasn't been running since then just because
 * nobody wrote down when it finished.
 */
export function dateRange(start?: string, end?: string, open = true, lang: Lang = "en"): string {
  const date = (d: string) => formatDate(d, lang);
  if (start && start === end) return date(start);
  if (start && end) return `${date(start)} – ${date(end)}`;
  if (start) return open ? `${date(start)} – ${WORDS[lang].present}` : date(start);
  return end ? date(end) : "";
}

/** A URL for reading, on screen and on paper: no scheme, "www." or trailing slash. */
export function displayUrl(url: string): string {
  return url
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "");
}

/** A run of text, a link if it has an address. */
export interface Inline {
  text: string;
  href?: string;
  bold?: boolean;
}

/** A text's paragraphs: a summary can have several, a line each. */
export function paragraphs(text = ""): string[] {
  return text.split(/\n+/).filter(Boolean);
}

/** Text with Markdown links in it, the one markup the résumé's strings can hold, as runs. */
export function inlineRuns(text: string): Inline[] {
  const runs: Inline[] = [];
  let at = 0;
  for (const match of text.matchAll(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g)) {
    if (match.index > at) runs.push({ text: text.slice(at, match.index) });
    runs.push({ text: match[1], href: match[2] });
    at = match.index + match[0].length;
  }
  if (at < text.length) runs.push({ text: text.slice(at) });
  return runs;
}

/** A phone number as a link a phone can call. */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

/** "Oslo, Norway", from the parts JSON Resume splits a location into. */
export function formatLocation(
  { city, region, countryCode }: Location = {},
  lang: Lang = "en",
): string {
  let country: string | undefined;
  try {
    country =
      countryCode && new Intl.DisplayNames([LOCALE[lang]], { type: "region" }).of(countryCode);
  } catch {
    country = countryCode;
  }
  const parts = [city, region === city ? undefined : region, country];
  return parts.filter(Boolean).join(", ");
}

export interface Employer {
  name?: string;
  url?: string;
  logos: Logo[];
  roles: Work[];
  /** The text of all its roles, since it goes under the whole stack of them. */
  summaries: string[];
  highlights: string[];
}

/** Consecutive jobs at one company, as one heading with its roles stacked under it, then their text. */
export function groupByEmployer(work: Work[] = []): Employer[] {
  const employers: Employer[] = [];
  for (const job of work) {
    let employer = employers.at(-1);
    if (employer && employer.name === job.name) {
      employer.roles.push(job);
      employer.url ??= job.url;
    } else {
      employer = {
        name: job.name,
        url: job.url,
        logos: [],
        roles: [job],
        summaries: [],
        highlights: [],
      };
      employers.push(employer);
    }
    employer.logos.push(...(job.logos ?? []).filter((logo) => logo.image));
    if (job.summary) employer.summaries.push(job.summary);
    employer.highlights.push(...(job.highlights ?? []));
  }
  return employers;
}

/** An employer with no text, which only has its heading and roles to say. */
export function isEarly({ summaries, highlights }: Employer): boolean {
  return !summaries.length && !highlights.length;
}

/**
 * An employer's text, its summaries' paragraphs and then its highlights, in the groups that stay
 * whole on a page. `head` stays with the employer's heading, which needs something under it. The
 * last two go together, so neither a bullet nor a paragraph ends up alone at the top of a page.
 * Generic, so the screen can group its text with each piece's field ref.
 */
export function textGroups<T>(pieces: T[]): { head: T[]; rest: T[][] } {
  const singles = pieces.slice(0, -2).map((piece) => [piece]);
  const groups = pieces.length ? [...singles, pieces.slice(-2)] : [];
  return { head: groups[0] ?? [], rest: groups.slice(1) };
}

/** Which of studyType and area a school's line shows, the area alone when it already says the type. */
export function studyKeys(school: Education): ("studyType" | "area")[] {
  const { studyType, area } = school;
  const keys: ("studyType" | "area")[] =
    studyType && area?.includes(studyType) ? ["area"] : ["studyType", "area"];
  return keys.filter((key) => school[key]);
}

/** "Bachelor's degree, IT"; "Bachelor's degree" and "Bachelor's degree in IT" don't need saying twice. */
export function schoolStudy(school: Education): string {
  return studyKeys(school)
    .map((key) => school[key])
    .join(", ");
}

/** Schools and certificates in one list, newest first; ISO dates sort as text, and undated go last. */
export function credentials({ education = [], certificates = [] }: Resume): Credential[] {
  const dated = (item: Credential) =>
    (item.school ? (item.school.endDate ?? item.school.startDate) : item.certificate.date) ?? "";
  return [
    ...education.map((school) => ({ school })),
    ...certificates.map((certificate) => ({ certificate })),
  ].sort((a, b) => dated(b).localeCompare(dated(a)));
}

/** What a project's title row has flush right: its address, unless the title already is that. */
export function projectRight(project: Project, lang: Lang = "en"): string {
  const { name, url, startDate, endDate } = project;
  const address = url && displayUrl(url);
  return [address?.toLowerCase() === name?.toLowerCase() ? undefined : address]
    .concat(dateRange(startDate, endDate, false, lang))
    .filter(Boolean)
    .join("  ·  ");
}

/** "English (native), Norwegian (native)". */
export function languageList(languages: Language[] = []): string {
  return languages
    .map(({ language, fluency }) => [language, fluency && `(${fluency})`].filter(Boolean).join(" "))
    .filter(Boolean)
    .join(", ");
}

/** What every page's footer says before its number: "Jonas Jensen · CV". */
export function footerLabel(name?: string): string {
  return [name, "CV"].filter(Boolean).join(" · ");
}

/**
 * The space above a block, in points. Within a block the spacing is each form's own: 3 after the
 * role, 4 between paragraphs and bullets, 2 within a project, 8 below a section's rule.
 */
export const GAP = {
  /** The summary, under the contact line. */
  summary: 12,
  section: 32,
  job: 20,
  /** An early job with no text, which only has a line or two to say. */
  earlyJob: 10,
  /** A paragraph or a bullet. */
  bullet: 4,
  project: 8,
};

/** A4 at 96dpi, with Word's 1" margins left and right and 0.8" top and bottom. */
export const PAGE_W = 794;
export const PAGE_H = 1123;
export const PAGE_MARGIN = 96;
export const PAGE_MARGIN_Y = 76.8;

/**
 * Word's page breaks: blocks that won't be split go on the current page while they fit, the space
 * above one (`gaps`) counting unless it's first on its page. A block taller than a whole page gets a
 * page of its own and runs over.
 */
export function paginate(heights: number[], capacity: number, gaps: number[] = []): number[][] {
  const pages: number[][] = [[]];
  let used = 0;
  heights.forEach((height, i) => {
    const gap = used > 0 ? (gaps[i] ?? 0) : 0;
    if (used > 0 && used + gap + height > capacity) {
      pages.push([i]);
      used = height;
    } else {
      pages.at(-1)!.push(i);
      used += gap + height;
    }
  });
  return pages;
}
