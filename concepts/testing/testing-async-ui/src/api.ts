/**
 * Concept: Testing async UI
 *
 * A tiny "network" boundary the component talks to. This is the module the
 * test file mocks with `vi.mock("../api")` — tests never wait out the real
 * `setTimeout` below, they replace `fetchUser` outright so they stay fast
 * and deterministic. The delay only matters for the interactive demo, where
 * it makes the loading state something you can actually see.
 */

export interface User {
  id: string;
  name: string;
}

// The one id `fetchUser` resolves for — the demo's "succeed" mode and the
// real success-path test both use it.
export const GOOD_USER_ID = "u1";

const FIXTURE_USER: User = { id: GOOD_USER_ID, name: "Ada Lovelace" };

// Artificial network latency so the loading state is actually observable in
// the running demo — a real fetch never resolves synchronously, and this
// whole concept is about testing the loading/success/error states that
// produces.
const SIMULATED_DELAY_MS = 150;

export function fetchUser(id: string): Promise<User> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (id === GOOD_USER_ID) {
        resolve(FIXTURE_USER);
      } else {
        reject(new Error("user not found"));
      }
    }, SIMULATED_DELAY_MS);
  });
}
