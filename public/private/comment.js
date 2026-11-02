// Comment mode: tap the thing, write a note. Notes go to /<slug>/_feedback/<id>
// (worker/feedback.ts) for whoever makes the page; one that doesn't get through waits in
// localStorage and is sent on the next visit.

import { $, api, bar, clean, fromLayer, showTab, toast, words } from "./ui.js";

const UNSENT = "feedback-unsent";

function unsent() {
  try {
    return JSON.parse(localStorage.getItem(UNSENT) ?? "{}");
  } catch {
    return {};
  }
}

/** Remembers a note until the server has it; without a note, forgets the id. */
function keep(id, note) {
  try {
    const all = unsent();
    if (note) all[id] = note;
    else delete all[id];
    localStorage.setItem(UNSENT, JSON.stringify(all));
  } catch {
    // No storage (private browsing): the note is only tried once.
  }
}

async function send(note) {
  keep(note.id, note);
  const res = await fetch(api(`_feedback/${encodeURIComponent(note.id)}`), {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(note),
  }).catch(() => null);
  // A note the server turned down as malformed would only be turned down again.
  if (res?.ok || res?.status === 400 || res?.status === 413) keep(note.id);
  if (res?.ok) return true;
  toast("Fikk ikke sendt kommentaren. Prøver igjen neste gang du åpner siden.");
  return false;
}

export function sendUnsent() {
  for (const note of Object.values(unsent())) void send(note);
}

const sheet = $(".sheet");
const text = $("textarea");
const sendButton = $(".send");
let target = null;

const onPick = (e) => {
  if (fromLayer(e)) return;
  e.preventDefault();
  e.stopPropagation();
  open(e.target instanceof Element ? e.target : null);
};

function picking(on) {
  document.documentElement.classList.toggle("review-picking", on);
  if (on) {
    document.addEventListener("click", onPick, true);
    bar("Trykk på det du vil kommentere", [
      { label: "Hele siden", onClick: () => open(null) },
      { label: "Avbryt", onClick: close },
    ]);
  } else {
    document.removeEventListener("click", onPick, true);
    bar(null);
  }
}

export function startComment() {
  showTab(false);
  picking(true);
}

function open(el) {
  picking(false);
  target = el;
  el?.classList.add("review-target");
  $(".about").textContent = el ? `Om: ${label(el)}` : "Om hele siden";
  sheet.hidden = false;
  text.focus();
}

function close() {
  picking(false);
  target?.classList.remove("review-target");
  target = null;
  text.value = "";
  sendButton.disabled = true;
  sheet.hidden = true;
  showTab(true);
}

$(".cancel").addEventListener("click", close);
text.addEventListener("input", () => (sendButton.disabled = !text.value.trim()));
sheet.addEventListener("submit", async (e) => {
  e.preventDefault();
  const comment = text.value.trim();
  if (!comment) return;
  const note = {
    id: crypto.randomUUID(),
    source: "tap",
    page: location.pathname + location.search,
    comment,
    ...describe(target),
  };
  close();
  if (await send(note)) toast("Takk, kommentaren er sendt.");
});

function caption(el) {
  const fig = el.closest("figure");
  return (
    words(fig?.querySelector("figcaption")) ||
    clean(el.closest("[aria-label]")?.getAttribute("aria-label"))
  );
}

/** What the note is about, as the composer shows it. */
function label(el) {
  if (el.closest("img, video, picture, button.zoom") || el.querySelector?.("img, video")) {
    const cap = caption(el);
    return cap ? `bildet «${cap}»` : "bildet";
  }
  const t = words(el);
  return t ? `«${t.slice(0, 60)}»` : el.tagName.toLowerCase();
}

/** The last heading before the element: the room or job it belongs to. */
function heading(el) {
  const before = [...document.querySelectorAll("h1, h2, h3")].filter(
    (h) => h.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING || h.contains(el),
  );
  return words(before.at(-1));
}

function describe(el) {
  const context = { viewport: `${innerWidth}×${innerHeight}`, userAgent: navigator.userAgent };
  if (!el) return { element: "(hele siden)", elementPath: "", context };
  const media = el.closest("img, video") ?? el.querySelector("img, video");
  const text = words(el).slice(0, 80);
  return {
    element: el.tagName.toLowerCase() + (text ? `: "${text}"` : ""),
    elementPath: pathOf(el),
    context: {
      ...context,
      editId: el.closest("[data-edit]")?.getAttribute("data-edit") ?? undefined,
      heading: heading(el),
      image: media?.getAttribute("src") ?? media?.getAttribute("poster") ?? undefined,
      caption: caption(el) || undefined,
      nearbyText: words(el.closest("figure, li, p, details") ?? el.parentElement).slice(0, 300),
    },
  };
}

/** A short CSS-ish path to an element, for finding it in the page's source later. */
function pathOf(el) {
  const parts = [];
  for (
    let node = el;
    node && node !== document.body && parts.length < 6;
    node = node.parentElement
  ) {
    const cls = [...node.classList].filter((c) => c !== "review-target").slice(0, 2);
    parts.unshift(node.tagName.toLowerCase() + (cls.length ? `.${cls.join(".")}` : ""));
  }
  return parts.join(" > ");
}
