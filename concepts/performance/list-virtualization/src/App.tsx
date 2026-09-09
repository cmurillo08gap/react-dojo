import { useState, type UIEvent } from "react";

/**
 * Concept: List virtualization (windowing)
 *
 * Layout convention for every concept package — same shape as
 * hooks/use-state-basics/src/App.tsx:
 *
 *   1. Theory panel   — condensed explanation, always visible.
 *   2. Interactive demo — the actual behavior to click/scroll through.
 *   3. "What just happened" panel — reacts to the active mode (and, in
 *      virtualized mode, live scroll math) showing the exact code that ran.
 *
 * See ./README.md for the full write-up and discussion questions.
 */

type Mode = "naive" | "virtualized";

interface RowData {
  id: number;
  label: string;
  detail: string;
}

const ROW_COUNT = 5000;
// Must match the .row height rendered below (box-sizing: border-box makes
// the 1px border-bottom count *inside* this height, so rows stack exactly
// ITEM_HEIGHT px apart with no drift over 5,000 rows).
const ITEM_HEIGHT = 40;
// Must match .scroll-viewport's max-height in index.css.
const VIEWPORT_HEIGHT = 420;
// Extra rows rendered above/below the visible window so a fast scroll
// doesn't show a blank flash before the next paint catches up.
const OVERSCAN = 5;

// Generated once at module scope — every mount of <App> (including
// StrictMode's dev double-invoke) reuses the same array instead of
// regenerating 5,000 objects on every render.
function generateRows(count: number): RowData[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    label: `Row ${i}`,
    detail: `Generated detail text for row #${i} — pretend this came from an API.`,
  }));
}

const ROWS: RowData[] = generateRows(ROW_COUNT);

function Row({ row }: { row: RowData }) {
  return (
    <div className="row" style={{ height: ITEM_HEIGHT }}>
      <span className="row-id">#{row.id}</span>
      <span className="row-label">{row.label}</span>
      <span className="row-detail">{row.detail}</span>
    </div>
  );
}

// Keep these snippets in sync with the actual render logic below — they're
// display copies, not derived automatically, so the reader sees exactly
// what ran without any build-time magic.
const MODE_INFO: Record<Mode, { label: string; code: string; explanation: string }> = {
  naive: {
    label: "Naive (render all 5,000)",
    code: `<div className="scroll-viewport">
  {rows.map((row) => (
    <Row key={row.id} row={row} />
  ))}
</div>`,
    explanation:
      "Every one of the 5,000 rows becomes a real mounted DOM node immediately, whether or " +
      "not it's ever scrolled into view. The browser pays layout/paint/style cost for the " +
      "whole list up front, and the scrollbar you see is just the natural height of 5,000 " +
      "stacked elements.",
  },
  virtualized: {
    label: "Virtualized (windowed)",
    code: `const startIndex = Math.max(
  0,
  Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN,
);
const endIndex = Math.min(
  rows.length,
  Math.ceil((scrollTop + VIEWPORT_HEIGHT) / ITEM_HEIGHT) + OVERSCAN,
);
const visibleRows = rows.slice(startIndex, endIndex);

<div className="scroll-viewport" onScroll={handleScroll}>
  {/* full-height spacer keeps the scrollbar the same size as "naive" */}
  <div className="scroll-spacer" style={{ height: rows.length * ITEM_HEIGHT }}>
    <div style={{ transform: \`translateY(\${startIndex * ITEM_HEIGHT}px)\` }}>
      {visibleRows.map((row) => (
        <Row key={row.id} row={row} />
      ))}
    </div>
  </div>
</div>`,
    explanation:
      "Only rows whose index falls inside [startIndex, endIndex) are ever mounted — a small, " +
      "roughly constant number regardless of the dataset size. A full-height spacer div keeps " +
      "the scrollbar exactly the size it would be if all 5,000 rows were real, and the visible " +
      "slice is translated down to where it would have sat in that full list, so nothing jumps " +
      "as you scroll.",
  },
};

