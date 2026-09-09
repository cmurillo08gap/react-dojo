/**
 * A real, separate module — never imported with a static top-of-file
 * `import` anywhere in this package. App.tsx reaches it only through a
 * dynamic `import("./HeavyPanel")` inside `React.lazy(...)`, which is what
 * lets Vite split this file's code into its own chunk on `pnpm build`
 * instead of folding it into the main bundle. See the README for how to
 * verify the split in `dist/assets`.
 *
 * The "heavy" content here is a stand-in for something like a chart
 * library, a rich text editor, or an admin-only data table — code that's
 * real weight in a production bundle but that most visitors never need.
 */
export default function HeavyPanel() {
  const fakeRows = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    width: `${55 + ((i * 13) % 40)}%`,
  }));

  return (
    <div className="loaded-panel">
      <h3>Heavy panel (lazily loaded)</h3>
      <p>
        This component's code lived in its own chunk until React actually needed it — the network
        fetch + parse just happened, on demand.
      </p>
      <div className="fake-rows">
        {fakeRows.map((row) => (
          <div key={row.id} className="fake-row" style={{ width: row.width }} />
        ))}
      </div>
    </div>
  );
}
