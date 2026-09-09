/**
 * The FIXED version — same visual look and click behavior as
 * `SubscribeToggle`, but built on a real `<button>` instead of a `<div>`:
 *
 *   - a real interactive element, so it's in the keyboard tab order and
 *     activates on Enter/Space for free, no extra key handlers needed.
 *   - `role="switch"` + `aria-checked` — the ARIA APG "switch" pattern —
 *     gives assistive tech an actual role and state to announce.
 *   - its own text content ("Subscribe to newsletter") is the accessible
 *     name computed for that role, the same way `getByRole("switch", {
 *     name: /subscribe/i })` finds it in a test.
 */
interface SubscribeToggleFixedProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function SubscribeToggleFixed({ checked, onChange }: SubscribeToggleFixedProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      data-checked={checked}
      className="toggle-switch toggle-switch-fixed"
      onClick={() => onChange(!checked)}
    >
      <span className="toggle-track">
        <span className="toggle-thumb" />
      </span>
      Subscribe to newsletter
    </button>
  );
}
