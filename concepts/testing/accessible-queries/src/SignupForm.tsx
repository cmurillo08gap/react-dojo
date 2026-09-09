import { useState, type FormEvent } from "react";
import { SubscribeToggle } from "./SubscribeToggle";
import { SubscribeToggleFixed } from "./SubscribeToggleFixed";

export interface SignupFormValues {
  email: string;
  agreedToTerms: boolean;
  subscribed: boolean;
}

interface SignupFormProps {
  /** Which implementation of the newsletter toggle to render. */
  variant: "broken" | "fixed";
  onSubmit: (values: SignupFormValues) => void;
}

/**
 * A small "Sign up" form used to contrast two ways of querying it in tests:
 *
 *   - the email input and terms checkbox are always built accessibly
 *     (a `<label htmlFor>` and a real `<input type="checkbox">`), so
 *     `getByLabelText`/`getByRole("checkbox", ...)` find them either way.
 *   - the newsletter toggle swaps between the BROKEN `<div onClick>`
 *     (`SubscribeToggle`) and the FIXED `role="switch"` button
 *     (`SubscribeToggleFixed`) depending on `variant` — see both files for
 *     what differs and why it matters for a real user, not just a test.
 */
export function SignupForm({ variant, onSubmit }: SignupFormProps) {
  const [email, setEmail] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({ email, agreedToTerms, subscribed });
  }

  const Toggle = variant === "fixed" ? SubscribeToggleFixed : SubscribeToggle;

  return (
    <form className="signup-form" onSubmit={handleSubmit}>
      <div className="form-field">
        <label htmlFor="signup-email">Email</label>
        <input
          id="signup-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>

      <div className="form-field form-field-checkbox">
        <input
          id="signup-terms"
          type="checkbox"
          checked={agreedToTerms}
          onChange={(event) => setAgreedToTerms(event.target.checked)}
        />
        <label htmlFor="signup-terms">I agree to the terms</label>
      </div>

      <div className="form-field">
        <Toggle checked={subscribed} onChange={setSubscribed} />
      </div>

      <button type="submit">Sign up</button>
    </form>
  );
}
