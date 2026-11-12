---
title: Kindles
tagline: Four old Kindles that show something useful while they sleep
kind: hardware
order: 2
icon: kindles
when: May–November 2026
stack: Python, Lua, shell, KOReader, launchd, local and cloud models
status: In daily use
image: kindles.webp
imageAlt: A Kindle sleep screen, a public-domain engraving
---

Four Kindles made between 2010 and 2015, jailbroken and running KOReader, which sync with the household's e-book library on our media server.

## Highlights

- The Paperwhite 3 shows a Hacker News front page that my Mac rebuilds every hour. A local Qwen model sums up each story and its discussion in a few words, with a prompt that forbids guessing names or numbers, and the layout drops summaries until the page fits the screen.
- The Kindle Keyboard shows my next actions from Obsidian, written up as cards by Claude Opus with Qwen as fallback. For that I reimplemented the Obsidian Tasks plugin's parsing and sorting in Python and test it against a capture from Obsidian itself. It also has an AI chat: one key combination asks a question, another saves a note to Obsidian.
- The Kindle 4 shows public-domain art, dithered for its 16 shades of grey, with the battery level drawn on by the device.
- The hardest part was getting a sleeping Paperwhite to wake itself, join Wi-Fi, fetch a picture and go back to sleep. The obvious ways of waking it left Wi-Fi off, and only one call to its power daemon gave a real resume. I logged every dead end on the way.
- I tracked down a KOReader bug where the auto-suspend timer got a negative delay on USB power and spun at 100% CPU, and backported the upstream fix.
- A watchdog on the Mac notices when the Kindles' fetches start failing, restarts Wi-Fi when the Mac has joined the network with a private MAC address, and notifies me after three misses.

![The top of the Hacker News screen: a story's title, its summary and the gist of the discussion](/img/projects/kindles-hn.webp)
