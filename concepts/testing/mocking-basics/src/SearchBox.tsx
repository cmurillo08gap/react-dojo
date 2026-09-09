import { useEffect, useState } from "react";
import { searchApi, type SearchResult } from "./api";

const DEBOUNCE_MS = 300;

/**
 * Controlled search input, debounced with useEffect + setTimeout so rapid
 * typing fires exactly one real searchApi() call instead of one per
 * keystroke.
 *
 * How the debounce works: every keystroke updates `query`, which re-runs
 * this effect. React always runs an effect's cleanup function (if any)
 * before running the effect again for new dependencies, and one final time
 * on unmount — see react.dev's useEffect reference. So each keystroke's
 * effect run first clears the *previous* keystroke's pending
 * setTimeout via the cleanup, then schedules a fresh one. Only the timer
 * from the last keystroke in a burst ever survives long enough to fire.
 *
 * Clearing the input back to empty is handled directly in the change
 * handler, not as a synchronous setState at the top of this effect — an
 * effect is for synchronizing with something external (here, the debounce
 * timer and the search call), and a plain reset in response to the input
 * event doesn't need one.
 */
export function SearchBox() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  function handleChange(value: string) {
    setQuery(value);
    if (!value) {
      // Clearing the input is a direct response to this event, not a sync
      // with an external system — reset here, in the event handler, rather
      // than as a synchronous setState at the top of the effect below
      // (react-hooks/set-state-in-effect flags exactly that pattern).
      setResults(null);
      setIsSearching(false);
    }
  }

  useEffect(() => {
    if (!query) return; // handleChange already reset state for an empty query.

    let cancelled = false;

    const timerId = setTimeout(() => {
      // setIsSearching(true) lives here, inside the timer callback, rather
      // than synchronously at the top of the effect — react-hooks'
      // set-state-in-effect rule wants every setState in an effect to
      // happen from within a callback (a timer firing, a promise
      // resolving), not directly in the effect body. This also means
      // "Searching…" only appears once the debounce window has actually
      // elapsed and a real search is in flight, not during the debounce
      // delay itself.
      if (cancelled) return;
      setIsSearching(true);
      searchApi(query).then((found) => {
        if (!cancelled) {
          setResults(found);
          setIsSearching(false);
        }
      });
    }, DEBOUNCE_MS);

    return () => {
      // Runs before the effect re-runs for the next keystroke's `query`,
      // or on unmount. `cancelled` also guards against a stale response
      // landing after a newer query has already started.
      cancelled = true;
      clearTimeout(timerId);
    };
  }, [query]);

  return (
    <div className="search-box">
      <label htmlFor="search-box-input">Search the catalog</label>
      <input
        id="search-box-input"
        type="text"
        value={query}
        onChange={(event) => handleChange(event.target.value)}
        placeholder="Try “keyboard”…"
        autoComplete="off"
      />

      {isSearching && (
        <p role="status" className="search-status">
          Searching…
        </p>
      )}

      {!isSearching && results !== null && (
        <>
          {results.length > 0 ? (
            <ul className="search-results">
              {results.map((result) => (
                <li key={result.id}>{result.label}</li>
              ))}
            </ul>
          ) : (
            <p className="search-status">No results</p>
          )}
        </>
      )}
    </div>
  );
}
