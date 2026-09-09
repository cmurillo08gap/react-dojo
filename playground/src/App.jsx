import { useState } from "react";

// Scratch space — write, break, and rerun whatever you're testing here.
// Nothing in this package is graded or read by any other package, so feel
// free to gut this component entirely.
export function App() {
  const [count, setCount] = useState(0);

  return (
    <main>
      <h1>Hello, world 👋</h1>
      <p>
        This is your playground. Edit <code>src/App.jsx</code> and save — Vite
        hot-reloads the page instantly.
      </p>
      <button onClick={() => setCount((c) => c + 1)}>Clicked {count} times</button>
    </main>
  );
}
