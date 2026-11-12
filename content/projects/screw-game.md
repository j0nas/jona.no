---
title: Screw-sorting game
tagline: A 3D game about sorting a workshop by hand
kind: design
order: 4
icon: screw-game
when: August–September 2026
stack: Godot 4, GDScript, Jolt physics
status: Three milestones built, waiting for a playtest
image: screw-game.webp
imageAlt: The workbench in the shed, with a pile of brass and steel screws between two glass jars
---

You sort a dead relative's workshop, and every can of screws is a project they built. Sorting has to be satisfying on its own before anything else matters, so real piles, physics and rummaging came first.

![The tool wall, with a magnet wand, pans and brushes hung on a pegboard with prices in screws](/img/projects/screw-game-2.webp)

## Highlights

- The world runs at ten times real scale to stay inside the physics engine's comfortable range, with real millimetres converted in one place.
- When my fans got loud, I found a lighting pass had tripled the GPU time to 15.7 ms. Metal's profiler reported zeros, so I profiled through Vulkan, then got it down to 7.6 ms by turning off one effect and rendering at 77% with FSR2 upscaling. Frame rate was the wrong measure, because the frame was bound by the CPU.
