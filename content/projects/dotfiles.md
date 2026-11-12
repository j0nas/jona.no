---
title: Dotfiles
tagline: My machines, declared in one repository, and how I work with coding agents
kind: agents
order: 1
icon: dotfiles
when: Since 2019, rebuilt in April 2026
stack: chezmoi, mise, Go
status: In daily use
links: [github.com/j0nas/dotfiles](https://github.com/j0nas/dotfiles)
---

My setup for macOS, Linux and Windows (WSL), installed on a new machine with one command. I rebuilt it in April 2026 around one rule: the machine converges on what the repository declares. Apps, editor extensions and command-line tools are listed in one place, and anything installed by hand that isn't declared is removed by the next weekly run, so experiments clean up after themselves.

## Highlights

- Tools only upgrade to releases that are at least seven days old, shell plugins are pinned archives with checksums, and a validation script, run by the pre-commit hook and by CI on macOS and Linux, rejects downloads that aren't pinned.
- The repo is also where I keep how I work with coding agents: short rules loaded into every session, such as looking up a library's current docs before trusting memory and trying several different approaches before calling something a blocker, and the tools those rules point to.
- claude-quota, in Go, reads my Claude usage, logs every agent I start, learns from that log what each model costs for each kind of task and plans a backlog against the 5-hour and weekly limits. When a limit would stop running agents mid-task, it wakes the session in time to suspend them, and lists them for resuming after the reset.
- llm-log keeps a short log per project of the decisions, dead ends and loose ends from each agent session, so the next session, or I, can find out why something is the way it is.
- Before that, from January to April, ralph: a CLI that runs Claude Code in a loop with fresh context each time and the state kept in files, after Geoffrey Huntley's "Ralph" technique.
