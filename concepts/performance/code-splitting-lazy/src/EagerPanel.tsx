/**
 * Imported normally (a plain top-of-file `import`) by App.tsx, so this
 * component's code is bundled into the main chunk whether or not the user
 * ever clicks the button that reveals it. There's nothing to "load" here at
 * click time — it's already sitting in memory — which is exactly the
 * contrast this concept package draws against HeavyPanel.tsx.
 */
export function EagerPanel() {
  return (
    <div className="loaded-panel">
      <h3>Eager panel</h3>
      <p>
        Rendered instantly — this component's JS was already parsed and executed as part of the main
        bundle, before you clicked anything.
      </p>
      <div className="fake-rows">
        <div className="fake-row" style={{ width: "90%" }} />
        <div className="fake-row" style={{ width: "70%" }} />
        <div className="fake-row" style={{ width: "80%" }} />
      </div>
    </div>
  );
}
