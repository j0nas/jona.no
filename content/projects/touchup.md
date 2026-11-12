---
title: Touchup
tagline: Comments and edits on a live page, picked up and fixed by my coding agent
kind: web
order: 3
icon: touchup
when: November 2026
stack: TypeScript, Cloudflare Workers, D1, R2, MCP
status: In use on my own sites
image: touchup.webp
imageAlt: A page with two notes pinned to it and the reviewer's list of notes open
---

A review layer for my own sites. Someone who isn't a developer opens the live page and comments on it, or edits the text in place, from a phone or a computer. My coding agent picks the notes up over MCP, fixes the source and replies, and the reviewer sees the reply and the note's status on the page. It replaced the hand-built comment layers I had in three projects, and the review of the CV on this site went through it.

## Highlights

- 224 commits in one week, about 40% of them made by the agent directly.
- A note is anchored to an element and to the exact text that was selected. If that text is later reworded, the note says its text is gone; it doesn't guess where it belongs.
- Notes written offline wait in the browser until the server has them.
- An invite carries its token in the URL fragment, so the token never reaches the server, and each project has its own key for the agent.
