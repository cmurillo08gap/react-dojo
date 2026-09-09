/**
 * The BROKEN version — built the way a rushed dev sometimes actually builds
 * a toggle: a plain `<div>` with an onClick, styled to look like a switch.
 *
 * What's missing, on purpose:
 *   - no `role` — assistive tech has no idea this is a switch/checkbox at
 *     all; it reads as plain, uninteresting content.
 *   - no `tabIndex` — a `<div>` isn't in the keyboard tab order by default,
 *     so a keyboard-only user can never reach it, let alone operate it.
 *   - no accessible name computed from a role — the visible text is here
 *     for sighted users only; it doesn't make this an accessible control.
 *
 * `data-testid="subscribe-toggle"` is the only handle anything (a test, or
 * a screen reader's fallback DOM inspection) has on this element right now.
 * See `SubscribeToggleFixed.tsx` for the real fix.
 */
interface SubscribeToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function SubscribeToggle({ checked, onChange }: SubscribeToggleProps) {
  return (
    <div
      data-testid="subscribe-toggle"
      data-checked={checked}
      className="toggle-switch toggle-switch-broken"
      onClick={() => onChange(!checked)}
    >
      <span className="toggle-track">
        <span className="toggle-thumb" />
      </span>
      Subscribe to newsletter
    </div>
  );
}
