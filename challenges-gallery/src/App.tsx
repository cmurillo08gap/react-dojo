import { useState } from "react";
import { CHALLENGES, TIER_LABEL, type Challenge, type Tier } from "./challenges";

const TIERS: Tier[] = ["easy", "medium", "hard"];

export function App() {
  // Non-null: CHALLENGES is a non-empty literal array (see ./challenges.ts).
  const [selectedSlug, setSelectedSlug] = useState(CHALLENGES[0]!.slug);
  const selected = CHALLENGES.find((c) => c.slug === selectedSlug) as Challenge;

  return (
    <div className="gallery">
      <header className="gallery-header">
        <h1>React interview challenges</h1>
        <p>
          Pick a challenge below to read what to build and the reference test file it should
          satisfy. This page is reference material only — nothing here is auto-checked. Build the
          actual component in <code>playground/src/App.jsx</code> (
          <code>pnpm --filter playground dev</code>), and optionally copy the test code over{" "}
          <code>playground/src/__tests__/App.test.jsx</code> to check your work with{" "}
          <code>pnpm --filter playground test:watch</code>.
        </p>
      </header>

      <div className="gallery-layout">
        <nav className="challenge-nav" aria-label="Challenges">
          {TIERS.map((tier) => (
            <section key={tier} className="challenge-nav-tier">
              <h2>{TIER_LABEL[tier]}</h2>
              <ul>
                {CHALLENGES.filter((c) => c.tier === tier).map((challenge) => (
                  <li key={challenge.slug}>
                    <button
                      type="button"
                      data-active={challenge.slug === selectedSlug}
                      onClick={() => setSelectedSlug(challenge.slug)}
                    >
                      {challenge.title}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </nav>

        <main className="challenge-detail">
          <div className="challenge-detail-header">
            <span className="tier-badge" data-tier={selected.tier}>
              {TIER_LABEL[selected.tier]}
            </span>
            <h2>{selected.title}</h2>
            <p className="challenge-summary">{selected.summary}</p>
          </div>

          <section>
            <h3>What to build</h3>
            {selected.prompt.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </section>

          <section>
            <h3>Requirements</h3>
            <ul>
              {selected.requirements.map((req, i) => (
                <li key={i}>{req}</li>
              ))}
            </ul>
          </section>

          <section>
            <h3>Follow-up questions (often asked live)</h3>
            <ul>
              {selected.followUps.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </section>

          <section>
            <h3>Reference unit tests</h3>
            <p>
              Vitest + React Testing Library, matching the setup already wired in{" "}
              <code>playground/</code>. Treat this as the spec — adjust queries to match the exact
              copy/markup you choose, the intent is what matters.
            </p>
            <pre>
              <code>{selected.testCode}</code>
            </pre>
          </section>
        </main>
      </div>
    </div>
  );
}
