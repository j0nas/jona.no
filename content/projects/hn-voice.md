---
title: Voice-controlled HN reader
tagline: A Hacker News reader you reconfigure by talking to a small local model
kind: agents
order: 4
icon: hn-voice
when: April 2026
stack: TypeScript, Gemma in LM Studio, promptfoo
status: Proof of concept
links: [code](https://github.com/j0nas/hn-voice-config)
---

A small local model (Gemma 4 E4B) turns what you say into tool calls that change the reader's settings, and a promptfoo suite measures how often it gets them right. I made it to find out how far a model that runs on a laptop gets with tool calls.
