---
title: edh.land
tagline: A deck builder for Commander that suggests cards from what's already in your deck
kind: web
order: 2
icon: edh-land
when: September–October 2026
stack: React, Tailwind, Cloudflare Workers, Hono, d3
status: Live, no real users yet
links: [edh.land](https://edh.land)
image: edh-land.webp
imageAlt: The tree view, branching from a commander into suggested cards
---

Commander is a format of Magic: The Gathering where a deck is 100 different cards built around one legendary creature. In edh.land you start from a commander or import a deck, add a card, and the view branches into the cards that go well with what you already have, based on EDHREC's data on what real decks contain. There's a tree, a force-directed web and a plain list, a count of the deck's roles (ramp, card draw, removal and so on) against the average deck, combos, and export back to Moxfield or Archidekt.

## Highlights

- A suggestion's score is the sum of its links to the cards already in the deck, each weighted by √inclusion × log₂(lift), so cards that fit several of your picks rise. I tuned the weights with a held-out evaluation on real decklists. The same evaluation showed that boosting cards for their role made the suggestions worse, so roles became a filter.
- There's no card database of my own. The browser reads EDHREC and Scryfall directly and caches the responses in IndexedDB, with Scryfall requests paced across tabs by a Web Lock. The Worker relays only the three services that don't allow cross-origin calls, each behind an allowlist of paths.
- Accounts are optional and only sync decks. The browser holds the truth, the newest change wins, deletions travel as tombstones, and the server caps timestamps so that a device with a wrong clock can't win every conflict.
- 125 commits in its first two and a half weeks, after which it moved into the Formeriet monorepo.

## What's left

Before I launch it I want an OK from the data sources and some sign that people come back to use the role filter.

![The same deck in the web view, cards linked by how often they're played together](/img/projects/edh-land-web.webp)
