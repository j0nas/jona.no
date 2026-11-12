---
title: Floor and lamp designers
tagline: Two browser tools for things at home, a floor layout planner and a lamp shade designer
kind: design
order: 1
icon: floor-and-lamp
when: June–October 2026
stack: TypeScript, React, three.js, manifold, OpenCascade
status: Done
links: [Floor Planner](/floor-planner) ([code](https://github.com/j0nas/floor-boards-planner)), [Lamp Shade Designer code](https://github.com/j0nas/lamp-shade-designer)
image: floor-planner.webp
imageAlt: The Floor Planner's layout of a room, with its cut list
---

The Floor Planner lays out a click-laminate floor for a room: the rows, the staggered cuts, which offcuts to reuse, the waste and how many packs to buy. The Lamp Shade Designer makes 3D-printable shades of up to six nested layers, shows the light pattern they cast on a wall and exports files for printing and for CAD.

## Highlights

- The Floor Planner's core is pure and deterministic. It tries both board directions and picks by validity, stagger, balance and then waste, and it matches offcuts to the cuts that need them. An independent check rebuilds the floor from the plan and confirms that the pieces cover it exactly, under fuzz tests.
- The Lamp Shade Designer uses two geometry kernels for one design: manifold for the hundreds of perforations in the printable mesh, and OpenCascade for a STEP file with real cylinders in it. A test checks that the two agree on volume and bounds. Builds run in a Web Worker where the latest request wins, so dragging stays smooth.

![The Lamp Shade Designer with the lamp on, its perforations cast on the wall](/img/projects/lamp-shade-designer.webp)
