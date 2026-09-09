import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * The pre-hooks pattern for sharing stateful logic: a component that owns
 * the state + effect internally, and shares the result with whatever the
 * consumer wants to render via a function passed as `children`
 * ("render prop" / "function-as-children").
 *
 * See useMouseTracker.ts for the exact same logic extracted into a custom
 * hook instead, and App.tsx for the side-by-side demo and the discussion
 * of why hooks displaced most of this pattern's use cases.
 */

export interface MousePosition {
  x: number;
  y: number;
}

interface MouseTrackerProps {
  /**
   * The render prop. MouseTracker doesn't know or care what gets rendered
   * with the position — it just calls this function on every render with
   * the latest value, the same way it would call any other prop.
   */
  children: (pos: MousePosition) => ReactNode;
}

export function MouseTracker({ children }: MouseTrackerProps) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<MousePosition>({ x: 0, y: 0 });

  useEffect(() => {
    const node = surfaceRef.current;
    if (!node) return;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = node.getBoundingClientRect();
      setPos({ x: event.clientX - rect.left, y: event.clientY - rect.top });
    };

    node.addEventListener("mousemove", handleMouseMove);
    return () => node.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // MouseTracker renders a real wrapper element of its own (the tracked
  // surface) — every consumer gets this extra node/component in the tree,
  // whether it wants one or not. That's one of the costs the hook version
  // (useMouseTracker.ts) avoids.
  return (
    <div className="tracker-surface" ref={surfaceRef}>
      {children(pos)}
    </div>
  );
}
