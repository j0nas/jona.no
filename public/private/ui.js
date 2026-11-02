// What the review layer's two modes share: the tab on the right edge, the bar along the top, the
// toast, and the styles they put on the page itself. The layer's own controls live in a shadow
// root, so the page's styles don't reach them; the page keeps its own font through --text.

export const ACCENT = "#c026d3";
export const slug = location.pathname.split("/")[1];
export const api = (path) => `/${slug}/${path}`;

export const host = document.createElement("div");
const ui = host.attachShadow({ mode: "open" });
ui.innerHTML = `<style>
  :host { font: 16px/1.4 var(--text, system-ui, -apple-system, sans-serif); }
  [hidden] { display: none !important; }
  button { font: inherit; cursor: pointer; }
  .tab { position: fixed; right: 0; top: 50%; z-index: 2147483000; transform: translateY(-50%); display: grid; gap: 1px; border-radius: 12px 0 0 12px; overflow: hidden; box-shadow: 0 4px 16px rgb(112 26 117 / 0.35); }
  .tab button { display: flex; padding: 12px 5px; border: 0; background: ${ACCENT}; color: #fff; font-size: 12px; font-weight: 600; }
  .tab button:active { filter: brightness(0.9); }
  .tab span { writing-mode: vertical-rl; }
  .bar { position: fixed; inset: 0 0 auto; z-index: 2147483000; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: max(env(safe-area-inset-top), 10px) 12px 10px 16px; background: ${ACCENT}; color: #fff; box-shadow: 0 4px 16px rgb(0 0 0 / 0.2); }
  .bar p { flex: 1 1 10rem; margin: 0; font-size: 15px; font-weight: 500; }
  .bar .buttons { display: flex; flex-wrap: wrap; gap: 6px; margin-left: auto; }
  .bar button { border: 0; border-radius: 999px; padding: 7px 13px; background: rgb(255 255 255 / 0.2); color: #fff; font-size: 14px; font-weight: 600; }
  .bar button.primary { background: #fff; color: ${ACCENT}; }
  .bar button:disabled { opacity: 0.5; }
  .sheet { position: fixed; inset: 0 0 auto; z-index: 2147483000; display: grid; gap: 10px; padding: max(env(safe-area-inset-top), 14px) 16px 16px; background: #fff; color: #1e2a24; box-shadow: 0 8px 32px rgb(0 0 0 / 0.3); }
  .about { margin: 0; padding: 8px 12px; border-radius: 8px; background: #fae8ff; color: #701a75; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  textarea { font: inherit; font-size: 16px; padding: 10px 12px; border: 1px solid #cfd4cc; border-radius: 8px; resize: vertical; color: inherit; background: #fff; }
  .actions { display: flex; justify-content: flex-end; gap: 8px; }
  .actions button { border: 0; border-radius: 8px; padding: 10px 18px; font-weight: 600; }
  .cancel { background: #eef0ec; color: #1e2a24; }
  .send { background: ${ACCENT}; color: #fff; }
  .send:disabled { opacity: 0.5; }
  .toast { position: fixed; left: 50%; bottom: max(env(safe-area-inset-bottom), 20px); z-index: 2147483001; transform: translateX(-50%); display: flex; align-items: center; gap: 14px; width: max-content; max-width: min(92vw, 440px); padding: 10px 12px 10px 16px; border-radius: 12px; background: #1e2a24; color: #fff; font-size: 15px; box-shadow: 0 6px 24px rgb(0 0 0 / 0.25); }
  .toast button { border: 0; border-radius: 8px; padding: 6px 10px; background: rgb(255 255 255 / 0.15); color: #fff; font-weight: 600; }
</style>
<div class="tab">
  <button class="edit" aria-label="Rediger siden"><span>Rediger</span></button>
  <button class="comment" aria-label="Kommenter noe på siden"><span>Kommenter</span></button>
</div>
<div class="bar" hidden><p></p><div class="buttons"></div></div>
<form class="sheet" hidden>
  <p class="about"></p>
  <textarea rows="4" placeholder="Hva bør endres?"></textarea>
  <div class="actions">
    <button type="button" class="cancel">Avbryt</button>
    <button class="send" disabled>Send</button>
  </div>
</form>
<div class="toast" role="status" hidden><span></span><button hidden>Angre</button></div>`;
document.body.append(host);

export const $ = (selector) => ui.querySelector(selector);
export const fromLayer = (e) => e.composedPath().includes(host);

const page = document.createElement("style");
page.textContent = `
  /* iOS only sends taps on plain elements as clicks when they look clickable. */
  html.review-picking body * { cursor: pointer !important; }
  html.review-editing [data-edit-kind="text"], html.review-editing [data-edit-kind="p"],
  html.review-editing [data-edit-kind="li"], html.review-editing [data-edit$="/photo"] {
    outline: 1.5px dashed rgb(192 38 211 / 0.6); outline-offset: 3px;
  }
  /* Photos sit in boxes that clip anything outside them, so theirs is drawn inside. */
  html.review-editing [data-edit$="/photo"] { outline-offset: -3px; }
  .review-target, html.review-editing .review-target {
    outline: 3px solid ${ACCENT} !important; outline-offset: 3px;
  }
  figure.review-target, .review-target[data-edit$="/photo"] { outline-offset: -3px !important; }
  [contenteditable].review-target { background: rgb(192 38 211 / 0.1); }
  /* An empty caption or a new paragraph still needs something to tap and to type into. */
  html.review-editing [data-edit-kind]:empty { min-height: 1.5em; min-width: 6em; }
  html.review-editing span[data-edit-kind]:empty { display: inline-block; }
  html.review-editing [data-edit-kind]:empty::before { content: "Skriv her"; opacity: 0.5; }
  html.review-editing [data-edit$="/cap"]:empty::before { content: "Skriv en bildetekst"; }`;
document.head.append(page);

/** Shows the tab, or hides it while a mode is on. */
export function showTab(on) {
  $(".tab").hidden = !on;
}

/** The bar along the top: a message and buttons ({ label, onClick, primary }); null hides it. */
export function bar(message, buttons = []) {
  const el = $(".bar");
  el.hidden = message === null;
  if (message === null) return;
  el.querySelector("p").textContent = message;
  el.querySelector(".buttons").replaceChildren(
    ...buttons.map(({ label, onClick, primary }) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      if (primary) b.className = "primary";
      b.addEventListener("click", onClick);
      return b;
    }),
  );
}

let toastTimer;
/** A short message at the bottom; with `undo`, an "Angre" button that runs it. */
export function toast(message, undo) {
  const el = $(".toast");
  const button = el.querySelector("button");
  el.querySelector("span").textContent = message;
  button.hidden = !undo;
  button.onclick = undo
    ? () => {
        el.hidden = true;
        undo();
      }
    : null;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.hidden = true), undo ? 8000 : 4000);
}

export const clean = (s) => (s ?? "").replace(/\s+/g, " ").trim();

/** An element's text with its pieces kept apart ("Før 3. oktober", not "Før3. oktober"). */
export function words(el) {
  if (!el) return "";
  const parts = [];
  const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  while (walk.nextNode()) parts.push(walk.currentNode.textContent);
  return clean(parts.join(" "));
}
