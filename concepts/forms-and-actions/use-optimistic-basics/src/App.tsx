import { useOptimistic, useState, useTransition, type FormEvent } from "react";

/**
 * Concept: useOptimistic basics
 *
 * Layout convention for every concept package — copy this shape for new
 * concepts, same as you'd copy this package's README.md:
 *
 *   1. Theory panel   — condensed explanation, always visible.
 *   2. Interactive demo — the actual behavior to click through.
 *   3. "What just happened" panel — reacts to the last button pressed,
 *      showing the exact code that ran plus why it behaved that way.
 *
 * The demo contrasts two ways of posting a comment against a simulated
 * 1.5s network request:
 *
 *   - "Naive" — the comment is only added to state after the request
 *     resolves. The UI just sits there, disabled, for the full round trip,
 *     with no feedback that anything happened until it's over.
 *   - "useOptimistic" — the comment appears immediately (marked "sending…"),
 *     rendered from a temporary optimistic value layered on top of the real
 *     state. When the request settles, either the real state catches up
 *     (success) or — because the real state was never touched — the
 *     temporary comment disappears on its own (rollback on failure).
 *
 * A "Simulate failure" toggle lets you trigger the rejection path in both
 * modes, so the rollback isn't just described — it's something you can
 * actually watch happen.
 *
 * See ./README.md for the full write-up and discussion questions.
 */

interface Comment {
  id: number;
  text: string;
  sending?: boolean;
}

type Mode = "naive" | "optimistic";
type Phase = "pending" | "success" | "failure";

interface ActionInfo {
  label: string;
  code: string;
  explanation: string;
  outcome?: "buggy" | "correct";
}

const INITIAL_COMMENTS: Comment[] = [
  { id: 1, text: "First comment on this post!" },
  { id: 2, text: "Nice write-up, thanks for sharing." },
];

// Fake backend: resolves with the saved comment after an artificial delay,
// or rejects if `shouldFail` is set — this is what "simulate failure"
// wires into.
let nextCommentId = 100;
function postComment(text: string, shouldFail: boolean): Promise<Comment> {
  const id = nextCommentId++;
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) {
        reject(new Error("Network error: comment was not saved."));
      } else {
        resolve({ id, text });
      }
    }, 1500);
  });
}

// Keep these snippets in sync with the actual handlers below — they're
// display copies, not derived automatically, so the reader sees exactly
// what ran without any build-time magic.
const NAIVE_ACTIONS: Record<Phase, ActionInfo> = {
  pending: {
    label: "Naive: request sent",
    code: `async function submitNaive(text) {
  setSubmitting(true);
  const saved = await postComment(text); // 1.5s round trip
  setComments((cs) => [...cs, saved]);   // comment only appears now
  setSubmitting(false);
}`,
    explanation:
      "The comment is only added to state after postComment resolves. For the whole 1.5s " +
      "round trip the list shows nothing new — just a disabled input with no feedback.",
  },
  success: {
    label: "Naive: succeeded",
    code: `const saved = await postComment(text);
setComments((cs) => [...cs, saved]); // appears only now, ~1.5s after clicking`,
    explanation:
      "The request succeeded, so the comment finally appears — but only after the full " +
      "round trip. The learner waited 1.5s staring at an unchanged list.",
  },
  failure: {
    label: "Naive: failed",
    code: `try {
  const saved = await postComment(text); // rejects after 1.5s
  setComments((cs) => [...cs, saved]);
} catch (err) {
  setError(err.message);                 // comment never appeared at all
}`,
    explanation:
      "The request failed, so the comment never enters state — there's nothing to roll " +
      "back because it was never shown. The user just waited 1.5s to see an error.",
  },
};

const OPTIMISTIC_ACTIONS: Record<Phase, ActionInfo> = {
  pending: {
    label: "useOptimistic: request sent",
    code: `const [optimisticComments, addOptimisticComment] = useOptimistic(
  comments,
  (state, newComment) => [...state, newComment],
);

startTransition(async () => {
  addOptimisticComment({ id, text, sending: true }); // shows immediately
  const saved = await postComment(text);             // 1.5s round trip
  setComments((cs) => [...cs, saved]);
});`,
    explanation:
      "addOptimisticComment runs synchronously inside the transition, so React renders the " +
      'new comment (marked "sending…") immediately — before postComment\'s 1.5s delay has ' +
      "even started.",
  },
  success: {
    label: "useOptimistic: succeeded",
    code: `const saved = await postComment(text);
setComments((cs) => [...cs, saved]); // real state catches up

// react.dev: "There's no extra render to clear the optimistic state.
// The optimistic and real state converge in the same render when
// the Transition completes."`,
    explanation:
      "The request succeeded, so setComments folds the confirmed comment into real state. " +
      "Optimistic and real state converge in that same render — there's no separate step " +
      "that explicitly 'clears' the optimistic flag.",
    outcome: "correct",
  },
  failure: {
    label: "useOptimistic: failed (rollback)",
    code: `try {
  addOptimisticComment({ id, text, sending: true });
  const saved = await postComment(text); // rejects after 1.5s
  setComments((cs) => [...cs, saved]);
} catch (err) {
  setError(err.message);
  // No manual "undo" here: setComments was never called, so once this
  // transition settles, optimisticComments recomputes from the
  // unchanged \`comments\` array — the temporary comment disappears on
  // its own. That disappearance IS the rollback.
}`,
    explanation:
      "The request failed, so setComments never ran. optimisticComments is derived fresh " +
      'from comments + the reducer on every render, so the temporary "sending…" comment ' +
      "vanishes automatically once the transition settles — React didn't need to be told to " +
      "undo anything.",
    outcome: "correct",
  },
};

