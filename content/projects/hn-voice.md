---
title: Voice-controlled HN reader
tagline: A Hacker News reader you reconfigure by talking to a small local model
kind: agents
order: 4
icon: hn-voice
when: April 2026
stack: TypeScript, Gemma in LM Studio, promptfoo
status: Proof of concept
image: hn-voice.webp
imageAlt: The reader in a dark theme, each story showing only its title and points
links: [code](https://github.com/j0nas/hn-voice-config)
---

A small local model (Gemma 4 E4B) turns what you say into a tool call that changes the reader's settings, and a promptfoo suite measures how often it gets them right. I made it to find out how far a model that runs on a laptop gets with tool calls.

The model has one tool, `updateConfig`, which takes a patch of the settings it wants to change:

- the feed (top, new, best, ask, show or jobs) and how many stories to list
- the colours: background, text, accent and muted text
- which parts of a row show (rank, title, domain, points, author, age, comment count) and the app's header, each set by a small expression the reader evaluates per story, so a rank can be letters or a title can go upper case above 200 points
- a rule for which stories show at all, such as only those from github.com
- text and row styling, such as font size, weight and rounded corners

The screenshot is the reader after one typed command, "use a dark theme and show only titles and scores". Some examples of what the model returns:

| You say                       | Tool call                                                                                                         |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| switch to the new feed        | `{"feed":"new"}`                                                                                                  |
| show titles and scores only   | `{"keepOnly":["title","score"]}`                                                                                  |
| make titles bigger and bold   | `{"style":{"title":{"fontSize":20,"fontWeight":"bold"}}}`                                                         |
| only show stories from github | `{"slots":{"visible":{"fn":"contains","args":[{"fn":"host","args":[{"var":"item.url"}]},{"lit":"github.com"}]}}}` |

If a call is malformed, the app sends the validation error back to the model once and it tries again. In the promptfoo suite of 63 utterances, that retry took the pass rate from 95% to 100%.
