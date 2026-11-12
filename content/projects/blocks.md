---
title: Blocks
tagline: An experiment in treating code as a build artifact, written by a local model
kind: agents
order: 2
icon: blocks
when: July 2026
stack: TypeScript, React, SQLite, Qwen in LM Studio
status: Experiment, written up
image: blocks.webp
imageAlt: A small app's blocks in the editor, all of them verified
---

A block is defined by its intent (a name and a description), a typed interface and examples that serve as its contract. A local model writes the code and a verifier checks it against the examples, and I read the generated code only when verification fails.

## Highlights

- The loop is to generate, verify, feed the concrete failure back and try again. Eight sample domains were built unattended in about two hours, 28 of 31 transforms verified, and all eight repair rounds succeeded.
- The most useful result was a negative one: a block can pass every check and still ignore one of its inputs. Checking blocks one at a time can't catch that. A critic that reviews the interfaces did, and so did a person approving the plan.
- Drafted examples quietly choose semantics nobody asked for, such as which way to round, so the examples need a human review even when the code doesn't.
- A packing-list app built this way went through seven changes and a data migration without my reading its code, and a test with three browsers at once lost no writes.

![One block: its intent, its typed input and output, and the checks it has to pass](/img/projects/blocks-block.webp)
