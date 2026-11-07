import type { MouseEvent, ReactNode } from "react";
import type { WindowId } from "../registry";
import { visitorCount } from "./visitorCount";
import styles from "./HomePage.module.css";

// Easy to change. Keep the marquee neutral: nothing here says whether I'm looking for work.
const MARQUEE_TEXT = "Welcome to my corner of the information superhighway!";
const LAST_UPDATED = "November 6, 1996";

export const CONTACT_EMAIL = "hi@jona.no";

const BADGES = [
  { src: "badge-msexplorer.gif", alt: "Explorer Now! 3.0" },
  { src: "badge-built_notepad.gif", alt: "Built with Microsoft Notepad" },
  { src: "badge-mspaint.gif", alt: "Long Live MSPaint!" },
  { src: "badge-800x600.gif", alt: "Best viewed at 800 x 600" },
  { src: "badge-anybrowser2.gif", alt: "WWW Any Browser" },
  { src: "badge-win95.gif", alt: "Windows" },
];

function img(name: string) {
  return `/img/home/${name}`;
}

/** A divider GIF; they stretch to the column's width rather than overflow a phone. */
function Divider({ name, height, lazy = false }: { name: string; height: number; lazy?: boolean }) {
  return (
    <img
      className={styles.divider}
      src={img(name)}
      alt=""
      height={height}
      loading={lazy ? "lazy" : undefined}
    />
  );
}

function Bullet() {
  return <img className={styles.bullet} src={img("ball.gif")} alt="" width={12} height={12} />;
}

/**
 * A link to one of the desktop's own windows: a real /<id> address, so middle-click and copying
 * it work, that opens the window in place on a plain click.
 */
function WindowLink({
  id,
  onOpen,
  children,
}: {
  id: WindowId;
  onOpen: (id: WindowId) => void;
  children: ReactNode;
}) {
  function onClick(event: MouseEvent) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    onOpen(id);
  }
  return (
    <a href={`/${id}`} onClick={onClick}>
      {children}
    </a>
  );
}

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

function Odometer({ value }: { value: number }) {
  return (
    <span className={styles.odometer} aria-label={String(value)}>
      {[...String(value).padStart(7, "0")].map((digit, i) => (
        <span key={i} className={styles.digit} aria-hidden="true">
          {digit}
        </span>
      ))}
    </span>
  );
}

/**
 * My GeoCities-style home page, in ordinary elements: tacky on purpose, readable on purpose.
 * All the images are period GIFs (SOURCES.md §The home page's GIFs); the ones below the fold load
 * lazily.
 */
export default function HomePage({ onOpen }: { onOpen: (id: WindowId) => void }) {
  return (
    <div className={styles.home}>
      <div className={styles.column}>
        <div className={styles.marquee}>
          <span className={styles.marqueeText}>{MARQUEE_TEXT}</span>
        </div>

        <Divider name="divider-rainbow.gif" height={14} />

        <h1 className={styles.welcome}>
          <img src={img("globe-spinning.gif")} alt="" width={56} height={58} />
          <span>
            Welcome to
            <br />
            Jonas's Home Page!
          </span>
          <img src={img("globe-spinning.gif")} alt="" width={56} height={58} />
        </h1>

        <Divider name="divider-lights.gif" height={12} />

        <div className={styles.bio}>
          <img
            className={styles.computer}
            src={img("computer.gif")}
            alt=""
            width={50}
            height={39}
          />
          <p>
            Hi, I'm Jonas. I'm a software developer based in Oslo, Norway. I'm super passionate
            about computers, technology, animal rights and tinkering.
          </p>
          <p>
            I love to use my skills to make people's lives better in whatever ways I can and to
            build things that do so. If you do too, feel free to reach out at:{" "}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </p>
        </div>

        <p className={styles.resume}>
          <img src={img("new-burst.gif")} alt="New!" width={40} height={20} />
          <WindowLink id="cv" onOpen={onOpen}>
            My résumé (Word document)
          </WindowLink>
          <img src={img("new-burst.gif")} alt="" width={40} height={20} />
        </p>

        <Divider name="divider-arrows.gif" height={17} lazy />

        <h2 className={styles.heading}>
          <img src={img("mailbox.gif")} alt="" width={50} height={50} loading="lazy" />
          Say hi!
        </h2>
        <ul className={styles.links}>
          <li>
            <Bullet />
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </li>
          <li>
            <Bullet />
            <ExternalLink href="https://www.linkedin.com/in/j0nas">
              linkedin.com/in/j0nas
            </ExternalLink>
          </li>
          <li>
            <Bullet />
            <ExternalLink href="https://github.com/j0nas">github.com/j0nas</ExternalLink>
          </li>
        </ul>
        <p>
          <a href={`mailto:${CONTACT_EMAIL}?subject=Your%20guestbook`}>
            <img
              className={styles.guestbook}
              src={img("guestbook.gif")}
              alt="Sign my guestbook"
              width={105}
              height={37}
              loading="lazy"
            />
          </a>
        </p>

        <Divider name="divider-rainbow.gif" height={14} lazy />

        <p className={styles.construction}>
          <img src={img("digger.gif")} alt="" width={76} height={76} loading="lazy" />
          <img
            src={img("under-construction.gif")}
            alt="Caution! This site under construction!"
            width={102}
            height={59}
            loading="lazy"
          />
        </p>

        <p className={styles.counter}>
          You are visitor number <Odometer value={visitorCount()} />
        </p>

        <p className={styles.badges}>
          {BADGES.map(({ src, alt }) => (
            <img key={src} src={img(src)} alt={alt} width={88} height={31} loading="lazy" />
          ))}
        </p>

        <p className={styles.small}>
          Best viewed with Microsoft Internet Explorer 3.0 at 800x600
          <br />
          Last updated: {LAST_UPDATED}
        </p>
      </div>
    </div>
  );
}
