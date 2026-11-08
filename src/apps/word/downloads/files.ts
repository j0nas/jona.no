import type { Lang } from "../resumeData";

/**
 * The CV's names in each language: its downloads' file name, without the extension, its window and
 * its file on the desktop. Kept apart from the easter egg so the client can import them without it.
 */
export const CV_FILES: Record<Lang, string> = {
  en: "Jonas-Jensen-CV",
  no: "Jonas-Jensen-CV-norsk",
};

export const cvDownload = (lang: Lang, type: "pdf" | "docx" | "json") =>
  `/${CV_FILES[lang]}.${type}`;

export const CV_WINDOWS = { en: "cv", no: "cv/no" } as const satisfies Record<Lang, string>;

export const CV_DOCS: Record<Lang, string> = {
  en: "Jonas Jensen CV.doc",
  no: "Jonas Jensen CV (norsk).doc",
};

/** The CV in the other language. */
export const otherLang = (lang: Lang): Lang => (lang === "en" ? "no" : "en");
