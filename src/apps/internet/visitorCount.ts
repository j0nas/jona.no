// A joke, with no backend behind it: a fixed base plus a few "visitors" for every day since the
// counter was "installed". Nothing is stored or counted.
const BASE = 14_372;
const SINCE = Date.UTC(2026, 10, 6);
const PER_DAY = 3;
const DAY_MS = 86_400_000;

export function visitorCount(now: number = Date.now()): number {
  return BASE + PER_DAY * Math.max(0, Math.floor((now - SINCE) / DAY_MS));
}