export function App() {
  const [mode, setMode] = useState<Mode>("naive");
  const [activePhase, setActivePhase] = useState<Phase | null>(null);
  const [simulateFailure, setSimulateFailure] = useState(false);

  // --- Naive version: comment only enters state after the round trip ----
  const [naiveComments, setNaiveComments] = useState<Comment[]>(INITIAL_COMMENTS);
  const [naiveDraft, setNaiveDraft] = useState("");
  const [naiveSubmitting, setNaiveSubmitting] = useState(false);
  const [naiveError, setNaiveError] = useState<string | null>(null);

  // --- useOptimistic version ---------------------------------------------
  const [comments, setComments] = useState<Comment[]>(INITIAL_COMMENTS);
  const [optimisticComments, addOptimisticComment] = useOptimistic(
    comments,
    (state: Comment[], newComment: Comment) => [...state, newComment],
  );
  const [optimisticDraft, setOptimisticDraft] = useState("");
  const [optimisticError, setOptimisticError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function submitNaive(event: FormEvent) {
    event.preventDefault();
    const text = naiveDraft.trim();
    if (!text) return;
    setNaiveDraft("");
    setNaiveError(null);
    setNaiveSubmitting(true);
    setActivePhase("pending");
    try {
      const saved = await postComment(text, simulateFailure);
      setNaiveComments((cs) => [...cs, saved]);
      setActivePhase("success");
    } catch (err) {
      setNaiveError((err as Error).message);
      setActivePhase("failure");
    } finally {
      setNaiveSubmitting(false);
    }
  }

  function submitOptimistic(event: FormEvent) {
    event.preventDefault();
    const text = optimisticDraft.trim();
    if (!text) return;
    setOptimisticDraft("");
    setOptimisticError(null);
    setActivePhase("pending");
    startTransition(async () => {
      addOptimisticComment({ id: nextCommentId, text, sending: true });
      try {
        const saved = await postComment(text, simulateFailure);
        setComments((cs) => [...cs, saved]);
        setActivePhase("success");
      } catch (err) {
        setOptimisticError((err as Error).message);
        setActivePhase("failure");
        // No rollback call needed — see OPTIMISTIC_ACTIONS.failure above.
      }
    });
  }

  function switchMode(next: Mode) {
    setMode(next);
    setActivePhase(null);
  }

  const actions = mode === "naive" ? NAIVE_ACTIONS : OPTIMISTIC_ACTIONS;
  const active = activePhase ? actions[activePhase] : null;

  return (
    <main className="concept">
      <header className="concept-header">
        <h1>useOptimistic basics</h1>
        <p>
          Waiting for a round trip before showing the result of an action (posting a comment,
          liking a post) makes an app feel slow even when the request itself is fast.{" "}
          <code>useOptimistic</code> lets you render the <em>expected</em> result immediately,
          then reconciles with the real response — confirming it silently on success, or letting
          it disappear on its own if the request fails.
        </p>
      </header>

      <div className="concept-grid">
        <section className="panel" data-accent="theory">
          <h2>Theory</h2>

          <h3 className="theory-subhead">Declaring optimistic state</h3>
          <p>
            <code>useOptimistic</code> is a hook <strong>built into React 19</strong> (imported
            from <code>"react"</code>) for showing a temporary value while an action is in
            progress.
          </p>
          <pre>
            <code>const [optimisticState, addOptimistic] = useOptimistic(state, updateFn);</code>
          </pre>
          <ul>
            <li>
              <code>state</code> — the real value (from <code>useState</code>, props, etc.) shown
              whenever nothing is pending.
            </li>
            <li>
              <code>updateFn(currentState, optimisticValue)</code> — a pure function you write
              that computes the value to show right away, given the latest real state and
              whatever you pass to <code>addOptimistic</code>.
            </li>
            <li>
              <code>optimisticState</code> — what to render. Equal to <code>state</code> unless an
              action is in progress, in which case it's <code>updateFn</code>'s return value.
            </li>
            <li>
              <code>addOptimistic</code> — call it with the optimistic value to trigger the
              temporary render. It must be called <strong>inside a transition or an Action</strong>{" "}
              (e.g. a <code>startTransition</code> callback, or a <code>{`<form action={fn}>`}</code>{" "}
              function) — calling it from a plain event handler logs: "An optimistic state update
              occurred outside a Transition or Action."
            </li>
          </ul>

          <h3 className="theory-subhead">How it reconciles (and rolls back)</h3>
          <ul>
            <li>
              Calling <code>addOptimistic</code> re-renders synchronously with the temporary
              value — there's no round trip before the learner sees something happen.
            </li>
            <li>
              If the real <code>state</code> changes while the action is still pending, React
              re-runs <code>updateFn</code> against that <em>new</em> state, so the optimistic
              addition stays layered on top of fresh data instead of stale data.
            </li>
            <li>
              Per react.dev: "There's no extra render to clear the optimistic state. The
              optimistic and real state converge in the same render when the Transition
              completes." Success isn't a separate step — it's just the next state update landing.
            </li>
            <li>
              There's no explicit "undo"/rollback API. If the action throws before ever updating
              the real <code>state</code>, the optimistic value was only ever a temporary overlay
              on top of it — once the transition settles, React renders <code>state</code> as-is
              again, and the temporary item disappears on its own.
            </li>
          </ul>

          <h3 className="theory-subhead">Key rules</h3>
          <ul>
            <li>
              <code>useOptimistic</code> doesn't manage errors for you — pair it with your own{" "}
              <code>try</code>/<code>catch</code> and error state to tell the user what went
              wrong; the hook only handles the temporary display, not messaging.
            </li>
            <li>
              Best suited to actions that are very likely to succeed (posting a comment, liking a
              post, toggling a follow) — cases where showing instant feedback is worth
              occasionally having to let it quietly disappear.
            </li>
          </ul>
        </section>

        <section className="panel" data-accent="demo">
          <h2>Interactive demo</h2>
          <div className="demo-buttons" role="tablist" aria-label="Implementation">
            <button
              type="button"
              onClick={() => switchMode("naive")}
              data-active={mode === "naive"}
              aria-pressed={mode === "naive"}
            >
              Naive (wait for round trip)
            </button>
            <button
              type="button"
              onClick={() => switchMode("optimistic")}
              data-active={mode === "optimistic"}
              aria-pressed={mode === "optimistic"}
            >
              useOptimistic
            </button>
          </div>

          <label className="failure-toggle">
            <input
              type="checkbox"
              checked={simulateFailure}
              onChange={(e) => setSimulateFailure(e.target.checked)}
            />
            Simulate failure (the next post you submit will be rejected after 1.5s)
          </label>

          {mode === "naive" ? (
            <>
              <form className="comment-form" onSubmit={submitNaive}>
                <input
                  type="text"
                  value={naiveDraft}
                  onChange={(e) => setNaiveDraft(e.target.value)}
                  placeholder="Write a comment…"
                  disabled={naiveSubmitting}
                />
                <button type="submit" disabled={naiveSubmitting || !naiveDraft.trim()}>
                  {naiveSubmitting ? "Posting…" : "Post"}
                </button>
              </form>
              {naiveError && <p className="error-banner">{naiveError}</p>}
              <ul className="comment-list">
                {naiveComments.map((comment) => (
                  <li key={comment.id}>{comment.text}</li>
                ))}
              </ul>
              {naiveSubmitting && (
                <p className="pending-tag">
                  Request in flight — the list above won't change until it resolves.
                </p>
              )}
            </>
          ) : (
            <>
              <form className="comment-form" onSubmit={submitOptimistic}>
                <input
                  type="text"
                  value={optimisticDraft}
                  onChange={(e) => setOptimisticDraft(e.target.value)}
                  placeholder="Write a comment…"
                  disabled={isPending}
                />
                <button type="submit" disabled={isPending || !optimisticDraft.trim()}>
                  {isPending ? "Posting…" : "Post"}
                </button>
              </form>
              {optimisticError && (
                <p className="error-banner">
                  {optimisticError} (the comment you just posted has already been removed above)
                </p>
              )}
              <ul className="comment-list">
                {optimisticComments.map((comment) => (
                  <li key={comment.id} data-sending={comment.sending ?? false}>
                    {comment.text}
                    {comment.sending && <span className="sending-tag">sending…</span>}
                  </li>
                ))}
              </ul>
            </>
          )}

          <p className="explain-placeholder" style={{ marginTop: "0.75rem" }}>
            Turn on <strong>Simulate failure</strong> and post a comment in each mode. In{" "}
            <strong>Naive</strong>, you wait 1.5s and see only an error — the comment never
            appeared. In <strong>useOptimistic</strong>, the comment appears instantly, then
            disappears again 1.5s later when the rejection lands — that disappearance is the
            rollback.
          </p>
        </section>

        <section className="panel explain" data-accent="explain">
          <h2>What just happened</h2>
          {active ? (
            <div className="explain-body">
              <p>
                {active.outcome && (
                  <span className={`explain-outcome ${active.outcome}`}>
                    {active.outcome === "buggy" ? "⚠ Buggy: " : "✓ Correct: "}
                  </span>
                )}
                {active.explanation}
              </p>
              <pre>
                <code>{active.code}</code>
              </pre>
            </div>
          ) : (
            <p className="explain-placeholder">
              Post a comment above to see the exact code that ran and why it behaved that way.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
