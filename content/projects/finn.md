---
title: Finn deal finder
tagline: Finding the best-value used hi-fi on Norway's classifieds site
kind: agents
order: 3
icon: finn
when: June 2026
stack: TypeScript, Node, SQLite, Zod, React, a local model
status: Done, paused
image: finn.webp
imageAlt: The dashboard, listings ranked by how far under the market price they are
---

I wanted to replace a soundbar with a used hi-fi setup, so I built tools to find the best value on finn.no. It's five small packages: a client for Finn's listings, a client for Prisjakt's product data and price history, a catalogue of product models that records where every fact came from, a monitor that scores listings against the market price, and a dashboard.

## Highlights

- Questions like "does this speaker fit my constraints?" answer pass, fail or unknown, and a missing fact never counts as false. Property-based tests check that adding a constraint can never improve a verdict.
- The local model only answers yes-or-no questions. Asked to pick among many classes it was unreliable, and once called an NAD amplifier "non-audio".
- Whether an ad is for sale or wanted comes from a field in Finn's data. The text heuristic I tried first missed about half of the wanted ads.
