import { PAGE_MARGIN as MARGIN, PAGE_W } from "./resumeData";
import styles from "./Word.module.css";

const INCH = 96;
const EIGHTH = 12;

// Under about 60% the ruler's bitmap digits and eighth-inch ticks run together.
const DETAIL_ZOOM = 0.6;

/**
 * Word's horizontal ruler over the sheet: white over the text, grey over the margins, inch numbers
 * from the left margin, eighth-inch ticks, and the indent markers on the margins. Tick sizes are
 * sampled from a 1:1 capture at 100%; narrower windows scale it with the page.
 */
export default function Ruler({ pageLeft, zoom }: { pageLeft: number; zoom: number }) {
  const width = PAGE_W * zoom;
  const scaled = (x: number) => Math.round(x * zoom);
  const textLeft = scaled(MARGIN);
  const textRight = scaled(PAGE_W - MARGIN);

  const ticks: number[] = [];
  for (let x = MARGIN % EIGHTH; x <= PAGE_W; x += EIGHTH) {
    if ((x - MARGIN) % INCH !== 0) ticks.push(x);
  }
  const numbers: { x: number; n: number }[] = [];
  for (let x = MARGIN % INCH; x <= PAGE_W; x += INCH) {
    if (x !== MARGIN) numbers.push({ x, n: Math.abs(x - MARGIN) / INCH });
  }
  const detailed = zoom >= DETAIL_ZOOM;

  return (
    <div className={styles.ruler} aria-hidden="true">
      {pageLeft >= 24 && <span className={styles.rulerTab} />}
      <div className={styles.rulerStrip} style={{ left: pageLeft, width }}>
        <span className={styles.rulerGrey} style={{ left: 0, width: textLeft }} />
        <span className={styles.rulerGrey} style={{ left: textRight, right: 0 }} />
        {detailed && (
          <svg className={styles.rulerTicks} width={width} height={13} shapeRendering="crispEdges">
            {ticks.map((x) => {
              const half = (x - MARGIN) % (INCH / 2) === 0;
              return (
                <rect
                  key={x}
                  x={scaled(x)}
                  y={half ? 4 : 5}
                  width={1}
                  height={half ? 5 : 2}
                  fill="#000000"
                />
              );
            })}
          </svg>
        )}
        {detailed &&
          numbers.map(({ x, n }) => (
            <span key={x} className={styles.rulerNumber} style={{ left: scaled(x) }}>
              {n}
            </span>
          ))}
        {/* The default tab stops, every half inch, under the strip. */}
        {detailed &&
          ticks
            .filter((x) => x > MARGIN && x < PAGE_W - MARGIN && (x - MARGIN) % (INCH / 2) === 0)
            .map((x) => <span key={x} className={styles.rulerStop} style={{ left: scaled(x) }} />)}
        <span className={styles.rulerMarker} style={{ left: textLeft - 5 }} />
        <span className={styles.rulerMarkerRight} style={{ left: textRight - 5 }} />
      </div>
    </div>
  );
}
