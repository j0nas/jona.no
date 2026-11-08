import { useEffect, useRef, useState } from "react";
import type { initAgent } from "clippyjs";
import { cvDownload } from "./downloads/files";
import { resumes, type Lang } from "./resumeData";
import styles from "./Clippy.module.css";

type Agent = Awaited<ReturnType<typeof initAgent>>;

const STORAGE_KEY = "cv__assistant";
/** How long after the window opens he turns up. */
const ARRIVAL_MS = 1200;
const BULLET = "/img/cv/clippy-bullet.png";
const COPY_LABEL = "Copy the address";
const DOWNLOADS = [
  { type: "pdf", label: "PDF" },
  { type: "docx", label: "Word document" },
  { type: "json", label: "JSON" },
] as const;
/** The way to the CV in the other language, said in that language. */
const OTHER_LANGUAGE: Record<Lang, string> = { en: "Les CV-en på norsk", no: "Read it in English" };

// His window closed stays closed, until Help or the toolbar brings him back.
export function setAssistantClosed(closed: boolean): void {
  try {
    if (closed) localStorage.setItem(STORAGE_KEY, "closed");
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Private windows and blocked storage: he just forgets.
  }
}

export function assistantClosed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "closed";
  } catch {
    return false;
  }
}

// clippyjs's own asset modules inline a 1.8MB sprite and the sounds as base64; these point it at a
// trimmed self-hosted copy instead (SOURCES.md §Word 97), with no sound at all.
async function loadAgent(): Promise<Agent> {
  const { initAgent } = await import("clippyjs");
  return initAgent({
    agent: async () => ({
      default: await (await fetch("/img/cv/clippy-agent.json")).json(),
    }),
    map: async () => ({ default: "/img/cv/clippy-map.png" }),
    sound: async () => ({ default: {} }),
  });
}

interface ClippyProps {
  /** The CV's language: the downloads are in it, and he offers the other. */
  lang: Lang;
  /** Whether he'd fit without covering text. While false he's hidden, and not loaded if he hasn't been yet. */
  fits: boolean;
  /** Whether his balloon would fit without covering text. While false it doesn't open on arrival; clicking him still opens it. */
  balloonFits: boolean;
  minimized: boolean;
  /** Bumped when Help or the toolbar's Assistant button calls for him. */
  summons: number;
  onPrint: () => void;
  onOtherLanguage: () => void;
  onClose: () => void;
}

/**
 * The Office Assistant, in the Word 97 form of a little captioned window with his balloon above it.
 * clippyjs supplies the sprite animation; the balloon is ours, since the package's can't show
 * options and both of its elements live on <body> in viewport coordinates. Its element is moved
 * into our stage and the stylesheet pins it there.
 */
