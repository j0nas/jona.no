// Edit mode: tap a text to change it where it stands, or a photo to replace, add or remove it.
// What can be edited, and how, is marked on the page (data-edit, data-edit-kind; see
// worker/edits.ts). Each change goes to /<slug>/_edits as it's made and shows for everyone who
// opens the page from then on; the toast after each one can take it back.
//
// Text is finished without waiting for the server, so that a tap on the next text can open the
// phone's keyboard (it only opens within the tap). A save that fails puts the old text back.

import { pickPhoto, uploadPhoto } from "./photo.js";
import { api, bar, clean, fromLayer, showTab, toast } from "./ui.js";

const root = document.documentElement;
/** { type: "text", el, kind, before, isNew, anchor } or { type: "photo", el, kind } */
let current = null;
let busy = false;

export function startEditing() {
  showTab(false);
  root.classList.add("review-editing", "review-picking");
  document.addEventListener("click", onClick, true);
  idle();
}

function stopEditing() {
  if (current?.type === "text") saveText();
  deselect();
  root.classList.remove("review-editing", "review-picking");
  document.removeEventListener("click", onClick, true);
  bar(null);
  showTab(true);
}

function idle() {
  current = null;
  bar("Trykk på en tekst eller et bilde for å endre det", [
    { label: "Ferdig", onClick: stopEditing, primary: true },
  ]);
}

function onClick(e) {
  // The photo picker (photo.js) opens with a click of its own.
  if (fromLayer(e) || e.target.matches?.('input[type="file"]')) return;
  // Inside the text being edited, a tap moves the caret.
  if (current?.type === "text" && current.el.contains(e.target)) return;
  e.preventDefault();
  e.stopPropagation();
  if (busy) return;
  const hit = e.target.closest?.("[data-edit]");
  // Tapping elsewhere finishes the text being edited, as leaving a form field would.
  if (current?.type === "text") saveText();
  else {
    deselect();
    idle();
  }
  if (!hit) return;
  const target = hit.dataset.edit.endsWith("/photo")
    ? (hit.closest("figure[data-edit]") ?? hit)
    : hit;
  const kind = target.dataset.editKind;
  if (kind === "shot" || kind === "fixed") selectPhoto(target);
  else if (kind) editText(target, kind, { point: { x: e.clientX, y: e.clientY } });
}

// Text

function editText(el, kind, { point, anchor } = {}) {
  current = { type: "text", el, kind, before: el.textContent, isNew: !!anchor, anchor };
  el.classList.add("review-target");
  try {
    el.contentEditable = "plaintext-only";
  } catch {
    el.contentEditable = "true";
  }
  el.addEventListener("keydown", onKey);
  el.focus({ preventScroll: true });
  placeCaret(el, point);
  // Clear of the bar along the top.
  if (el.getBoundingClientRect().top < 90) el.scrollIntoView({ block: "center" });
  const list = kind === "p" || kind === "li";
  bar(current.isNew ? "Ny tekst" : "Endre teksten", [
    { label: "Avbryt", onClick: cancelText },
    ...(list && !current.isNew ? [{ label: "Slett", onClick: deleteText }] : []),
    ...(list ? [{ label: "Ny under", onClick: addBelow }] : []),
    { label: "Lagre", onClick: () => saveText(), primary: true },
  ]);
}

function onKey(e) {
  if (e.key === "Enter") {
    e.preventDefault();
    saveText();
  } else if (e.key === "Escape") {
    e.preventDefault();
    cancelText();
  }
}

function finishText(el) {
  el.removeAttribute("contenteditable");
  el.removeEventListener("keydown", onKey);
  el.classList.remove("review-target");
  el.blur();
}

function saveText() {
  const c = current;
  if (c?.type !== "text") return;
  finishText(c.el);
  idle();
  const text = clean(c.el.textContent);
  if (c.isNew) {
    if (!text) return void c.el.remove();
    c.el.textContent = text;
    // A text added below this one needs this one's id, which the server gives.
    c.el.saved = (async () => {
      const after = c.anchor.dataset.edit ?? (await c.anchor.saved);
      const { edit } = await post({ kind: "insert", after, block: { type: c.kind, text } });
      c.el.dataset.edit = `new/${edit.id}`;
      toast("Lagt til.", () => undo(edit, () => c.el.remove()));
      return c.el.dataset.edit;
    })().catch(() => {
      c.el.remove();
      failed();
      return null;
    });
    return;
  }
  if (text === clean(c.before)) return void (c.el.textContent = c.before);
  if (!text && c.kind !== "text") {
    c.el.textContent = c.before;
    return removeElement(c.el);
  }
  if (!text && !c.el.dataset.edit.endsWith("/cap")) {
    c.el.textContent = c.before;
    return toast("En overskrift kan ikke være tom.");
  }
  c.el.textContent = text;
  post({ kind: "text", target: c.el.dataset.edit, text, before: clean(c.before) })
    .then(({ edit }) => toast("Lagret.", () => undo(edit, () => (c.el.textContent = c.before))))
    .catch(() => {
      c.el.textContent = c.before;
      failed();
    });
}

