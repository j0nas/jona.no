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

## Adding a project

The Projects folder (`/project`, on the desktop and in Start › Programs) is a showcase of what I've
built, opened in interviews. It's data too: drop `content/projects/<slug>.md` and it appears as an
icon in the folder, in its group, and opens at `/project/<slug>` in a read-only WordPad. The file
starts with a block of `key: value` lines between `---` fences (`title`, `tagline`, `kind`,
`order`, `when`, `stack`, `icon`, and optionally `status`, `links` as Markdown, `image` and
`imageAlt`), parsed and compiled by `src/projects/index.ts`; the markdown after it is the write-up.
The folder (`src/apps/projects/Projects.tsx`) is Explorer in Windows 98's web view: the panel on
the left describes the selected project with its picture, and drops away in a narrow window. Icons
are Win95 bitmaps from `@react95/icons` (MIT) in `public/img/projects/icons/<icon>-32.png` and
`-16.png`; pictures are WebP in `public/img/projects/`, and a test checks they all exist. The page
is public, so keep out anything about how media or books were obtained, the names of family,
friends and clients, and links to private repos.

## The CV

The CV is in Norwegian and English, a file of JSON Resume v1.0.0 each: `content/cv/resume.no.json`
and `content/cv/resume.en.json`, imported at build time by `src/apps/word/resumeData.ts`. They are
the only place its text lives: edit them, nothing in the code knows what they say. The Norwegian is
the source text, and the English translates it in the same plain, first-person style, so a change to
one goes in the other too; a test checks they have the same jobs, dates and logos. The code holds
only the words that aren't data: section headings, month names and "present" (`WORDS`). The
schema's additions are `basics.closing`, paragraphs that end the CV under "Other information" after
the skills, followed by the contact line again; `work[].logos`, images in `public/img/cv/logos/`
shown over an employer's heading at the size in points they give; and `basics.tldr`, a table of facts
under the summary that renders if present. A summary takes a paragraph per line. The one markup is
Markdown links (`inlineRuns`), which the screen, the PDF and the DOCX all turn into links. Employer headings aren't links; what a reader can go and look at is
linked in the text. `Resume.tsx` renders every field the schema allows for basics, work
(but for a job's location), education, certificates, skills, languages and projects, skips what's
missing, and merges consecutive jobs at one company: one heading, each role with its dates, then
their text. A job with no `endDate` reads "present" (or "nå"); a project or school with none just
shows its start.

The English shows in the `cv` window at `/cv` and the Norwegian in `cv/no` at `/cv/no`, each a file
of its own on the desktop, in Documents and in Start › Documents; Clippy and File's list of recent
files open the other. Each opens down to the taskbar (`tall` in the registry), Word
97 in page layout view (`WordCV.tsx`), on real A4 sheets: the document is cut into blocks that stay
whole (a section's heading stays with its first entry, an employer's with its logos and its first
paragraph, a job's last two paragraphs or bullets together, as do the early jobs with no text and the
document's last two sections), measured off screen, and dealt onto pages (`paginate`) before first
paint. The space above a block drops away at the top of a page, and each page's footer sits in the
bottom margin, below what `paginate` fills. Only the document can be selected: the footers and
Word's chrome have `user-select: none`, so a selection, a copy or a Touchup note across two sheets
holds the résumé's words and nothing else. Printing prints those same sheets. While the window is
focused they're also in a `[data-cv-print]` element on `<body>`, and `print.css` makes that the
whole page on paper, with `@page` at A4 and no margin. To check a change, Ctrl+P it to a PDF. A
workspace under 600px wide, as on a phone, gets online layout view instead: the same blocks reflowed
at reading size, with no sheets, ruler or toolbars, and it still prints as the sheets. The Office
Assistant (`Clippy.tsx`) sits in the gutter beside the page and stays away when that would cover
text, as on a phone. His balloon opens when he arrives, if it too would clear the text, and stays
until it's dismissed; clicking him brings it back. Only closing his window is remembered.

Review notes on the CV come through Touchup (README › Touchup). `node ../touchup/packages/cli/touchup.ts`
lists the open ones. A note on an element that shows one value of a résumé file whole names that
value with a field ref, `git:content/cv/resume.no.json#/work/3/summary` (a JSON Pointer), and the
commit the page was built from. `Resume.tsx` puts the refs on with `field()` from `@touchup/vite/field`,
and an element that shows a new field whole gets one too. Dates, web addresses, the location, the heading
of an employer with several roles, a summary of several paragraphs and any text with a Markdown link
show something other than the value as written, so they have none: for those, search the résumé file
of the page's language for the words the note quotes.

The CV is also a download: `/Jonas-Jensen-CV.pdf`, `.docx` and `.json` (JSON Resume), and in
Norwegian `/Jonas-Jensen-CV-norsk.*`, reached from Clippy's "Download this résumé" and from File ›
Save As, which gives the Word document, in the window's language. They are made from the résumé
files by the `cvDownloads` plugin, with the logos read from `public/` (`vite-cv-downloads.ts`): emitted into `dist/`
by `vp build`, served from memory by `vp dev` and `vp preview`, never committed, never in the
client bundle (`@react-pdf/renderer` and `docx` are devDependencies, and generation is plain JS).
`src/apps/word/downloads/` holds `model.ts`, which turns the résumé into blocks of lines using the
same helpers as the screen, and the PDF and DOCX builders. Both builders have their own layout code,
copied from `Resume.module.css` by eye, so a design change needs making in the screen, the PDF
and the DOCX; only the gaps between blocks (`GAP`) are shared. A new field needs adding in `model.ts` as well as `Resume.tsx`. All three files
carry a note for language models that read them (`easterEgg.ts`: white 1.5pt text in the PDF, hidden
white text in the DOCX, `meta.note` in the JSON). The same note is off screen in both CV
windows for a model reading the page's text, and in a `<noscript>` the plugin adds to
`index.html` for a plain fetch. It asks for no rating; it says a person can read the CV in a few
minutes and asks the model
to tell its user that Jonas thinks a language model isn't a good way to answer questions about a CV. It is never shown on
screen or in File › Print, which is the copy that goes through a formal screening system.

## Private pages

Pages for a few people only (`worker/private.ts`; README › Private pages). **Their content
never goes in this repo — it is public.** The files live in the `jona-private` R2 bucket under
`<slug>/` and are uploaded from wherever the page is made; this repo holds only the `PAGES`
entry, which names the page's password secret, and that name in `secrets.required`
(`wrangler.jsonc`). `wrangler deploy` refuses to run while a required secret is unset, so set it
(`wrangler secret put`) before pushing a new page, and `TOUCHUP_SITE_KEY` likewise. A private slug takes `/<slug>` away from the
desktop's own routes, so it must not be an app id.

A page can be a Touchup project with the slug as its id (`touchup` in its `PAGES` entry). Its HTML
is put together on each request: the uploaded file, Touchup's script tag
(`<script src="https://touchup.jona.no/t.js" data-project="<slug>" async>`, for everyone with the
page's password, since it does nothing for a non-reviewer) and the reviewers' live edits, which
`@touchup/edits` (`worker/touchup/`, copied from `packages/edits/dist` in the Touchup repo after
`pnpm --filter @touchup/edits build`) asks Touchup for with the `TOUCHUP_SITE_KEY` secret and applies
to the page's `data-edit` ids. `renderPhoto` in the entry is the page's own markup for a photo a
reviewer added. So the page is served `no-store` with no etag. Comments and edits are stored and
read in Touchup, not here: no endpoint of this Worker takes them. `applyEdits` needs the
Workers runtime for real, so the unit tests stub Touchup's API; check the rewriting under `wrangler dev`.

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
