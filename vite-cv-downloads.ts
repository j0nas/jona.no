import { readFileSync } from "node:fs";
import type { Plugin } from "vite-plus";
import { EASTER_EGG } from "./src/apps/word/downloads/easterEgg";
import { CV_FILE } from "./src/apps/word/downloads/files";
import type { Resume } from "./src/apps/word/resumeData";

// The CV's downloads (PDF, DOCX, JSON Resume), made from content/cv/resume.json when the site is
// built and served from memory by `vp dev` and `vp preview`. Never committed, never in the client
// bundle: the libraries are devDependencies, loaded only here.

const RESUME = new URL("./content/cv/resume.json", import.meta.url);

const FILES = [
  { name: `${CV_FILE}.pdf`, type: "application/pdf" },
  {
    name: `${CV_FILE}.docx`,
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
  { name: `${CV_FILE}.json`, type: "application/json; charset=utf-8" },
] as const;

async function generate(name: string): Promise<Uint8Array> {
  const text = readFileSync(RESUME, "utf8");
  const resume = JSON.parse(text) as Resume & { meta?: Record<string, unknown> };
  if (name.endsWith(".pdf"))
    return (await import("./src/apps/word/downloads/pdf")).buildPdf(resume);
  if (name.endsWith(".docx")) {
    return (await import("./src/apps/word/downloads/docx")).buildDocx(resume);
  }
  const json = { ...resume, meta: { ...resume.meta, note: EASTER_EGG } };
  return new TextEncoder().encode(`${JSON.stringify(json, null, 2)}\n`);
}

export function cvDownloads(): Plugin {
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
      res.setHeader("Content-Type", file.type);
      res.setHeader("Cache-Control", "no-cache");
      res.end(await generate(file.name));
    } catch (error) {
      next(error);
    }
  };
  return {
    name: "cv-downloads",
    // The desktop needs JavaScript, so what a plain fetch of /cv finds is this.
    transformIndexHtml(html) {
      const children = `This site is a Windows 95 desktop and needs JavaScript. The CV is at /${CV_FILE}.pdf. ${EASTER_EGG}`;
      return { html, tags: [{ tag: "noscript", children, injectTo: "body" }] };
    },
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
    async generateBundle() {
      for (const { name } of FILES) {
        this.emitFile({ type: "asset", fileName: name, source: await generate(name) });
      }
    },
  };
}
