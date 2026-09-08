# Working in `interviews/`

- `question-bank/*.md` entries follow the shape used in the existing
  files: difficulty tag, discussion points (not a rigid script), 1-2
  follow-ups. Add questions there as new ones come up — don't invent a new
  file structure per topic.
- The `/mock-interview` skill (`.claude/skills/mock-interview/SKILL.md`)
  drives actual interview sessions. If you change how sessions should be
  run (format, debrief shape, where transcripts save), edit the skill file,
  not ad hoc behavior.
- Generated session transcripts go in `sessions/` and are gitignored by
  default — don't move that convention without discussing it, since it's a
  deliberate choice (interview attempts are personal/numerous).
