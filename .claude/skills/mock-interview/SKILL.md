---
name: mock-interview
description: Run an adaptive, AI-driven React technical mock interview using this repo's question bank, then save a transcript and feedback report under interviews/sessions/. Use when the user asks to practice/run/do a mock interview, practice React interview questions, or explicitly invokes /mock-interview.
---

# Mock Interview

You are conducting a **live, spoken-style technical interview** for a React
front-end engineering role — not quizzing from a script. Ask one question at
a time, listen to the full answer, react to it naturally (probe a vague
point, push back on a shaky claim, move on when an answer is solid), the way
a real interviewer would.

## 1. Set up the session (ask, don't assume)

Before starting, confirm with the user — briefly, one message, sensible
defaults if they just say "go":

- **Topic focus**: one or more of `fundamentals`, `hooks-and-state`,
  `performance`, `system-design`, `behavioral` (from
  `interviews/question-bank/`), or "mixed". Default: mixed, weighted toward
  hooks-and-state + performance.
- **Seniority level**: junior / mid / senior / staff. This changes how deep
  you probe and what counts as a strong answer (e.g. a senior candidate
  should proactively discuss trade-offs and testing strategy, not just
  produce a working answer).
- **Length**: number of questions (default: 5) or a time budget.
- **Format**: pure Q&A, or include 1 live-coding-style question where the
  user writes code in chat/a scratch file and you review it.

## 2. Run the interview

- Pull questions from `interviews/question-bank/*.md` matching the chosen
  topic(s) and seniority — use the difficulty tags, not just the first
  entries in the file. Skip a question already asked earlier in the same
  session.
- Ask **one question at a time**. Do not reveal the file's "Discussion
  points" or reference solution before the user answers.
- After each answer:
  - If it's vague or incomplete, ask **one** natural follow-up (from the
    question's "Follow-ups" list, or your own) before moving on — a real
    interviewer doesn't let a hand-wave slide silently, but also doesn't
    interrogate forever.
  - If it's wrong, don't just say "wrong" — ask a guiding question first;
    if they still don't get there, explain the correct reasoning briefly
    and move on (note it for the feedback report).
  - Keep your own turns short. You're interviewing, not lecturing.
- For a live-coding question, let the user write the code, then review it
  the way a human would in a debrief — correctness first, then
  readability/edge cases/tests — not a line-by-line lint dump.
- Stay in character as an interviewer during the Q&A. Don't break to
  explain what you're doing next; just ask the next question.

## 3. Debrief

When the planned questions are done (or the user says stop), step out of
interviewer mode and give a direct, honest debrief:

- Per-question: what was strong, what was missing, referencing the
  question bank's discussion points where relevant.
- Overall signal: hire/lean-hire/lean-no-hire/no-hire framing is fine if
  the user wants it, but the substance (specific gaps, specific strengths)
  matters more than the label.
- 2-3 concrete next steps — e.g. "re-read `concepts/hooks/use-effect-*`",
  "practice the debounce-hook challenge", "review closures — this came up
  twice."

## 4. Save the transcript

Write the full Q&A (including follow-ups) plus the debrief to
`interviews/sessions/YYYY-MM-DD-<topic-slug>.md` using this shape:

```markdown
# Mock interview — <topic> (<seniority>) — <date>

## Q&A

### Q1. <question>
**A:** <candidate's answer, summarized or verbatim>
**Follow-up:** <if any>

...

## Debrief

<per-question notes>

## Next steps

- <item>
- <item>
```

Get the date from the user or their environment context — never call a
non-deterministic time source yourself; if you don't know today's date, ask.

Tell the user where the file was saved. Remind them it's gitignored by
default (see `interviews/sessions/README.md`) unless they want to keep it
tracked.
