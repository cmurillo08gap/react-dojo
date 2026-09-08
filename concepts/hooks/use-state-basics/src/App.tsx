import { useState } from "react";

/**
 * Concept: useState basics
 *
 * Demonstrates:
 * - state is scoped to the component instance, not shared globally
 * - the updater function form (`setCount(c => c + 1)`) avoids stale
 *   closures when the next state depends on the previous one
 * - React batches multiple setState calls triggered in the same event
 *   handler into a single re-render (see the "double" button)
 *
 * See ./README.md for the full write-up and discussion questions.
 */
export function App() {
  const [count, setCount] = useState(0);

  function increment() {
    setCount((c) => c + 1);
  }

  function incrementTwiceUnsafely() {
    // Bug on purpose: both calls close over the same stale `count`,
    // so this only ever adds 1, not 2. Compare with `incrementTwiceSafely`.
    setCount(count + 1);
    setCount(count + 1);
  }

  function incrementTwiceSafely() {
    setCount((c) => c + 1);
    setCount((c) => c + 1);
  }

  return (
    <main style={{ fontFamily: "system-ui", padding: "2rem", maxWidth: 480 }}>
      <h1>useState basics</h1>
      <p>
        Count: <strong>{count}</strong>
      </p>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button onClick={increment}>+1</button>
        <button onClick={incrementTwiceUnsafely}>+2 (stale closure bug)</button>
        <button onClick={incrementTwiceSafely}>+2 (updater fn, correct)</button>
        <button onClick={() => setCount(0)}>reset</button>
      </div>
    </main>
  );
}
