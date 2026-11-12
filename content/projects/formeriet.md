---
title: Formeriet
tagline: A web shop for made-to-measure 3D-printed and laser-cut things
kind: web
order: 1
icon: formeriet
when: July–November 2026
stack: TypeScript, TanStack Start, Cloudflare Workers, D1, Stripe, three.js, manifold
status: Built, not open to customers yet
links: [formeriet.no](https://formeriet.no)
image: formeriet.webp
imageAlt: The self-watering planter's page, with the 3D model, its settings and the price
---

The customer adjusts a design in a live 3D view, sees a price worked out from the actual geometry and pays with Stripe, and I print or cut it on demand. There are ten products so far, among them planters, shower shelves, drawer dividers, trays and lamp shades, sold through storefronts for different kinds of products, with a back office for orders, stock and production.

It started in July as a shared toolkit for the parametric generators I had made for myself (deck boxes, stackable trays, a lamp shade designer) and grew into one monorepo. It's my biggest solo project: 848 commits and about 190,000 lines of TypeScript, 56,000 of them tests.

## Highlights

- Each product is a parameter schema and pure geometry functions. The same calls draw the preview, give the live price, set the server's price at checkout and regenerate the files for production, so what a customer pays for can't drift from what gets printed.
- The first price model counted 47% more plastic than the slicer did. I replaced it with a model of the print's shell and infill, calibrated against 50 slices, which brought the median error down to 4.8%.
- Printability is a test. A suite sweeps every option of every printed product and fails on overhangs, parts in mid-air and pieces that collide, and it found real flaws in products I thought were done.
- The geometry kernel is WebAssembly with manual memory, and its garbage collection missed some objects, so my wrapper tracks the lifetime of every solid itself.
- I moved it from Fly.io to Cloudflare in October. A price quote takes up to 2.3 seconds of CPU, far past the free plan's 10 ms, so it runs on the paid plan with a spending cap that takes the site offline before a bill can run away. All the storefronts run on one Worker and are told apart by host name.
- About 60% of the commits came out of sessions with Claude Code. What keeps the codebase coherent is written rules in the repo, one handoff queue split into my tasks and the agent's, a contract test every product has to pass, and architecture diagrams drawn from the code that fail a test when they drift.

## What's left

I haven't stocked filament, test-printed every product or checked my prices against what the materials really cost, so the shop is still behind a holding page.

![The drawer dividers, a grid sized to the drawer](/img/projects/formeriet-dividers.webp)

![A rendered display box with dovetail joints, one of the laser-cut products](/img/projects/formeriet-render.webp)
