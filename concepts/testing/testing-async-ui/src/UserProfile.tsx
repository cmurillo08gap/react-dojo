import { useEffect, useState } from "react";
import { fetchUser, GOOD_USER_ID, type User } from "./api";

export type Status = "idle" | "loading" | "success" | "error";
type Mode = "succeed" | "fail";

// Any id other than GOOD_USER_ID makes the mocked/real fetchUser reject —
// this one just documents intent for the "fail" mode.
const BAD_USER_ID = "does-not-exist";

interface UserProfileProps {
  /** Notified on every status transition — lets App.tsx drive the "what
   * just happened" panel from the same state this component manages
   * internally, without lifting the fetch logic itself up. */
  onStatusChange?: (status: Status) => void;
}

/**
 * Manual-fetch demo component: plain `useState`, no `useActionState` or
 * Suspense. That's deliberate — it's what gives `findBy*`/`waitFor` a
 * reason to exist in the test file next to this one, instead of the test
 * just waiting on a `<Suspense>` fallback.
 */
export function UserProfile({ onStatusChange }: UserProfileProps) {
  const [mode, setMode] = useState<Mode>("succeed");
  const [status, setStatus] = useState<Status>("idle");
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onStatusChange?.(status);
    // onStatusChange is a setState function from the parent in every real
    // usage here — stable identity, safe to omit, but ESLint's exhaustive
    // deps would want it listed if this were the CI-enforced config.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function handleLoad() {
    setStatus("loading");
    try {
      const loaded = await fetchUser(mode === "succeed" ? GOOD_USER_ID : BAD_USER_ID);
      setUser(loaded);
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setStatus("error");
    }
  }

  return (
    <div className="user-profile">
      <label className="mode-select">
        Outcome
        <select value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
          <option value="succeed">Succeed</option>
          <option value="fail">Fail</option>
        </select>
      </label>

      <button onClick={handleLoad} disabled={status === "loading"}>
        Load user
      </button>

      <div className="user-profile-result">
        {status === "idle" && <p className="muted">No user loaded yet.</p>}
        {status === "loading" && <p>Loading…</p>}
        {status === "success" && user && <p className="user-name">{user.name}</p>}
        {status === "error" && (
          <p className="error-message" role="alert">
            Couldn't load user.
          </p>
        )}
      </div>

      {status === "error" && error && <p className="muted debug-readout">Cause: {error}</p>}
    </div>
  );
}
