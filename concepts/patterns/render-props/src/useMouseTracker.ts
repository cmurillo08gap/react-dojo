import { useEffect, useRef, useState, type RefObject } from "react";
import type { MousePosition } from "./MouseTracker";

/**
 * The exact same "track the cursor inside an element" logic as
 * MouseTracker.tsx, extracted into a custom hook instead of a wrapper
 * component. A custom hook is just a function whose name starts with
 * `use` and that calls other hooks (`useState`/`useEffect` here) — see
 * react.dev's "Reusing Logic with Custom Hooks".
 *
 * The consumer calls this directly inside its own component and attaches
 * the returned `ref` to whichever element it already renders — no extra
 * wrapper component appears in the tree, unlike <MouseTracker>.
 */
export function useMouseTracker(): { ref: RefObject<HTMLDivElement | null>; pos: MousePosition } {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<MousePosition>({ x: 0, y: 0 });

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = node.getBoundingClientRect();
      setPos({ x: event.clientX - rect.left, y: event.clientY - rect.top });
    };

    node.addEventListener("mousemove", handleMouseMove);
    return () => node.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return { ref, pos };
}