export default function Clippy({
  lang,
  fits,
  balloonFits,
  minimized,
  summons,
  onPrint,
  onOtherLanguage,
  onClose,
}: ClippyProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const agentRef = useRef<Agent | null>(null);
  const [balloon, setBalloon] = useState(false);
  const [view, setView] = useState<"main" | "hiring" | "download">("main");
  const [copyLabel, setCopyLabel] = useState(COPY_LABEL);
  const email = resumes[lang].basics?.email;

  // Load once there's room for him, a beat after the window opens.
  useEffect(() => {
    if (!fits || agentRef.current) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const agent = await loadAgent().catch(() => null); // offline: no Assistant, no fuss
      if (!agent) return;
      if (cancelled || !stageRef.current) {
        agent.dispose();
        return;
      }
      agentRef.current = agent;
      stageRef.current.append(agent._el);
      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        agent.show(true);
        agent.pause();
      } else {
        agent.show(false);
        agent.play("GetAttention");
      }
      if (balloonFits) setBalloon(true);
    }, ARRIVAL_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [fits, balloonFits]);

  useEffect(
    () => () => {
      agentRef.current?.dispose();
      agentRef.current = null;
    },
    [],
  );

  // He doesn't animate behind a minimized window or a hidden one.
  useEffect(() => {
    const agent = agentRef.current;
    if (!agent) return;
    if (fits && !minimized) agent.resume();
    else agent.pause();
  }, [fits, minimized]);

  useEffect(() => {
    if (summons) openBalloon();
  }, [summons]);

  function openBalloon() {
    setView("main");
    setCopyLabel(COPY_LABEL);
    setBalloon(true);
  }

  function wave() {
    agentRef.current?.stop();
    agentRef.current?.play("Wave");
    openBalloon();
  }

  // A mailto: link alone goes nowhere on a browser with no mail handler, so he always shows the address.
  function hire() {
    agentRef.current?.stop();
    agentRef.current?.play("Explain");
    setView("hiring");
  }

  function download() {
    agentRef.current?.stop();
    agentRef.current?.play("GetAttention");
    setView("download");
  }

  function copyAddress() {
    navigator.clipboard
      ?.writeText(email ?? "")
      .then(() => setCopyLabel("Copied!"))
      .catch(() => setCopyLabel("Couldn't copy it, select it above"));
  }

  function dismiss() {
    setBalloon(false);
  }

  function close() {
    setAssistantClosed(true);
    onClose();
  }

  return (
    <div className={styles.assistant} style={fits ? undefined : { display: "none" }}>
      {balloon && view === "hiring" && (
        <div className={styles.balloon} role="dialog" aria-label="Office Assistant">
          <p className={styles.title}>Excellent choice! You can reach Jonas at:</p>
          <p className={styles.address}>{email}</p>
          <a className={styles.option} href={`mailto:${email}`}>
            <img src={BULLET} alt="" width={15} height={15} />
            <span>Write an email</span>
          </a>
          <button type="button" className={styles.option} onClick={copyAddress}>
            <img src={BULLET} alt="" width={15} height={15} />
            <span>{copyLabel}</span>
          </button>
          <hr className={styles.rule} />
          <button type="button" className={styles.pill} onClick={dismiss}>
            <img src={BULLET} alt="" width={15} height={15} />
            <span>Back to reading</span>
          </button>
        </div>
      )}
      {balloon && view === "download" && (
        <div className={styles.balloon} role="dialog" aria-label="Office Assistant">
          <p className={styles.title}>Which format would you like?</p>
          {DOWNLOADS.map(({ type, label }) => (
            <a key={type} className={styles.option} href={cvDownload(lang, type)} download>
              <img src={BULLET} alt="" width={15} height={15} />
              <span>{label}</span>
            </a>
          ))}
          <hr className={styles.rule} />
          <button type="button" className={styles.pill} onClick={openBalloon}>
            <img src={BULLET} alt="" width={15} height={15} />
            <span>Back</span>
          </button>
        </div>
      )}
      {balloon && view === "main" && (
        <div className={styles.balloon} role="dialog" aria-label="Office Assistant">
          <p className={styles.title}>
            It looks like you're reading a résumé. Would you like help?
          </p>
          {email && (
            <button type="button" className={styles.option} onClick={hire}>
              <img src={BULLET} alt="" width={15} height={15} />
              <span>Hire Jonas</span>
            </button>
          )}
          <button type="button" className={styles.option} onClick={download}>
            <img src={BULLET} alt="" width={15} height={15} />
            <span>Download this résumé</span>
          </button>
          <button
            type="button"
            className={styles.option}
            onClick={() => {
              setBalloon(false);
              onPrint();
            }}
          >
            <img src={BULLET} alt="" width={15} height={15} />
            <span>Print this résumé</span>
          </button>
          <button
            type="button"
            className={styles.option}
            onClick={() => {
              setBalloon(false);
              onOtherLanguage();
            }}
          >
            <img src={BULLET} alt="" width={15} height={15} />
            <span>{OTHER_LANGUAGE[lang]}</span>
          </button>
          <hr className={styles.rule} />
          <button type="button" className={styles.pill} onClick={dismiss}>
            <img src={BULLET} alt="" width={15} height={15} />
            <span>Just read it</span>
          </button>
        </div>
      )}
      <div className={styles.window}>
        <div className={styles.caption}>
          <button type="button" className={styles.close} aria-label="Close" onClick={close} />
        </div>
        <div ref={stageRef} className={styles.stage} onClick={wave} />
      </div>
    </div>
  );
}
