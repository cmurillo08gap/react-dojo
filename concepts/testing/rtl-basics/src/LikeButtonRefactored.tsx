import { useState } from "react";

/**
 * Implementation B — the same like button after a plausible teammate
 * "styling refactor": the icon and label now live in their own nested
 * <span>s (so CSS/animations can target them independently) and the
 * button's class name changed from "like-btn" to "like-toggle". The icon
 * span is `aria-hidden` since it's decorative once the label spells out
 * "Like" in text.
 *
 * Behavior is byte-for-byte identical to LikeButton: same click logic,
 * same counter semantics. Role ("button") and accessible name (always
 * contains "Like") are unchanged too — a user staring at the screen, or a
 * test using `getByRole("button", { name: /like/i })`, cannot tell this
 * apart from LikeButton. Only a test that reaches into the DOM for
 * ".like-btn" (a class name that no longer exists here) can tell.
 */
export function LikeButtonRefactored() {
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
    <button type="button" className="like-toggle" onClick={handleClick}>
      <span className="like-toggle__icon" aria-hidden="true">
        {liked ? "♥" : "♡"}
      </span>
      <span className="like-toggle__label">{liked ? `Like (${count})` : "Like"}</span>
    </button>
  );
}
