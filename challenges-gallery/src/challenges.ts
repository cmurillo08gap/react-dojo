// Content for the challenges gallery — a curated set of the React
// component-building exercises that come up most often in front-end
// interviews (see the sources cited in this repo's session notes /
// challenges-gallery/README.md for how this list was put together).
//
// Nothing here is executed or checked automatically. `testCode` is a
// *reference* test file — read it, then implement against it by hand in
// playground/. See challenges-gallery/README.md for the workflow.

export type Tier = "easy" | "medium" | "hard";

export interface Challenge {
  slug: string;
  title: string;
  tier: Tier;
  summary: string;
  prompt: string[];
  requirements: string[];
  followUps: string[];
  testCode: string;
}

export const TIER_LABEL: Record<Tier, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export const CHALLENGES: Challenge[] = [
  {
    slug: "counter",
    title: "Counter",
    tier: "easy",
    summary: "Increment/decrement/reset counter — the canonical useState warm-up.",
    prompt: [
      "Build a counter that displays a number and lets the user increment, " +
        "decrement, and reset it. Almost every React interview opens with " +
        "some variant of this to check you know basic state mechanics " +
        "before moving to harder problems.",
    ],
    requirements: [
      "Displays the current count, starting at 0.",
      '"Increment" increases the count by 1; "Decrement" decreases it by 1.',
      "The count may go negative (no clamping unless you choose to add it).",
      '"Reset" sets the count back to 0.',
      "Every control is a real, accessibly-labeled <button>.",
    ],
    followUps: [
      "How would you support a configurable step (+5/-5) without duplicating handlers?",
      "What changes if increment must be async (e.g. persisted to a server) and the UI should stay optimistic?",
    ],
    testCode: `import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../App";

describe("Counter", () => {
  it("starts at 0", () => {
    render(<App />);
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("increments on click", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /increment/i }));

    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("decrements below zero", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /decrement/i }));

    expect(screen.getByText("-1")).toBeInTheDocument();
  });

  it("resets to 0", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /increment/i }));
    await user.click(screen.getByRole("button", { name: /increment/i }));
    await user.click(screen.getByRole("button", { name: /reset/i }));

    expect(screen.getByText("0")).toBeInTheDocument();
  });
});
`,
  },
  {
    slug: "accordion",
    title: "Accordion",
    tier: "easy",
    summary: "Expand/collapse panels, only one open at a time.",
    prompt: [
      "Build an accordion of 3+ panels, each with a clickable header and a " +
        "body that's hidden until expanded. Opening a panel closes whichever " +
        "one was previously open — classic single-open-at-a-time behavior.",
    ],
    requirements: [
      "Renders each panel's header as a <button> (keyboard-operable by default).",
      'The header exposes expanded state via aria-expanded="true|false".',
      "A panel's body is not present in the accessibility tree while collapsed.",
      "Clicking an open panel's header collapses it (toggle, not just expand).",
      "Opening a different panel closes the previously open one.",
    ],
    followUps: [
      "How would you support multiple panels open at once as an alternate mode?",
      "Where does the 'which panel is open' state belong if the accordion has to be a reusable, uncontrolled component?",
    ],
    testCode: `import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../App";

describe("Accordion", () => {
  it("starts with every panel collapsed", () => {
    render(<App />);

    for (const header of screen.getAllByRole("button")) {
      expect(header).toHaveAttribute("aria-expanded", "false");
    }
  });

  it("expands a panel on click and hides its body otherwise", async () => {
    const user = userEvent.setup();
    render(<App />);
    const firstHeader = screen.getAllByRole("button")[0];

    await user.click(firstHeader);

    expect(firstHeader).toHaveAttribute("aria-expanded", "true");
  });

  it("closes the previously open panel when another one opens", async () => {
    const user = userEvent.setup();
    render(<App />);
    const [first, second] = screen.getAllByRole("button");

    await user.click(first);
    await user.click(second);

    expect(first).toHaveAttribute("aria-expanded", "false");
    expect(second).toHaveAttribute("aria-expanded", "true");
  });

  it("collapses an open panel when clicked again", async () => {
    const user = userEvent.setup();
    render(<App />);
    const firstHeader = screen.getAllByRole("button")[0];

    await user.click(firstHeader);
    await user.click(firstHeader);

    expect(firstHeader).toHaveAttribute("aria-expanded", "false");
  });
});
`,
  },
  {
    slug: "star-rating",
    title: "Star rating",
    tier: "easy",
    summary: "Click to select 1-5 stars, hover to preview the selection.",
    prompt: [
      "Build a 5-star rating control: hovering previews a rating, clicking " +
        "commits it, and moving the mouse away reverts the preview back to " +
        "the committed value.",
    ],
    requirements: [
      'Renders 5 stars, each an accessibly-labeled button (e.g. "Rate 3 stars").',
      "No stars are selected initially (rating of 0).",
      "Clicking the Nth star commits the rating to N.",
      "Hovering the Nth star previews N stars as filled without committing.",
      "Moving the mouse out of the control reverts the display to the committed rating.",
    ],
    followUps: [
      "How would you make this keyboard-accessible without a mouse (arrow keys + Enter)?",
      "How would this component expose its value/onChange to be usable as a controlled form field?",
    ],
    testCode: `import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../App";

describe("Star rating", () => {
  it("starts unrated", () => {
    render(<App />);
    expect(screen.getByText(/0.*stars?/i)).toBeInTheDocument();
  });

  it("commits a rating on click", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /rate 3 stars/i }));

    expect(screen.getByText(/3.*stars?/i)).toBeInTheDocument();
  });

  it("previews a rating on hover without committing", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.hover(screen.getByRole("button", { name: /rate 4 stars/i }));
    // Adjust this assertion to however your component surfaces the
    // preview (e.g. a data-filled attribute or aria-pressed on the stars).
    expect(screen.getByRole("button", { name: /rate 4 stars/i })).toHaveAttribute(
      "data-filled",
      "true",
    );

    await user.unhover(screen.getByRole("button", { name: /rate 4 stars/i }));
    expect(screen.getByText(/0.*stars?/i)).toBeInTheDocument();
  });
});
`,
  },
  {
    slug: "stopwatch",
    title: "Stopwatch",
    tier: "medium",
    summary: "Start/stop/reset timer — useEffect + interval cleanup done right.",
    prompt: [
      "Build a stopwatch showing elapsed seconds, with Start, Stop, and " +
        "Reset controls. This is the go-to check for whether you clean up " +
        "intervals correctly and avoid stale-closure bugs.",
    ],
    requirements: [
      'Displays elapsed time starting at "0" seconds.',
      '"Start" begins counting up once per second; clicking it again while ' +
        "already running is a no-op (no double interval).",
      '"Stop" pauses the count without resetting it.',
      '"Reset" stops the timer and returns the display to 0.',
      "The interval is cleared on unmount (no state updates after unmount).",
    ],
    followUps: [
      "Why is setInterval alone (without cleanup in a useEffect return) a bug here — what actually goes wrong?",
      "How would you keep accurate elapsed time if the tab is backgrounded and timers get throttled?",
    ],
    testCode: `import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../App";

describe("Stopwatch", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts at 0 seconds", () => {
    render(<App />);
    expect(screen.getByText(/0\\s*s/i)).toBeInTheDocument();
  });

  it("counts up once per second after Start", async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ delay: null });
    render(<App />);

    await user.click(screen.getByRole("button", { name: /start/i }));
    await vi.advanceTimersByTimeAsync(3000);

    expect(screen.getByText(/3\\s*s/i)).toBeInTheDocument();
  });

  it("pauses without resetting on Stop", async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ delay: null });
    render(<App />);

    await user.click(screen.getByRole("button", { name: /start/i }));
    await vi.advanceTimersByTimeAsync(2000);
    await user.click(screen.getByRole("button", { name: /^stop$/i }));
    await vi.advanceTimersByTimeAsync(2000);

    expect(screen.getByText(/2\\s*s/i)).toBeInTheDocument();
  });

  it("returns to 0 on Reset", async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ delay: null });
    render(<App />);

    await user.click(screen.getByRole("button", { name: /start/i }));
    await vi.advanceTimersByTimeAsync(2000);
    await user.click(screen.getByRole("button", { name: /reset/i }));

    expect(screen.getByText(/0\\s*s/i)).toBeInTheDocument();
  });
});
`,
  },
  {
    slug: "debounced-search",
    title: "Debounced search / autocomplete",
    tier: "medium",
    summary: "Type-ahead suggestions that debounce input and ignore stale responses.",
    prompt: [
      "Build a search box backed by an async lookup (mock it with a fake, " +
        "artificially-delayed function — no real network call needed). " +
        "Suggestions should only fetch after the user pauses typing, and a " +
        "slow response for an old query must never clobber a newer one.",
    ],
    requirements: [
      "A labeled text input plus a list of suggestions (or 'No results').",
      "The lookup does not fire on every keystroke — it debounces (e.g. 300ms of no typing).",
      "While a lookup is in flight, the UI shows some loading indication.",
      "If the user types again before a lookup resolves, the stale response " +
        "is discarded — only the result for the latest query is ever shown.",
      "Selecting a suggestion (click or Enter) fills the input with it and " +
        "closes the suggestion list.",
    ],
    followUps: [
      "Why does a stale in-flight request racing a newer one matter here, and how do you guard against it (AbortController vs. a request-id/ref check)?",
      "How would you extract the debounce + fetch logic into a reusable useDebouncedSearch hook?",
    ],
    testCode: `import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../App";

describe("Debounced search", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not look up on every keystroke", async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ delay: null });
    render(<App />);
    const input = screen.getByRole("textbox", { name: /search/i });

    await user.type(input, "re");
    await vi.advanceTimersByTimeAsync(100); // less than the debounce window

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("shows suggestions after the user pauses typing", async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ delay: null });
    render(<App />);

    await user.type(screen.getByRole("textbox", { name: /search/i }), "react");
    await vi.advanceTimersByTimeAsync(500);

    await waitFor(() => expect(screen.getByRole("listbox")).toBeInTheDocument());
  });

  it("keeps only the latest query's results when an older lookup resolves later", async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ delay: null });
    render(<App />);
    const input = screen.getByRole("textbox", { name: /search/i });

    await user.type(input, "re");
    await vi.advanceTimersByTimeAsync(500);
    await user.type(input, "act");
    await vi.advanceTimersByTimeAsync(500);

    await waitFor(() => {
      const options = screen.getAllByRole("option").map((o) => o.textContent);
      expect(options.every((text) => text?.toLowerCase().includes("react"))).toBe(true);
    });
  });

  it("fills the input on selecting a suggestion", async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ delay: null });
    render(<App />);

    await user.type(screen.getByRole("textbox", { name: /search/i }), "react");
    await vi.advanceTimersByTimeAsync(500);
    const option = await screen.findByRole("option", { name: /react/i });
    await user.click(option);

    expect(screen.getByRole("textbox", { name: /search/i })).toHaveValue(
      option.textContent,
    );
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
`,
  },
  {
    slug: "tabs",
    title: "Tabs",
    tier: "medium",
    summary: "Composable tab list with roving keyboard focus and a linked panel.",
    prompt: [
      "Build a tabs component: a row of tab buttons and a single panel that " +
        "shows the content for whichever tab is active. Interviewers use " +
        "this to check composition (compound-component-style API) and " +
        "ARIA tab semantics, not just click handling.",
    ],
    requirements: [
      'Tab buttons use role="tab" inside a role="tablist"; the visible ' +
        'content region uses role="tabpanel".',
      "Exactly one tab is aria-selected at a time; it starts on the first tab.",
      "Clicking a tab switches the panel content to match.",
      "ArrowRight/ArrowLeft move focus (and, per the standard pattern, " +
        "selection) between tabs, wrapping at the ends.",
      "The component's public API takes a list of { label, content } pairs " +
        "as children/props — no tab's content is hardcoded into the tab bar.",
    ],
    followUps: [
      "How would you support this as a compound component (<Tabs><Tabs.List>/<Tabs.Panel>) instead of one big props object?",
      "What breaks if two <Tabs> instances render on the same page and why does that argue for context over module-level state?",
    ],
    testCode: `import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../App";

describe("Tabs", () => {
  it("shows the first tab's panel selected by default", () => {
    render(<App />);
    const tabs = screen.getAllByRole("tab");

    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(tabs[1]).toHaveAttribute("aria-selected", "false");
  });

  it("switches panels on click", async () => {
    const user = userEvent.setup();
    render(<App />);
    const tabs = screen.getAllByRole("tab");

    await user.click(tabs[1]);

    expect(tabs[1]).toHaveAttribute("aria-selected", "true");
    expect(tabs[0]).toHaveAttribute("aria-selected", "false");
  });

  it("moves selection with arrow keys and wraps at the ends", async () => {
    const user = userEvent.setup();
    render(<App />);
    const tabs = screen.getAllByRole("tab");
    tabs[0].focus();

    await user.keyboard("{ArrowLeft}"); // wrap backward from the first tab

    expect(tabs[tabs.length - 1]).toHaveAttribute("aria-selected", "true");
  });
});
`,
  },
  {
    slug: "infinite-scroll-list",
    title: "Infinite scroll list",
    tier: "hard",
    summary: "Load more items as the user nears the bottom, without duplicate fetches.",
    prompt: [
      "Build a list that starts with one page of items and loads the next " +
        "page automatically as the user scrolls near the bottom (mock the " +
        "'page fetch' with a fake async function — no real network/DOM " +
        "scroll wiring required for the test, an explicit 'load more' " +
        "trigger you call in tests is fine as long as production wiring " +
        "uses IntersectionObserver).",
    ],
    requirements: [
      "Renders the first page of items on mount.",
      "Loading the next page appends to the existing list — it does not replace it.",
      "While a page is loading, a second load is not triggered (no duplicate/overlapping fetches).",
      "Items already loaded keep a stable identity (key) across loads — no remount flicker.",
      "When the source is exhausted, no further load is attempted and that's surfaced in the UI (e.g. 'No more items').",
    ],
    followUps: [
      "Cursor-based vs. offset-based pagination — which is safer if items can be inserted/removed between page fetches, and why?",
      "At what list size would you reach for virtualization (windowing) on top of this, and what breaks if you don't?",
    ],
    testCode: `import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { App } from "../App";

describe("Infinite scroll list", () => {
  it("renders the first page on mount", async () => {
    render(<App />);

    await waitFor(() => expect(screen.getAllByRole("listitem").length).toBeGreaterThan(0));
  });

  it("appends the next page instead of replacing the list", async () => {
    render(<App />);
    await waitFor(() => expect(screen.getAllByRole("listitem").length).toBeGreaterThan(0));
    const firstPageCount = screen.getAllByRole("listitem").length;

    // Simulate reaching the bottom however your component exposes it —
    // e.g. clicking a "load more" sentinel button in a test-only mode.
    screen.getByTestId("load-more-sentinel").dispatchEvent(new Event("intersect"));

    await waitFor(() =>
      expect(screen.getAllByRole("listitem").length).toBeGreaterThan(firstPageCount),
    );
  });

  it("does not start a second load while one is already in flight", async () => {
    const fetchSpy = vi.fn();
    render(<App onFetchPage={fetchSpy} />);

    const sentinel = screen.getByTestId("load-more-sentinel");
    sentinel.dispatchEvent(new Event("intersect"));
    sentinel.dispatchEvent(new Event("intersect")); // fires again before the first resolves

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
  });

  it("shows an end-of-list message once the source is exhausted", async () => {
    render(<App />);

    // Drain every page (adjust the loop bound to your fixture's page count).
    for (let i = 0; i < 10; i++) {
      screen.getByTestId("load-more-sentinel").dispatchEvent(new Event("intersect"));
      await waitFor(() => {});
    }

    expect(await screen.findByText(/no more items/i)).toBeInTheDocument();
  });
});
`,
  },
  {
    slug: "toast-notifications",
    title: "Toast notification queue",
    tier: "hard",
    summary: "Stacked, auto-dismissing toasts driven by an imperative API.",
    prompt: [
      "Build a toast notification system: any part of the app can call " +
        "something like toast('Saved!') to enqueue a message; toasts stack " +
        "on screen, each auto-dismisses after a few seconds, and the user " +
        "can also dismiss one early. This is a state-machine-and-timers " +
        "problem more than a rendering one.",
    ],
    requirements: [
      "Exposes an imperative way to enqueue a toast from anywhere (a hook, " +
        "context, or module-level function) — not just a prop on one component.",
      "Multiple toasts enqueued in quick succession all appear, stacked, each " +
        "with an independent lifetime.",
      "Each toast auto-dismisses ~N seconds after it appears, on its own " +
        "timer (dismissing one early must not affect the others' timers).",
      "Clicking a toast's close control removes only that toast immediately.",
      "No state update (and no timer callback) fires after a toast — or the " +
        "whole app — has already unmounted.",
    ],
    followUps: [
      "Where does the queue's state live so any component can enqueue without prop-drilling — context, a store, or something else — and what's the tradeoff?",
      "How would you pause a toast's dismiss timer while the user is hovering it, then resume the remaining time on mouseleave?",
    ],
    testCode: `import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../App";

describe("Toast queue", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows a toast after it's enqueued", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /show toast/i }));

    expect(screen.getByRole("status")).toHaveTextContent(/saved/i);
  });

  it("stacks multiple toasts independently", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /show toast/i }));
    await user.click(screen.getByRole("button", { name: /show toast/i }));

    expect(screen.getAllByRole("status")).toHaveLength(2);
  });

  it("auto-dismisses a toast after its lifetime", async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ delay: null });
    render(<App />);

    await user.click(screen.getByRole("button", { name: /show toast/i }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("dismissing one toast early doesn't affect the others' timers", async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ delay: null });
    render(<App />);

    await user.click(screen.getByRole("button", { name: /show toast/i }));
    await user.click(screen.getByRole("button", { name: /show toast/i }));
    await user.click(screen.getAllByRole("button", { name: /close/i })[0]);

    expect(screen.getAllByRole("status")).toHaveLength(1);
  });
});
`,
  },
  {
    slug: "nested-comments",
    title: "Nested comments tree",
    tier: "hard",
    summary: "Recursive comment thread with reply, collapse, and add-at-any-depth.",
    prompt: [
      "Build a comment thread that renders recursively: each comment may " +
        "have replies, which may have their own replies, to arbitrary " +
        "depth. Users can collapse/expand a subtree and add a new reply at " +
        "any node. This is the 'mini system design' style challenge — the " +
        "data shape matters as much as the component.",
    ],
    requirements: [
      "Renders a tree of comments (seed it with 2-3 levels of fixture data) " +
        "with each reply nested under its parent.",
      "Each comment has a 'Collapse'/'Expand' control that hides/shows just " +
        "that comment's replies (not its own text).",
      "Each comment has a 'Reply' control that reveals a small form; " +
        "submitting it inserts a new comment as a child of that comment, " +
        "immediately visible.",
      "Collapsing a comment with an open reply form collapses the form too " +
        "(no orphaned open forms after their parent is hidden).",
      "The tree is built from a plain recursive data structure ({ id, text, " +
        "replies: [...] }), not a hardcoded, fixed-depth set of components.",
    ],
    followUps: [
      "How would you flatten this tree into an adjacency list (id -> comment) so a reply-add is an O(1) update instead of a deep immutable-clone down the tree?",
      "At what depth/comment-count would naive recursive rendering start to hurt, and what would you change first?",
    ],
    testCode: `import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../App";

describe("Nested comments", () => {
  it("renders a reply nested under its parent comment", () => {
    render(<App />);
    const parent = screen.getByText(/great point/i).closest("li");

    expect(within(parent!).getByText(/totally agree/i)).toBeInTheDocument();
  });

  it("collapsing a comment hides its replies but keeps its own text", async () => {
    const user = userEvent.setup();
    render(<App />);
    const parent = screen.getByText(/great point/i).closest("li")!;

    await user.click(within(parent).getByRole("button", { name: /collapse/i }));

    expect(within(parent).getByText(/great point/i)).toBeInTheDocument();
    expect(within(parent).queryByText(/totally agree/i)).not.toBeInTheDocument();
  });

  it("adding a reply inserts it as a visible child of that comment", async () => {
    const user = userEvent.setup();
    render(<App />);
    const parent = screen.getByText(/great point/i).closest("li")!;

    await user.click(within(parent).getByRole("button", { name: /^reply$/i }));
    await user.type(within(parent).getByRole("textbox"), "Nice thread!");
    await user.click(within(parent).getByRole("button", { name: /submit/i }));

    expect(within(parent).getByText("Nice thread!")).toBeInTheDocument();
  });
});
`,
  },
];
