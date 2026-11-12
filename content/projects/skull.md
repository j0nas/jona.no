---
title: CT scan to printable skull
tagline: A CT scan turned into a watertight model for 3D printing
kind: design
order: 3
icon: skull
when: May–July 2026
stack: Python, NumPy, marching cubes
status: Done
image: skull-sliced.webp
imageAlt: The skull in Bambu Studio's preview, sliced and cut away at about 120 mm of its 215 mm height
---

A CT scan of a head, turned into a skull I can print at life size, 145 × 194 × 215 mm. The scan was cut off at the top and at the back. Both gaps are filled from one implicit surface in a single marching-cubes pass, so there's no seam, and the shape of the fill is measured from the scan's own overview images. To settle whether the fill matched the texture of the bone, I made a metric of my own after finding that the first one was dominated by an edge artefact.

## Highlights

- The input is a DICOM series of 284 slices, 512 × 512 voxels of 0.43 mm, one slice every 0.625 mm, read with pydicom and converted to Hounsfield units (HU, the scale CT reports density in). The study also holds two scouts, flat overview radiographs of the whole head.
- The surface is where the density crosses 300 HU. A threshold gives a binary volume that is cleaned (small holes per slice, a morphological opening, the largest connected piece), but only to decide which parts exist. The mesh comes from the grey HU values, because meshing the binary puts every surface on a voxel face and covers the skull in a diagonal staircase.
- The scan stops at the top, leaving a flat opening of 87 cm² with about 18 mm of crown missing, and the reconstruction's circular field of view (219 mm across) slices the back of the head flat. The scouts show the whole head and share the CT's patient coordinates, so they line up exactly. The side view puts the back of the head 19 mm past the cut (my first guess was 7 mm), and the two views together give the crown's outline. Where the CT isn't clipped, the scout's edge agrees with the CT's bone edge to within 0.2 to 0.4 mm.
- Each gap is an implicit shell written into the same density field. A biharmonic inpaint continues the surrounding bone with matching value and slope at the border, a dome is raised until it reaches the scout's outline, and the texture is image quilting of patches of the real vault's relief. The shell is stored as a signed distance scaled to HU by the bone surface's measured slope, so it crosses 300 HU at the same rate as the real bone. One marching-cubes pass (scikit-image) then meshes real and restored bone together. The back's seam step is 0.135 mm, against 0.253 mm of natural variation on the bone beside it.
- The texture is checked per scale: the restored surface's relief in each band of wavelengths, measured against intact bone beside it. The first metric read the crown's cap as too smooth when it was too rough, because 1 % of the reference's columns, all on the map's edge, held 76 % of its energy. A 2 mm guard fixed that, and a second measurement made directly on the mesh, without the map, agreed with it.
- A skull cut straight from CT is hard to print. Sliced base-down, 2111 regions of the model start in mid-air, and 1767 of them are inside the skull, in the marrow spaces and air cells, where no support could reach. Marrow reads +220 HU and air −900, so I fill every enclosed voxel that is above −300 HU and at least 12 mm clear of the outer skin. Nothing is removed. The model goes from 6 shells to 1, and the unsupported area falls from 660 to 264 mm².
- The mesh is written in millimetres straight from the voxel spacing, so it is life size and fits the H2C's 325 × 320 × 320 mm bed with room to scale to 1.48×. pymeshlab repairs non-manifold edges and closes small holes, which leaves one shell with 3.4 million triangles. The cut at the bottom of the scan is the base. Turned onto the back of the head, the islands that need support drop from 23 to 1, and a build option writes it that way.

I did this with Claude Code, and it is another case of an LLM working outside what is usually called coding: reading medical images, working out where a missing back of the head must lie, and judging whether a patch of surface looks like bone. The repository has a CLAUDE.md that records how the pipeline works and why, and a HANDOFF.md with what was verified when a session ended, so the next session starts from measurements. When the metric and a render disagreed, a measurement made without the metric's projection settled which was wrong.
