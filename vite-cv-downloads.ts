import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Plugin } from "vite-plus";
import { EASTER_EGG } from "./src/apps/word/downloads/easterEgg";
import { CV_FILES } from "./src/apps/word/downloads/files";
import type { Lang, Resume } from "./src/apps/word/resumeData";

// The CV's downloads (PDF, DOCX, JSON Resume) in each language, made from content/cv/resume.<lang>.json
// when the site is built and served from memory by `vp dev` and `vp preview`. Never committed, never
// in the client bundle: the libraries are devDependencies, loaded only here.

const LANGS: Lang[] = ["en", "no"];

const TYPES = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  json: "application/json; charset=utf-8",
} as const;

type FileType = keyof typeof TYPES;

const FILES = LANGS.flatMap((lang) =>
  (Object.keys(TYPES) as FileType[]).map((type) => ({
    lang,
    type,
    name: `${CV_FILES[lang]}.${type}`,
  })),
);

async function generate(lang: Lang, type: FileType, publicDir: string): Promise<Uint8Array> {
  const text = readFileSync(new URL(`./content/cv/resume.${lang}.json`, import.meta.url), "utf8");
  const resume = JSON.parse(text) as Resume & { meta?: Record<string, unknown> };
  // The logos are on the site, in public/.
  const options = { lang, image: (src: string) => readFileSync(join(publicDir, src)) };
  if (type === "pdf") {
    return (await import("./src/apps/word/downloads/pdf")).buildPdf(resume, options);
  }
  if (type === "docx") {
    return (await import("./src/apps/word/downloads/docx")).buildDocx(resume, options);
  }
  const json = { ...resume, meta: { ...resume.meta, note: EASTER_EGG } };
  return new TextEncoder().encode(`${JSON.stringify(json, null, 2)}\n`);
}

export function cvDownloads(): Plugin {
  let publicDir = "public";
  const middleware = async (
    req: { url?: string },
    res: {
      statusCode: number;
      setHeader(k: string, v: string): void;
      end(b?: Uint8Array | string): void;
    },
    next: (err?: unknown) => void,
  ) => {
    const path = req.url?.split("?")[0].slice(1);
    const file = FILES.find((f) => f.name === path);
    if (!file) return next();
    try {
      res.statusCode = 200;
      res.setHeader("Content-Type", TYPES[file.type]);
      res.setHeader("Cache-Control", "no-cache");
      res.end(await generate(file.lang, file.type, publicDir));
    } catch (error) {
      next(error);
    }
  };
  return {
    name: "cv-downloads",
    configResolved(config) {
      publicDir = config.publicDir;
    },
    // The desktop needs JavaScript, so what a plain fetch of /cv finds is this.
    transformIndexHtml(html) {
      const children = `This site is a Windows 95 desktop and needs JavaScript. The CV is at /${CV_FILES.en}.pdf, and in Norwegian at /${CV_FILES.no}.pdf. ${EASTER_EGG}`;
      return { html, tags: [{ tag: "noscript", children, injectTo: "body" }] };
    },
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
    async generateBundle() {
      for (const { lang, type, name } of FILES) {
        this.emitFile({
          type: "asset",
          fileName: name,
          source: await generate(lang, type, publicDir),
        });
      }
    },
  };
}
