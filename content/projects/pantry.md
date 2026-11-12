---
title: Pantry workstation
tagline: A workbench for the 3D printer and laser cutter, modelled from Python
kind: design
order: 2
icon: pantry
when: September–November 2026
stack: Fusion 360, driven from Python
status: Being built
image: pantry.webp
imageAlt: A render of the workstation's shelves and benches
---

A workbench in our pantry for the 3D printer and the laser cutter, with storage and a path for the laser's exhaust. The model is parametric, with 126 parameters and 214 bodies, generated from Python, and every dimension is derived from what it holds: the bench's height, for example, comes from the storage boxes stacked under it. A script makes the cut list and fits the 12 OSB pieces onto 5 sheets.

I'm also using it to see what LLMs can do outside conventional coding. Claude Code built the model by running Python inside Fusion 360 through an MCP server, and keeps the design's decisions and measurements in a handoff file. I describe a change, such as moving the bench to the back wall, and it edits the parameters, regenerates the cut list and re-renders. Once it's built, the workbench is where I'll print and cut what [Formeriet](/project/formeriet) sells.
