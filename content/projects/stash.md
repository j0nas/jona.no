---
title: Stash
tagline: A phone-first inventory of a hotel's spare parts
kind: web
order: 4
icon: stash
when: October–November 2026
stack: React, Cloudflare Workers, Durable Objects, Anthropic API
status: In use by the hotel's maintenance team
image: stash.webp
imageAlt: The stock list and a part's page, on a phone
---

Made for a friend on a hotel's maintenance team: what there is, where it is and what's running low. You can photograph a part and have it described, and ask in plain language what's in stock. The hotel's management approved it within a week, and six people were trying it.

## Highlights

- It's event-sourced: the state is a fold over a log of events. The server stores the events without reading them, so a new field needs no migration.
- One Durable Object holds the log and pushes changes to every open phone over a WebSocket. Changes made offline wait in the browser.
- The model picks a part's category from a fixed list, and the tests for that run against the real model.
- Reviewers report problems through Touchup, right on the page.
