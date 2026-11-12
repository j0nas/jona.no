---
title: Floor Planner
tagline: Lays out a click-laminate floor for a room and says how many packs to buy
kind: design
order: 1
icon: floor-planner
when: June–September 2026
stack: TypeScript, React, Tailwind, Clipper2
status: Done
links: [Open it](/floor-planner) ([code](https://github.com/j0nas/floor-boards-planner))
image: floor-planner.webp
imageAlt: The Floor Planner's layout of a room, with its cut list
---

The Floor Planner takes the shape of a room and a board size and lays out the floor: the rows, the staggered cuts, which offcuts to reuse, the waste and how many packs to buy. It runs in the browser and is also a window on this desktop, served from its own deploy.

## Highlights

- The core is pure and deterministic. It tries both board directions and picks by validity, stagger, balance and then waste, and it matches offcuts to the cuts that need them.
- An independent check, run under fuzz tests, rebuilds the floor from the plan and confirms that the pieces cover the room exactly.
- Room width and length are measured at both ends, so a wall that is out of square shows up in the plan. Every input recalculates the plan, the cut list and the material estimate live.
- It exports a printable page, a CSV cut list and the project as JSON.
- It deploys itself to GitHub Pages on every push, and this site proxies the live build.
