import resumeJson from "../../../content/cv/resume.json";

// The CV's data: content/cv/resume.json (JSON Resume v1.0.0). Every field is optional here, whatever
// the file happens to hold today, so a section or field that isn't there just doesn't render.
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

export interface Basics {
  name?: string;
  label?: string;
  email?: string;
  phone?: string;
  url?: string;
  summary?: string;
  location?: Location;
  profiles?: Profile[];
}

export interface Work {
  name?: string;
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

export const resume = resumeJson as unknown as Resume;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** An ISO 8601 date as JSON Resume allows it: "2022-08-15" or "2022-08" → "Aug 2022", "2022" → "2022". */
export function formatDate(date: string): string {
  const [year, month] = date.split("-");
  const name = MONTHS[Number(month) - 1];
  return name ? `${name} ${year}` : year;
}

/**
 * "Aug 2022 – present": a job with no end is still going. Other entries (`open` false) with no end
 * only say when they started, since a project from 2014 hasn't been running since then just because
 * nobody wrote down when it finished.
 */
export function dateRange(start?: string, end?: string, open = true): string {
  if (start && end) return `${formatDate(start)} – ${formatDate(end)}`;
  if (start) return open ? `${formatDate(start)} – present` : formatDate(start);
  return end ? formatDate(end) : "";
}

/** A URL for reading, on screen and on paper: no scheme, "www." or trailing slash. */
export function displayUrl(url: string): string {
  return url
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "");
}

/** "Oslo, Norway", from the parts JSON Resume splits a location into. */
export function formatLocation({ city, region, countryCode }: Location = {}): string {
  let country: string | undefined;
  try {
    country = countryCode && new Intl.DisplayNames(["en"], { type: "region" }).of(countryCode);
  } catch {
    country = countryCode;
  }
  const parts = [city, region === city ? undefined : region, country];
  return parts.filter(Boolean).join(", ");
}

export interface Employer {
  name?: string;
  url?: string;
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
      employer = { name: job.name, url: job.url, roles: [job], summaries: [], highlights: [] };
      employers.push(employer);
    }
    if (job.summary) employer.summaries.push(job.summary);
    employer.highlights.push(...(job.highlights ?? []));
  }
  return employers;
}

/**
 * An employer's highlights in the groups that stay whole on a page. The last two go together, so no
 * bullet ends up alone at the top of a page. `head` stays with the employer's heading, which needs
 * something under it: its summary will do, unless that would leave a lone highlight on its own.
 */
export function highlightGroups({ summaries, highlights }: Employer): {
  head: string[];
  rest: string[][];
} {
  const singles = highlights.slice(0, -2).map((highlight) => [highlight]);
  const groups = highlights.length ? [...singles, highlights.slice(-2)] : [];
  if (summaries.length && highlights.length !== 1) return { head: [], rest: groups };
  return { head: groups[0] ?? [], rest: groups.slice(1) };
}

/** "Bachelor's degree, IT"; "Bachelor's degree" and "Bachelor's degree in IT" don't need saying twice. */
export function schoolStudy({ studyType, area }: Education): string {
  return studyType && area?.includes(studyType)
    ? area
    : [studyType, area].filter(Boolean).join(", ");
}

/** What a project's title row has flush right: its address, unless the title already is that. */
export function projectRight(project: Project): string {
  const { name, url, startDate, endDate } = project;
  const address = url && displayUrl(url);
  return [address?.toLowerCase() === name?.toLowerCase() ? undefined : address]
    .concat(dateRange(startDate, endDate, false))
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
 * role, 4 between bullets, 2 within a project, 8 below a section's rule.
 */
export const GAP = {
  section: 32,
  job: 20,
  /** An early job with no bullets, which only has a line or two to say. */
  earlyJob: 10,
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
