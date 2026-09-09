import { useState } from "react";

/**
 * Implementation A — a plain, single-element like button.
 *
 * Behavior (kept deterministic and simple):
 *  - Unliked: renders "♡ Like".
 *  - Clicking while unliked likes it, bumping a click counter, and renders
 *    "♥ Like (n)".
 *  - Clicking while liked un-likes it (back to "♡ Like"); the counter is
 *    NOT reset, and does not increment again until the next like.
 *
 * Accessible role: "button" (a native <button>).
 * Accessible name: always contains the word "Like" in both states, so
 * `getByRole("button", { name: /like/i })` matches this implementation
 * regardless of whether it's currently liked.
 */
export function LikeButton() {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);

  function handleClick() {
    if (liked) {
      setLiked(false);
    } else {
      setLiked(true);
      setCount((c) => c + 1);
    }
  }

  return (
    <button type="button" className="like-btn" onClick={handleClick}>
      {liked ? `♥ Like (${count})` : "♡ Like"}
    </button>
  );
}
