// The comment layer on a private page (worker/private.ts), which the Worker adds to the page only
// for whoever signed in with the page's review password. On a computer it is Agentation's
// toolbar: click anything, write a note. Agentation doesn't work on phones, so there a
// "Kommenter" tab on the right edge does the same: tap it, tap the thing, write. Each note goes to
// /<slug>/_feedback/<id> (worker/feedback.ts) as soon as it's written; one that doesn't get
// through waits in localStorage and is sent on the next visit. Mirrors adam-tracker's feedback.

const API = `/${location.pathname.split("/")[1]}/_feedback/`;
const UNSENT = "feedback-unsent";
const ACCENT = "#c026d3";

const host = document.createElement("div");
const ui = host.attachShadow({ mode: "open" });
const desktop = matchMedia("(pointer: fine) and (min-width: 900px)").matches;

ui.innerHTML = `<style>
  :host { font: 16px/1.4 var(--text, system-ui, -apple-system, sans-serif); }
  [hidden] { display: none !important; }
  button { font: inherit; cursor: pointer; }
  .toast { position: fixed; left: 50%; bottom: max(env(safe-area-inset-bottom), 20px); z-index: 2147483001; transform: translateX(-50%); max-width: min(92vw, 420px); padding: 10px 16px; border-radius: 12px; background: #1e2a24; color: #fff; font-size: 15px; box-shadow: 0 6px 24px rgb(0 0 0 / 0.25); }
  .tab { position: fixed; right: 0; top: 50%; z-index: 2147483000; transform: translateY(-50%); display: flex; padding: 12px 5px; border: 0; border-radius: 12px 0 0 12px; background: ${ACCENT}; color: #fff; font-size: 12px; font-weight: 600; box-shadow: 0 4px 16px rgb(112 26 117 / 0.35); }
  .tab span { writing-mode: vertical-rl; }
  .bar { position: fixed; inset: 0 0 auto; z-index: 2147483000; display: flex; align-items: center; gap: 8px; padding: max(env(safe-area-inset-top), 12px) 12px 12px 16px; background: ${ACCENT}; color: #fff; box-shadow: 0 4px 16px rgb(0 0 0 / 0.2); }
  .bar p { flex: 1; margin: 0; font-size: 15px; font-weight: 500; }
  .bar button { border: 0; border-radius: 999px; padding: 6px 12px; background: rgb(255 255 255 / 0.2); color: #fff; font-size: 14px; font-weight: 600; }
  .sheet { position: fixed; inset: 0 0 auto; z-index: 2147483000; display: grid; gap: 10px; padding: max(env(safe-area-inset-top), 14px) 16px 16px; background: #fff; color: #1e2a24; box-shadow: 0 8px 32px rgb(0 0 0 / 0.3); }
  .about { margin: 0; padding: 8px 12px; border-radius: 8px; background: #fae8ff; color: #701a75; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  textarea { font: inherit; font-size: 16px; padding: 10px 12px; border: 1px solid #cfd4cc; border-radius: 8px; resize: vertical; color: inherit; background: #fff; }
  .actions { display: flex; justify-content: flex-end; gap: 8px; }
  .actions button { border: 0; border-radius: 8px; padding: 10px 18px; font-weight: 600; }
  .cancel { background: #eef0ec; color: #1e2a24; }
  .send { background: ${ACCENT}; color: #fff; }
  .send:disabled { opacity: 0.5; }
</style>
<div class="toast" role="status" hidden></div>
${
  desktop
    ? ""
    : `<button class="tab" aria-label="Kommenter noe på siden"><span>Kommenter</span></button>
<div class="bar" hidden>
  <p>Trykk på det du vil kommentere</p>
  <button class="whole">Hele siden</button>
  <button class="stop" aria-label="Avbryt">✕</button>
</div>
<form class="sheet" hidden>
  <p class="about"></p>
  <textarea rows="4" placeholder="Hva bør endres?"></textarea>
  <div class="actions">
    <button type="button" class="cancel">Avbryt</button>
    <button class="send" disabled>Send</button>
  </div>
</form>`
}`;
document.body.append(host);

const $ = (selector) => ui.querySelector(selector);
const here = () => location.pathname + location.search;