export function App() {
  const [mode, setMode] = useState<Mode>("naive");
  const [scrollTop, setScrollTop] = useState(0);

  function handleScroll(event: UIEvent<HTMLDivElement>) {
    // Plain onScroll -> setState is fine for a teaching demo. A production
    // list would typically throttle this (e.g. with requestAnimationFrame)
    // to avoid scheduling a render on every single scroll-fired pixel —
    // see the README's "Further reading" for that production concern.
    setScrollTop(event.currentTarget.scrollTop);
  }

  function switchMode(next: Mode) {
    setMode(next);
    // Reset scroll bookkeeping when switching modes so the range readout
    // below starts from a known position instead of a stale scrollTop.
    setScrollTop(0);
  }

  // Derived in render (not an effect) — this is a pure computation from
  // `mode`/`scrollTop`/the fixed constants above, so there's nothing to
  // synchronize with an external system and no reason to pay for an extra
  // render pass via useEffect.
  let visibleRows: RowData[];
  let startIndex = 0;
  let endIndex = ROWS.length;
  if (mode === "virtualized") {
    startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN);
    endIndex = Math.min(
      ROWS.length,
      Math.ceil((scrollTop + VIEWPORT_HEIGHT) / ITEM_HEIGHT) + OVERSCAN,
    );
    visibleRows = ROWS.slice(startIndex, endIndex);
  } else {
    visibleRows = ROWS;
  }

  const mountedCount = visibleRows.length;
  const active = MODE_INFO[mode];

  return (
    <main className="concept">
      <header className="concept-header">
        <h1>List virtualization</h1>
        <p>
          Rendering thousands of DOM nodes for a long list causes visible jank on scroll. Windowing
          (a.k.a. virtualization) mounts only the slice of rows currently in — or near — the visible
          viewport, no matter how large the underlying dataset is.
        </p>
      </header>

      <div className="concept-grid">
        <section className="panel" data-accent="theory">
          <h2>Theory</h2>

          <h3 className="theory-subhead">The problem</h3>
          <p>
            A list of 5,000 rows rendered naively creates 5,000 real DOM nodes. The browser has to
            lay out, style, and paint all of them, and every one stays in the DOM even though a
            typical viewport can only ever show a few dozen at a time.
          </p>

          <h3 className="theory-subhead">The fix: windowing</h3>
          <p>
            Track <code>scrollTop</code> and, from it, compute which row indices are currently
            visible:
          </p>
          <pre>
            <code>{`startIndex = floor(scrollTop / itemHeight) - overscan
endIndex   = ceil((scrollTop + viewportHeight) / itemHeight) + overscan`}</code>
          </pre>
          <ul>
            <li>
              Only <code>rows.slice(startIndex, endIndex)</code> is ever mounted — a small, roughly
              constant number of <code>&lt;Row/&gt;</code> components, independent of dataset size.
            </li>
            <li>
              A full-height <strong>spacer</strong> (<code>rows.length * itemHeight</code> tall)
              keeps the scrollbar the same size it would be if every row were real, so scrolling
              feels native.
            </li>
            <li>
              The visible slice is positioned at <code>startIndex * itemHeight</code> (via{" "}
              <code>transform: translateY(...)</code>) so it lines up exactly where those rows would
              have sat in the full list.
            </li>
            <li>
              <strong>Overscan</strong> — rendering a few extra rows beyond the strict viewport
              edges — hides the blank flash that would otherwise appear for a frame while state
              catches up to a fast scroll.
            </li>
          </ul>

          <h3 className="theory-subhead">Why this is hand-rolled here</h3>
          <p>
            Production apps usually reach for a library (<code>react-window</code>,{" "}
            <code>@tanstack/react-virtual</code>) that implements this same index math plus extras
            (variable row heights, horizontal lists, sticky rows). This concept hand-rolls it so the
            mechanism is visible instead of hidden behind an abstraction.
          </p>
        </section>

        <section className="panel" data-accent="demo">
          <h2>Interactive demo</h2>
          <div className="mode-toggle">
            <button data-active={mode === "naive"} onClick={() => switchMode("naive")}>
              Naive (render all)
            </button>
            <button data-active={mode === "virtualized"} onClick={() => switchMode("virtualized")}>
              Virtualized (windowed)
            </button>
          </div>

          <p className="mounted-badge" data-mode={mode}>
            Rows mounted: <strong>{mountedCount}</strong> of {ROW_COUNT.toLocaleString()}
          </p>

          <div className="scroll-viewport" onScroll={handleScroll}>
            {mode === "naive" ? (
              visibleRows.map((row) => <Row key={row.id} row={row} />)
            ) : (
              <div className="scroll-spacer" style={{ height: ROWS.length * ITEM_HEIGHT }}>
                <div style={{ transform: `translateY(${startIndex * ITEM_HEIGHT}px)` }}>
                  {visibleRows.map((row) => (
                    <Row key={row.id} row={row} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <p className="demo-count">
            Scroll the list above, then check the "what just happened" panel for the live index
            math. Open your browser's Elements/DOM inspector on each mode to see the mounted{" "}
            <code>&lt;Row&gt;</code> node count directly — that's ground truth beyond this in-app
            counter.
          </p>
        </section>

        <section className="panel explain" data-accent="explain">
          <h2>What just happened</h2>
          <div className="explain-body">
            <p>{active.explanation}</p>
            <pre>
              <code>{active.code}</code>
            </pre>
            {mode === "virtualized" && (
              <p className="range-readout">
                scrollTop = {Math.round(scrollTop)}px → startIndex = {startIndex}, endIndex ={" "}
                {endIndex} ({mountedCount} rows sliced and mounted, out of{" "}
                {ROW_COUNT.toLocaleString()}
                ).
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
