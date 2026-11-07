import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import AppWindow, { type WindowControls } from "../../components/window/AppWindow";
import { MenuBar, StatusBar } from "../../win95";
import Clippy, { assistantClosed, setAssistantClosed } from "./Clippy";
import { EASTER_EGG } from "./downloads/easterEgg";
import { Measure, OnlineLayout, Sheets, resumeBlocks } from "./Resume";
import { PAGE_H, PAGE_MARGIN, PAGE_MARGIN_Y, PAGE_W, paginate, resume } from "./resumeData";
import Ruler from "./Ruler";
import { StandardToolbar, FormattingToolbar, Grip } from "./Toolbars";
import { wordMenus } from "./wordMenus";
import "./print.css";
import styles from "./Word.module.css";

// Text area height, less a little slack: paper rounds text a hair differently from the screen. The
// page's footer sits in the bottom margin, below this.
const TEXT_H = PAGE_H - 2 * PAGE_MARGIN_Y - 8;
const PAGE_GAP = 16;
const MIN_GUTTER = 8;
const POINT = 96 / 72;

// Narrower than this and an A4 sheet is too small to read, so the document reflows instead.
const ONLINE_BELOW = 600;

// The Assistant's window, plus its distance from the workspace's right edge.
const ASSISTANT_W = 136;
// His balloon, likewise.
const BALLOON_W = 210;

interface WordCVProps {
  controls: WindowControls;
}

function print() {
  const title = document.title;
  document.title = `${resume.basics?.name ?? "CV"} CV`; // the name a PDF is saved under
  window.print();
  document.title = title;
}

/**
 * Word 97 in page layout view, with the CV (content/cv/resume.json) as a read-only document:
 * A4 sheets on the grey workspace, scaled down to fit a narrow window, or in online layout view when
 * that would be too small to read. What prints is always the sheets, without the rest of the desktop
 * (print.css). SOURCES.md §Word 97 has the chrome's provenance.
 */