function cancelText() {
  const c = current;
  finishText(c.el);
  idle();
  if (c.isNew) c.el.remove();
  else c.el.textContent = c.before;
}

function deleteText() {
  const c = current;
  finishText(c.el);
  c.el.textContent = c.before;
  idle();
  removeElement(c.el);
}

function addBelow() {
  const c = current;
  if (!clean(c.el.textContent)) return void c.el.focus();
  saveText();
  const el = document.createElement(c.el.tagName);
  el.dataset.editKind = c.kind;
  c.el.after(el);
  editText(el, c.kind, { anchor: c.el });
}

function placeCaret(el, point) {
  let range = null;
  if (point && document.caretPositionFromPoint) {
    const at = document.caretPositionFromPoint(point.x, point.y);
    if (at && el.contains(at.offsetNode)) {
      range = document.createRange();
      range.setStart(at.offsetNode, at.offset);
    }
  } else if (point && document.caretRangeFromPoint) {
    const at = document.caretRangeFromPoint(point.x, point.y);
    if (at && el.contains(at.startContainer)) range = at;
  }
  if (!range) {
    range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
  }
  const selection = getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

// Photos

function selectPhoto(fig) {
  current = { type: "photo", el: fig, kind: fig.dataset.editKind };
  fig.classList.add("review-target");
  const loose = current.kind === "shot";
  bar("Bildet", [
    { label: "Bytt", onClick: replacePhoto },
    ...(loose
      ? [
          { label: "Legg til etter", onClick: addPhoto },
          {
            label: "Fjern",
            onClick: () => {
              deselect();
              idle();
              removeElement(fig);
            },
          },
        ]
      : []),
    {
      label: "Avbryt",
      onClick: () => {
        deselect();
        idle();
      },
    },
  ]);
}

function deselect() {
  if (current?.type === "photo") current.el.classList.remove("review-target");
}

async function withUpload(work) {
  const fig = current.el;
  const file = await pickPhoto();
  if (!file || current?.el !== fig) return;
  busy = true;
  bar("Laster opp bildet …");
  try {
    await work(fig, await uploadPhoto(file));
  } catch {
    failed("Fikk ikke lastet opp bildet. Prøv igjen.");
  } finally {
    busy = false;
    fig.classList.remove("review-target");
    idle();
  }
}

function replacePhoto() {
  return withUpload(async (fig, photo) => {
    const media = fig.querySelector('[data-edit$="/photo"]');
    const { edit, html } = await post({
      kind: "photo",
      target: fig.dataset.edit,
      photo,
      before: photoName(fig),
      media: media.tagName === "IMG" ? "img" : "button",
    });
    const fresh = fromHtml(html);
    const style = fig.getAttribute("style");
    media.replaceWith(fresh);
    if (style !== null) fig.style.setProperty("--r", (photo.w / photo.h).toFixed(4));
    toast("Bildet er byttet.", () =>
      undo(edit, () => {
        fresh.replaceWith(media);
        if (style !== null) fig.setAttribute("style", style);
      }),
    );
  });
}

function addPhoto() {
  return withUpload(async (fig, photo) => {
    const { edit, html } = await post({
      kind: "insert",
      after: fig.dataset.edit,
      block: { type: "shot", photo, caption: "" },
    });
    const fresh = fromHtml(html);
    fig.after(fresh);
    toast("Bildet er lagt til. Trykk under det for å skrive en bildetekst.", () =>
      undo(edit, () => fresh.remove()),
    );
  });
}

function photoName(fig) {
  const media = fig.querySelector('[data-edit$="/photo"]');
  const img = media?.tagName === "IMG" ? media : media?.querySelector("img");
  return img?.getAttribute("src") ?? media?.getAttribute("poster") ?? "";
}

// Both

function removeElement(el) {
  const parent = el.parentNode;
  const next = el.nextSibling;
  const before = el.matches("figure") ? photoName(el) : clean(el.textContent);
  el.remove();
  const putBack = () => parent.insertBefore(el, next?.parentNode === parent ? next : null);
  post({ kind: "remove", target: el.dataset.edit, before })
    .then(({ edit }) => toast("Fjernet.", () => undo(edit, putBack)))
    .catch(() => {
      putBack();
      failed();
    });
}

async function post(body) {
  const res = await fetch(api("_edits"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`edit ${res.status}`);
  return res.json();
}

/** Takes an edit back on the server, then on the page. */
async function undo(edit, restore) {
  const res = await fetch(api(`_edits/${edit.id}`), {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ status: "undone" }),
  }).catch(() => null);
  if (!res?.ok) return toast("Fikk ikke angret. Prøv igjen om litt.");
  restore();
  toast("Angret.");
}

function failed(message = "Fikk ikke lagret endringen. Sjekk nettet og prøv igjen.") {
  toast(message);
}

function fromHtml(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}
