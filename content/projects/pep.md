---
title: Pep
tagline: Hosting where the customer is an AI agent and the human is the sponsor
kind: web
order: 5
icon: pep
when: February–April 2026
stack: TypeScript, Effect, Fastify, Postgres, Fly.io Machines, MCP
status: Paused, no real users
links: [pep.dev](https://pep.dev)
image: pep.webp
imageAlt: The pep.dev holding page, ink flowing out of the letters
---

An agent deploys an app through Pep's MCP tool, within a budget, and every app has a contract with a time to live and a spending ceiling that Pep enforces by itself. I built it in the evenings alongside my last contract, and it has been paused since April.

## Highlights

- A deploy builds the source with Nixpacks on Fly's remote builders and runs it on a Fly Machine, with an optional Postgres database on Neon or a SQLite volume.
- It's written with Effect: services are layers, and each provider has its own tagged error type, so every failure says which call to which provider broke.
- Contract tests run against the providers' own OpenAPI specs through MSW, using the real HTTP layer.
- Before building, I wrote down what would make me stop: fewer than about 20 organisations deploying every week.
- In October I made the holding page that's there now. The wordmark is a WebGL2 fluid simulation: the letters give off ink, and the pointer stirs it.
