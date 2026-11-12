---
title: CT scan to printable skull
tagline: A CT scan turned into a watertight model for 3D printing
kind: design
order: 3
icon: skull
when: May–July 2026
stack: Python, NumPy, marching cubes
status: Done
---

The scan was cut off at the top and at the back. Both gaps are filled from one implicit surface in a single marching-cubes pass, so there's no seam, and the shape of the fill is measured from the scan's own overview images. To settle whether the fill matched the texture of the bone, I made a metric of my own after finding that the first one was dominated by an edge artefact.
