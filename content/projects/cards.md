---
title: Card printing and cutting
tagline: Playtest cards for Magic, printed and cut at home with my own cutter driver
kind: hardware
order: 1
icon: cards
when: May–November 2026
stack: Python, Bluetooth LE, Ghidra
status: In use
links: [mtg-proxy](https://github.com/j0nas/mtg-proxy), [my fork of silhouette-card-maker](https://github.com/j0nas/silhouette-card-maker), [write-up](/docs/mtg-proxying)
---

A decklist goes in and print-ready sheets come out. A photo printer prints them, they're laminated, and a Silhouette Cameo cutting machine cuts them out, driven by my own code. A card costs about half a krone, and the write-up has the numbers.

## Highlights

- I wrote my own driver for the cutter after recording what the vendor's app sends it over Bluetooth. The open-source driver I started with began its scan at the corner of the paper and moved the machine's origin on every job. Tests pin every command to the recorded session.
- The cutter finds three printed registration marks before it cuts. One sheet passed every check and was still cut off-register on one side. To find out why, I read the cutter's firmware in Ghidra: it never reports where it found the marks, and it computes the corners without checking how well they fit. Now my driver reads the cutter's sensor itself and finds the marks from those readings, in about 12 seconds compared with 76 for the cutter's own scan.
- The rule is to fix causes and never compensate. When a measured vernier sheet showed a 0.5 mm offset in one direction, I turned down a per-machine correction factor and went after the cause.
- A stale checkout once printed an old layout that was then cut against the new one. Now every cut checks that the code is current, and each sheet is stored with the code version and mark positions it was printed with.
- About 9,000 lines of Python and 6,000 lines of tests, around 1,000 tests that run in four seconds without the hardware, and a lessons file that records every wrong turn.
