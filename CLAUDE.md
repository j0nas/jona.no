# CLAUDE.md

Guidance for agents working in this repo. For the Vite+ toolchain checklist, see `AGENTS.md`;
for the prose overview, see `README.md`.

## What this is

A personal site styled as a Windows 95 desktop (React 19, Vite+). The chrome is our own
component library in `src/win95/`. There are two kinds of "apps" on the desktop:

- **Built-in apps** — written against `src/win95/` (Notepad, WordPad, My Computer, …). Each
  renders its body inside an `AppWindow` and is wired in `src/components/desktop/Desktop.tsx`.
- **Documents** — markdown files in `content/docs/`, shown read-only in a WordPad window
  and listed in the desktop's Documents folder and Start › Documents. See "Adding a
  document".
- **Embedded apps** — separate, standalone web apps (their own repo, toolchain, deps and
  styles) that **deploy themselves**. The desktop embeds each one's _live_ deploy inside a
  Win95 window via an `<iframe>`, served under a same-origin proxy. The Floor Planner
  (`github.com/j0nas/floor-boards-planner` → GitHub Pages) is the first.

## Adding an embedded app

The app owns its build and deploy; this repo only proxies to it and registers it. The app is
the source of truth — once added, **updating it is just pushing the app's repo** (it
redeploys and the desktop serves the new build live; no change here). Adding one is
data-driven — no new component, no `Desktop.tsx` edit:

1. **In the app's own repo:** set a relative base (`base: "./"` in its `vite.config.ts`) so
   assets resolve under both its own deploy path and the proxied subpath, and give it a deploy
   that publishes on push (e.g. a GitHub Pages Actions workflow). Note its deploy URL.
2. **Proxy it:** add it to `worker/apps.ts` (`"<id>": { deploy: "<app deploy URL>" }`). The
   Worker serves it at `/apps/<id>/*` in production; `vite.config.ts` proxies the same list
   for `vp dev` / `vp preview`.
3. **Icon:** add `public/img/apps/<id>.svg` (one SVG scales to both the 32px desktop icon and
   the 16px title-bar/taskbar icon).
4. **Register:** add an entry to `src/apps/registry.tsx` with `title`, `defaultSize`,
   `icon`/`iconSmall` (the SVG at both), and `embed: "/apps/<id>/"`. The desktop icon, the
   Start › Programs entry, and the window rendering all derive from this automatically.
5. **Validate & commit:** `vp check && vp build`, then commit.

### Invariants — do not break these

- The embedded app is the **source of truth** and deploys itself. This repo never vendors,
  builds, or commits the app's bundle — it only proxies to the live deploy. An app update
  needs no commit here.
- The Worker proxies an app **same-origin** (`worker/index.ts`), so the `<iframe>` and the
  shareable `/apps/<id>/` link need no CORS or framing exceptions. Production and dev read the
  one list in `worker/apps.ts`.
- The app **must** use a relative base (`base: "./"`); an absolute base would break under the
  proxied subpath.

## Adding a document

Documents are data, not code. Drop `content/docs/<slug>.md` — the first `# ` heading is the
title, the file name is the slug — and it appears in the Documents folder, in Start ›
Documents, and at `/docs/<slug>`. The markdown is compiled at build time by `src/docs/index.ts`
(a Vite raw glob + `marked` with `marked-footnote`, so GFM tables and `[^name]` footnotes work;
footnotes render as a "Notes" section at the end), so the site stays a static SPA and the Worker needs no
change. Rendering is `src/apps/documents/DocViewer.tsx`; its stylesheet is where the "10pt
Times New Roman in WordPad" look lives. Author with plain headings, lists and tables; the
content is ours, so the HTML is trusted and rendered as-is. Images go in
`public/img/docs/<slug>/` and are referenced by absolute path (`/img/docs/<slug>/x.png`).

## Private pages

Pages for a few people only (`worker/private.ts`; README › Private pages). **Their content
never goes in this repo — it is public.** The files live in the `jona-private` R2 bucket under
`<slug>/` and are uploaded from wherever the page is made; this repo holds only the `PAGES`
entry, which names the page's password secret, and that name in `secrets.required`
(`wrangler.jsonc`). `wrangler deploy` refuses to run while a required secret is unset, so set it
(`wrangler secret put`) before pushing a new page. A private slug takes `/<slug>` away from the
desktop's own routes, so it must not be an app id.

## Sharable links (desktop routing)

`src/components/desktop/route.ts` routes the desktop by the focused window: every app —
built-in or embedded — is shareable at `/<id>` (e.g. `/floor-planner`) and every document at
`/docs/<slug>`, which opens the desktop with that window open. `Desktop` derives its initial
window from the path and `replaceState`s the active window's id into the URL as windows
open/focus/close. A window id _is_ its path (`WindowId` in `src/apps/registry.tsx`: an `AppId`
or `docs/<slug>`), so there's no collision with the bare embedded builds at `/apps/<id>/`.
There's no router library and no per-app wiring — a new registry entry or markdown file is
automatically deep-linkable.

## Validate

Run `vp check` (format, lint, type-check) and `vp build` before committing. See `AGENTS.md`.

A pre-commit hook (`.vite-hooks/pre-commit` → `vp staged`, rules in the `staged` block of
`vite.config.ts`) formats and lints staged files. The dispatcher installs itself on
`vp install` via the `prepare` script; `vp hooks status` shows whether it's active.