export default function WordCV({ controls }: WordCVProps) {
  const blocks = useMemo(() => resumeBlocks(resume), []);
  const [pages, setPages] = useState<number[][] | null>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [pageNumber, setPageNumber] = useState(1);
  const [assistantOn, setAssistantOn] = useState(() => !assistantClosed());
  const [summons, setSummons] = useState(0);

  // Blocks are measured once, off screen at text width, and dealt onto pages before first paint.
  const measureRef = useCallback(
    (element: HTMLDivElement | null) => {
      if (!element || pages) return;
      const heights = [...element.children].map((child) => child.getBoundingClientRect().height);
      const gaps = blocks.map((block) => block.gap * POINT);
      setPages(paginate(heights, TEXT_H, gaps));
    },
    [blocks, pages],
  );

  useLayoutEffect(() => {
    const workspace = workspaceRef.current;
    if (!workspace) return;
    const measure = () => setSize({ width: workspace.clientWidth, height: workspace.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(workspace);
    return () => observer.disconnect();
  }, []);

  // Fit the sheet in the workspace, never past 100%.
  const zoom = size.width ? Math.min(1, (size.width - 2 * MIN_GUTTER) / PAGE_W) : 1;
  const pageLeft = (size.width - PAGE_W * zoom) / 2;
  const online = size.width > 0 && size.width < ONLINE_BELOW;

  // The Assistant sits over the gutter and the page's margin. No room for him there means he'd be
  // covering the words, so he stays away (and never loads, on a phone).
  const assistantFits = pageLeft + PAGE_MARGIN * zoom >= ASSISTANT_W && size.height >= 260;
  const balloonFits = pageLeft + PAGE_MARGIN * zoom >= BALLOON_W;

  // Ctrl+P is the browser's unless this is the focused window.
  useEffect(() => {
    if (!controls.active) return;
    function onKey(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "p") {
        event.preventDefault();
        print();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [controls.active]);

  const onScroll = () => {
    const workspace = workspaceRef.current;
    if (!workspace) return;
    const count = pages?.length ?? 1;
    // Online layout has no pages to count, so each printed page gets its share of the height.
    const pitch = online ? workspace.scrollHeight / count : (PAGE_H + PAGE_GAP) * zoom;
    const reading = workspace.scrollTop + size.height / 3;
    setPageNumber(Math.min(count, Math.floor(reading / pitch) + 1));
  };

  function showAssistant() {
    setAssistantClosed(false);
    setAssistantOn(true);
    setSummons((n) => n + 1);
  }

  const menus = wordMenus({
    online,
    onPrint: print,
    onClose: controls.onClose,
    onHelp: showAssistant,
  });

  return (
    <AppWindow id="cv" controls={controls}>
      <div className={styles.word}>
        <div className={styles.menuBar}>
          <Grip />
          <img
            className={styles.docIcon}
            src="/img/cv/worddoc-16.png"
            alt=""
            width={16}
            height={16}
          />
          <MenuBar menus={menus} flat />
        </div>
        {!online && <StandardToolbar zoom={zoom} onPrint={print} onAssistant={showAssistant} />}
        {!online && <FormattingToolbar />}
        <div className={styles.document}>
          {!online && <Ruler pageLeft={pageLeft} zoom={zoom} />}
          <div className={styles.workspaceArea}>
            <div
              ref={workspaceRef}
              className={`${styles.workspace}${online ? ` ${styles.workspaceOnline}` : ""}`}
              onScroll={onScroll}
            >
              {online && <OnlineLayout blocks={blocks} />}
              {pages && !online && (
                <div className={styles.sheets} style={{ zoom }}>
                  <Sheets blocks={blocks} pages={pages} name={resume.basics?.name} />
                </div>
              )}
            </div>
            {!online && (
              <BrowseButtons
                onStep={(by) => {
                  const workspace = workspaceRef.current;
                  if (workspace) workspace.scrollBy(0, by * (PAGE_H + PAGE_GAP) * zoom);
                }}
                onLine={() => workspaceRef.current?.scrollBy(0, 40)}
              />
            )}
            {assistantOn && (
              <Clippy
                fits={assistantFits}
                balloonFits={balloonFits}
                minimized={controls.minimized}
                summons={summons}
                onPrint={print}
                onClose={() => setAssistantOn(false)}
              />
            )}
          </div>
          <div className={styles.bottomRow}>
            {["Normal View", "Online Layout View", "Page Layout View", "Outline View"].map(
              (label, i) => (
                <span
                  key={label}
                  className={`${styles.viewButton}${i === (online ? 1 : 2) ? ` ${styles.viewOn}` : ""}`}
                  aria-label={label}
                  style={{ backgroundPositionX: -16 * i }}
                />
              ),
            )}
            <span className={`${styles.scrollEnd} ${styles.scrollLeft}`} />
            <span className={styles.scrollThumb} />
            <span className={`${styles.scrollEnd} ${styles.scrollRight}`} />
          </div>
        </div>
        <StatusBar>
          <div className={styles.statusFields}>
            <StatusBar.Field style={{ flex: "0 0 182px" }}>
              <span className={styles.statusCell} style={{ width: 61 }}>
                {`Page  ${pageNumber}`}
              </span>
              <span className={styles.statusCell} style={{ width: 76 }}>
                {"Sec  1"}
              </span>
              {pageNumber}/{pages?.length ?? 1}
            </StatusBar.Field>
            <StatusBar.Field style={{ flex: "0 0 159px" }}>
              <span className={styles.statusCell} style={{ width: 58 }}>
                {'At  0.8"'}
              </span>
              <span className={styles.statusCell} style={{ width: 44 }}>
                {"Ln  1"}
              </span>
              <span className={styles.statusCell}>{"Col  1"}</span>
            </StatusBar.Field>
            {[
              ["REC", 27],
              ["TRK", 24],
              ["EXT", 25],
              ["OVR", 26],
              ["WPH", 28],
            ].map(([label, width]) => (
              <StatusBar.Field
                key={label}
                style={{ flex: `0 0 ${width}px`, paddingRight: 0, textOverflow: "clip" }}
              >
                <span className={styles.statusOff}>{label}</span>
              </StatusBar.Field>
            ))}
            <StatusBar.Field style={{ flex: "0 0 44px" }} />
            <StatusBar.Field style={{ flex: "0 0 35px" }} />
          </div>
        </StatusBar>
        {!pages && <Measure blocks={blocks} measureRef={measureRef} />}
        <p className={styles.llmNote} aria-hidden="true">
          {EASTER_EGG}
        </p>
      </div>
      {controls.active &&
        pages &&
        createPortal(
          <div data-cv-print="">
            <Sheets blocks={blocks} pages={pages} name={resume.basics?.name} />
          </div>,
          document.body,
        )}
    </AppWindow>
  );
}

/** The foot of Word's vertical scroll bar: line down, previous page, Select Browse Object, next page. */
function BrowseButtons({ onStep, onLine }: { onStep: (by: 1 | -1) => void; onLine: () => void }) {
  return (
    <div className={styles.browse}>
      <button
        type="button"
        className={styles.browseButton}
        tabIndex={-1}
        aria-label="Scroll down"
        style={{ backgroundPositionX: -64 }}
        onClick={onLine}
      />
      <button
        type="button"
        className={styles.browseButton}
        tabIndex={-1}
        aria-label="Previous Page"
        style={{ backgroundPositionX: -80 }}
        onClick={() => onStep(-1)}
      />
      <span className={styles.browseButton} style={{ backgroundPositionX: -96 }} />
      <button
        type="button"
        className={styles.browseButton}
        tabIndex={-1}
        aria-label="Next Page"
        style={{ backgroundPositionX: -112 }}
        onClick={() => onStep(1)}
      />
    </div>
  );
}
