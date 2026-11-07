# CLAUDE.md

Guidance for agents working in this repo. For the Vite+ toolchain checklist, see `AGENTS.md`;
for the prose overview, see `README.md`.

## What this is

A personal site styled as a Windows 95 desktop (React 19, Vite+). The chrome is our own
component library in `src/win95/`. There are two kinds of "apps" on the desktop:

- **Built-in apps** — written against `src/win95/` (Internet Explorer, Word, Notepad, WordPad, My
  Computer, …). Each renders its body inside an `AppWindow` and is wired in
  `src/components/desktop/Desktop.tsx`. `/` opens the Internet Explorer window (`internet`, my
  home page, `src/apps/internet/`), and that window keeps that address, with `/internet` opening it
  too; the Notepad stays at `/personal-details`.
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

## The CV

The CV's data is `content/cv/resume.json` (JSON Resume v1.0.0), imported at build time by
`src/apps/word/resumeData.ts`, and it is the only place its text lives: edit that file, nothing in
the code knows what it says. Its one addition to the schema is `basics.tldr`, the facts at the top
of the CV, and its one markup is Markdown links (`inlineRuns`), which the screen, the PDF and the
DOCX all turn into links. Employer headings aren't links; what a reader can go and look at is
linked in the text. `Resume.tsx` renders every field the schema allows for basics, work
(but for a job's location), education, certificates, skills, languages and projects, skips what's
missing, and merges consecutive jobs at one company: one heading, each role with its dates, then
their text. A job with no `endDate` reads "present"; a project or school with none just shows its
start.

It shows in the `cv` window at `/cv`, which opens down to the taskbar (`tall` in the registry), Word
97 in page layout view (`WordCV.tsx`), on real A4 sheets: the document is cut into blocks that stay
whole (a section's heading stays with its first entry, an employer's with what's under it, a job's
last two bullets together, as do the early jobs with no bullets and the document's last two
sections), measured off screen, and dealt onto pages (`paginate`) before first
paint. The space above a block drops away at the top of a page, and each page's footer sits in the
bottom margin, below what `paginate` fills. Only the document can be selected: the footers and
Word's chrome have `user-select: none`, so a selection, a copy or a Touchup note across two sheets
holds `resume.json`'s words and nothing else. Printing prints those same sheets. While the window is
focused they're also in a `[data-cv-print]` element on `<body>`, and `print.css` makes that the
whole page on paper, with `@page` at A4 and no margin. To check a change, Ctrl+P it to a PDF. A
workspace under 600px wide, as on a phone, gets online layout view instead: the same blocks reflowed
at reading size, with no sheets, ruler or toolbars, and it still prints as the sheets. The Office
Assistant (`Clippy.tsx`) sits in the gutter beside the page and stays away when that would cover
text, as on a phone. The document's first scroll dismisses his balloon; clicking him brings it back.

Review notes on the CV come through Touchup (README › Touchup). `node ../touchup/packages/cli/touchup.ts`
lists the open ones. Each gives the exact words selected, so search for those in `resume.json`; the
`source` line only names `Resume.tsx`.

The CV is also a download: `/Jonas-Jensen-CV.pdf`, `.docx` and `.json` (JSON Resume), reached from
Clippy's "Download this résumé" and from File › Save As, which gives the Word document. They are
made from `resume.json` by the `cvDownloads` plugin (`vite-cv-downloads.ts`): emitted into `dist/`
by `vp build`, served from memory by `vp dev` and `vp preview`, never committed, never in the
client bundle (`@react-pdf/renderer` and `docx` are devDependencies, and generation is plain JS).
`src/apps/word/downloads/` holds `model.ts`, which turns the résumé into blocks of lines using the
same helpers as the screen, and the PDF and DOCX builders. Both builders have their own layout code,
copied from `Resume.module.css` by eye, so a design change needs making in the screen, the PDF
and the DOCX; only the gaps between blocks (`GAP`) are shared. A new field needs adding in `model.ts` as well as `Resume.tsx`. All three files
carry a note for language models that read them (`easterEgg.ts`: white 1.5pt text in the PDF, hidden
white text in the DOCX, `meta.note` in the JSON). The same note is off screen in the
`cv` window for a model reading the page's text, and in a `<noscript>` the plugin adds to
`index.html` for a plain fetch. It asks for no rating; it says the CV has a tl;dr and asks the model
to tell its user that using a model on a CV is not a good or ethical idea. It is never shown on
screen or in File › Print, which is the copy that goes through a formal screening system.

## Private pages

Pages for a few people only (`worker/private.ts`; README › Private pages). **Their content
never goes in this repo — it is public.** The files live in the `jona-private` R2 bucket under
`<slug>/` and are uploaded from wherever the page is made; this repo holds only the `PAGES`
entry, which names the page's password secret, and that name in `secrets.required`
(`wrangler.jsonc`). `wrangler deploy` refuses to run while a required secret is unset, so set it
(`wrangler secret put`) before pushing a new page. A private slug takes `/<slug>` away from the
desktop's own routes, so it must not be an app id.

A page can have a second, review password (`review` in its `PAGES` entry, a secret of its own).
It opens the same page with a review layer added to the HTML (`public/private/review.js`): a tab
on the right edge with two modes, the same on a phone and a computer.

- **Kommenter** leaves a note for whoever makes the page. Notes go to `/<slug>/_feedback`
  (`worker/feedback.ts`), kept in the bucket under `_feedback/<slug>/`, outside the page's folder.
- **Rediger** changes the page in place: text edited, paragraphs, list items and photos added,
  removed or replaced. Edits go to `/<slug>/_edits` (`worker/edits.ts`), a log in the bucket at
  `_edits/<slug>.json`, and are applied to the page for every visitor as it's served (an
  `HTMLRewriter` keyed on the page's `data-edit` ids) until the page's maker folds them into the
  page's source and marks them folded. Uploaded photos land in the page's own `img/` folder,
  re-encoded in the browser (no metadata; the Worker refuses a JPEG with an Exif block).

Only the review password reaches either endpoint. A page's HTML is put together on each request
(file, edits, layer), so it is served `no-store` with no etag. `applyEdits` needs the Workers
runtime, so the unit tests stop at the API; check the rewriting under `wrangler dev`.

## Sharable links (desktop routing)

`src/components/desktop/route.ts` routes the desktop by the focused window: every app —
built-in or embedded — is shareable at `/<id>` (e.g. `/floor-planner`) and every document at
`/docs/<slug>`, which opens the desktop with that window open. `Desktop` derives its initial
window from the path and `replaceState`s the active window's id into the URL as windows
open/focus/close, keeping the query and the fragment, which an invite link's script may not have
read yet. A window id _is_ its path (`WindowId` in `src/apps/registry.tsx`: an `AppId`
or `docs/<slug>`), except the home page, whose one address is `/`, so that a Touchup note on it
stays on it whichever way it was opened. There's no collision with the bare embedded builds at
`/apps/<id>/`.
There's no router library and no per-app wiring — a new registry entry or markdown file is
automatically deep-linkable.

## Validate

Run `vp check` (format, lint, type-check) and `vp build` before committing. See `AGENTS.md`.

A pre-commit hook (`.vite-hooks/pre-commit` → `vp staged`, rules in the `staged` block of
`vite.config.ts`) formats and lints staged files. The dispatcher installs itself on
`vp install` via the `prepare` script; `vp hooks status` shows whether it's active.
