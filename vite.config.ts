import { defineConfig } from "vite-plus";
import react from "@vitejs/plugin-react";
import { touchupSource } from "@touchup/vite";
import { APPS } from "./worker/apps";
import { cvDownloads } from "./vite-cv-downloads";

// Embedded apps are separate deploys, served under /apps/<id>/ by the Worker in production
// (worker/index.ts). The dev and preview servers proxy the same list (worker/apps.ts), so the
// embedded iframes load the same live build locally.
const embeddedProxy = Object.fromEntries(
  Object.entries(APPS).map(([id, { deploy }]) => {
    const { origin, pathname } = new URL(deploy);
    const prefix = `/apps/${id}`;
    const rewrite = (p: string) => pathname.replace(/\/$/, "") + p.slice(prefix.length);
    return [prefix, { target: origin, changeOrigin: true, rewrite }];
  }),
);

// https://vite.dev/config/
export default defineConfig({
  // touchupSource stamps each element with the file and line it's written at, so a Touchup note says
  // where. Before react(): it reads the JSX as written.
  plugins: [touchupSource(), react(), cvDownloads()],
  // jonass-mbp: reading the CV from another device on the network, with `vp dev --host`. Touchup's
  // project has that origin too (README.md › Touchup).
  server: { proxy: embeddedProxy, allowedHosts: ["jonass-mbp"] },
  preview: { proxy: embeddedProxy },
  // Not ours to format: the session log, and generated sprite data kept minified.
  fmt: { ignorePatterns: ["llm-sessions/**", "public/img/cv/clippy-agent.json"] },
  // Pre-commit: format + lint whatever is staged (.vite-hooks/pre-commit runs `vp staged`).
  staged: { "*.{ts,tsx,css,md,json,html}": "vp check --fix" },
});
