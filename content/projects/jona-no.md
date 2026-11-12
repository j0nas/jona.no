---
title: jona.no
tagline: This site, as a Windows 95 desktop
kind: web
order: 6
icon: jona-no
when: Rebuilt from January 2026
stack: React 19, Vite+, Cloudflare Workers
status: Live
links: [code](https://github.com/j0nas/jona.no)
image: jona-no.webp
imageAlt: The desktop with this Projects folder open, edh.land selected
---

My site, with its own component library for the Windows 95 chrome. Standalone apps are embedded in windows behind a same-origin proxy, so they deploy on their own and update here without a commit.

## Highlights

- The CV is two JSON Resume files, one Norwegian and one English. At build time they become the Word window, a PDF and a DOCX, all from the same data. On screen it's cut into blocks that have to stay whole and dealt onto real A4 pages before the first paint, and printing prints those same pages.
- Private pages for a few people are served by the Worker from storage outside the repo, behind a password, with reviewers' edits from Touchup applied as the page is served.
- Every window has its own address, so this folder is at /project and each project at /project/<name>, with no router library.
