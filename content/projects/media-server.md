---
title: Home media server
tagline: The household's films, music and books, run largely by a coding agent
kind: hardware
order: 3
icon: media-server
when: 2026
stack: Linux, Jellyfin, Navidrome, Audiobookshelf, Calibre-Web, Python, Whisper
status: In daily use
---

Films, series, music, audiobooks and e-books on a rented Linux server, with apps on the TV, phones and e-readers. A coding agent does most of the day-to-day work over SSH and the services' APIs, guided by a document I wrote with how-tos and guardrails, such as backing up before an upgrade and asking before deleting anything.

## Highlights

- A nightly backup of every service's state, run from my Mac: SQLite's online backup API for 12 databases, an integrity check of each copy and a notification if anything fails, tested by removing a database on purpose.
- A subtitle checker. Whisper transcribes three short clips of a video, and word trigrams tell whether a subtitle file belongs to it: the right file scores 0.5–0.9 and a wrong episode under 0.05. A least-squares fit then re-times it. Of 382 files checked, 55 were wrong.
- To run the music library manager, a .NET app, inside the server's 10 GB limit, I capped the garbage collector's range (.NET reserves 256 GB of address space at startup) and the number of glibc allocation arenas, which on a 128-core machine had pushed it to 9.2 GB.
- A video froze in places a full decode with ffmpeg didn't flag. Gaps in the packet timestamps from ffprobe found all eight holes.
- A watchdog for failures that make no noise, written after an upgrade quietly broke the link between two services and nothing new showed up as available for five days.
