/**
 * A tiny "external system" living entirely outside React — a
 * `setInterval`-based pub/sub, shaped the same way a WebSocket connection,
 * a `window` event target, or any other subscription-based API would be.
 * This is exactly the kind of thing `useEffect` exists to synchronize a
 * component with (see react.dev's `useEffect` reference: "Effects let you
 * synchronize a component with an external system").
 *
 * Nothing in this file is React state — it's plain module-level mutable
 * state, so components can only observe it by subscribing/unsubscribing,
 * the same way they'd talk to a real external system.
 */

export interface TickEvent {
  tick: number;
  listenerCount: number;
}

type TickListener = (tick: number) => void;
type TickObserver = (event: TickEvent) => void;

const TICK_MS = 1000;

let tickCount = 0;
let intervalId: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<TickListener>();
const observers = new Set<TickObserver>();

function ensureRunning(): void {
  if (intervalId !== null) return;
  intervalId = setInterval(() => {
    tickCount += 1;
    // Every listener fires on every tick — this is the visible symptom of a
    // leaked subscription: one mounted subscriber should mean one listener
    // call per tick, not two or three.
    listeners.forEach((listener) => listener(tickCount));
    observers.forEach((observer) => observer({ tick: tickCount, listenerCount: listeners.size }));
  }, TICK_MS);
}

/**
 * Subscribe to ticks. Returns an "unsubscribe" function — call it to stop
 * receiving ticks, exactly like the `connection.disconnect()` cleanup in
 * react.dev's canonical `useEffect` chat-room example.
 */
export function subscribeToTicker(listener: TickListener): () => void {
  listeners.add(listener);
  ensureRunning();
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Observe tick metadata for a dashboard/log — separate from
 * `subscribeToTicker` so the demo's own bookkeeping never counts as one of
 * the "active subscriber" listeners being demonstrated.
 */
export function observeTicker(observer: TickObserver): () => void {
  observers.add(observer);
  return () => {
    observers.delete(observer);
  };
}

export function getActiveListenerCount(): number {
  return listeners.size;
}

/**
 * Demo-only escape hatch: force-drop every lingering listener (including
 * ones leaked by the buggy variant) so the demo can be replayed from a
 * clean slate without reloading the page. A real external system wouldn't
 * expose something like this.
 */
export function resetTicker(): void {
  listeners.clear();
}