let toastTimer;
function toast(message) {
  const el = $(".toast");
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.hidden = true), 4000);
}

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
  const res = await fetch(API + encodeURIComponent(note.id), {
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

function retract(id) {
  keep(id);
  void fetch(API + encodeURIComponent(id), { method: "DELETE" }).catch(() => {});
}

for (const note of Object.values(unsent())) void send(note);

if (desktop) void toolbar();
else tapToComment();

async function toolbar() {
  const [{ createElement }, { createRoot }, { Agentation }] = await Promise.all([
    import("https://esm.sh/react@19.2.0"),
    import("https://esm.sh/react-dom@19.2.0/client"),
    import("https://esm.sh/agentation@3.1.2?deps=react@19.2.0,react-dom@19.2.0"),
  ]);
  const sync = ({ id, comment, element, elementPath, ...context }) =>
    void send({
      id: String(id),
      source: "agentation",
      page: here(),
      comment,
      element,
      elementPath,
      context,
    });
  const root = document.createElement("div");
  document.body.append(root);
  createRoot(root).render(
    createElement(Agentation, {
      appName: document.title,
      copyToClipboard: false,
      // What tells which photo a note is about.
      identifyingAttributes: ["src", "alt", "aria-label", "data-full"],
      onAnnotationAdd: sync,
      onAnnotationUpdate: sync,
      onAnnotationDelete: ({ id }) => retract(String(id)),
    }),
  );
}

function tapToComment() {
  // iOS only sends taps on plain elements as clicks when they look clickable.
  const page = document.createElement("style");
  page.textContent = `
    html.feedback-picking body * { cursor: pointer !important; }
    .feedback-target { outline: 3px solid ${ACCENT} !important; outline-offset: -3px; }`;
  document.head.append(page);

  const tab = $(".tab");
  const bar = $(".bar");
  const sheet = $(".sheet");
  const text = $("textarea");
  const sendButton = $(".send");
  let target = null;

  const onPick = (e) => {
    if (e.composedPath().includes(host)) return;
    e.preventDefault();
    e.stopPropagation();
    open(e.target instanceof Element ? e.target : null);
  };
  const picking = (on) => {
    bar.hidden = !on;
    tab.hidden = on;
    document.documentElement.classList.toggle("feedback-picking", on);
    if (on) document.addEventListener("click", onPick, true);
    else document.removeEventListener("click", onPick, true);
  };
  const open = (el) => {
    picking(false);
    tab.hidden = true;
    target = el;
    el?.classList.add("feedback-target");
    $(".about").textContent = el ? `Om: ${label(el)}` : "Om hele siden";
    sheet.hidden = false;
    text.focus();
  };
  const close = () => {
    target?.classList.remove("feedback-target");
    target = null;
    text.value = "";
    sendButton.disabled = true;
    sheet.hidden = true;
    tab.hidden = false;
  };

  tab.addEventListener("click", () => picking(true));
  $(".stop").addEventListener("click", () => picking(false));
  $(".whole").addEventListener("click", () => open(null));
  $(".cancel").addEventListener("click", close);
  text.addEventListener("input", () => (sendButton.disabled = !text.value.trim()));
  sheet.addEventListener("submit", async (e) => {
    e.preventDefault();
    const comment = text.value.trim();
    if (!comment) return;
    const note = {
      id: crypto.randomUUID(),
      source: "tap",
      page: here(),
      comment,
      ...describe(target),
    };
    close();
    if (await send(note)) toast("Takk, kommentaren er sendt.");
  });
}

const clean = (s) => (s ?? "").replace(/\s+/g, " ").trim();

/** An element's text with its pieces kept apart ("Før 3. oktober", not "Før3. oktober"). */
function words(el) {
  if (!el) return "";
  const parts = [];
  const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  while (walk.nextNode()) parts.push(walk.currentNode.textContent);
  return clean(parts.join(" "));
}

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
    const cls = [...node.classList].filter((c) => c !== "feedback-target").slice(0, 2);
    parts.unshift(node.tagName.toLowerCase() + (cls.length ? `.${cls.join(".")}` : ""));
  }
  return parts.join(" > ");
}
