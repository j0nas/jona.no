---
title: Lamp Shade Designer
tagline: Designs 3D-printable lamp shades and shows the light pattern they cast on a wall
kind: design
order: 5
icon: lamp-shade-designer
when: July–October 2026
stack: TypeScript, three.js, manifold, OpenCascade
status: Moved into Formeriet
links: [Code](https://github.com/j0nas/lamp-shade-designer)
image: lamp-shade-designer.webp
imageAlt: The Lamp Shade Designer with the lamp on, its perforations cast on the wall
---

The Lamp Shade Designer makes shades of up to six nested layers, each with its own pattern of perforations. It shows the light the shade casts on a wall and exports files for printing and for CAD.

## Highlights

- Two geometry kernels build one design: manifold cuts the hundreds of perforations in the printable mesh, and OpenCascade makes a STEP file with real cylinders in it. A test checks that the two agree on volume and bounds.
- Builds run in a Web Worker where the latest request wins, so dragging stays smooth.
- The preview is three.js, with a bulb at the real socket height so the perforations show on the wall.
- The shade is now a product in [Formeriet](/project/formeriet)'s lamp store, and this repo is kept for its history.
