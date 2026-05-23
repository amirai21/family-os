---
name: session-log
description: >
  Append a short session log entry to the project's CLAUDE.md file. Use this skill proactively — invoke it
  roughly every 10 significant tool uses (file edits, code changes, meaningful investigations) to preserve
  session context for future agents. Also invoke it when the user explicitly asks to log progress, save
  context, update the session log, or before ending a long session. If you notice you've done substantial
  work without logging, trigger this skill. The goal is continuity — the next agent that opens this repo
  should immediately know what happened in prior sessions.
---

# Session Log

Append a concise progress entry to the `## Session Log` section at the bottom of the project's `CLAUDE.md`.

## When to invoke

- Roughly every 10 significant tool uses (edits, writes, investigations)
- When the user asks to save context or log progress
- Before a session is likely to end (large task just completed, user says "thanks" / "that's it")
- When you realize substantial work has happened since the last log entry

The point is to leave breadcrumbs for the next agent session. Don't over-log trivial steps — capture meaningful milestones.

## How to write an entry

1. Read `CLAUDE.md` from the project root
2. Find the `## Session Log` section at the bottom. If it doesn't exist, append it
3. Add a new entry under the current date heading (`### YYYY-MM-DD`)
4. If today's date heading already exists, append bullets to it (don't create a duplicate heading)
5. Write 2-4 bullets summarizing what was accomplished since the last entry
6. Each bullet should be under 15 words — short and scannable
7. Use past tense, start with a verb (Fixed, Added, Verified, Investigated, Refactored)
8. Mention specific files/components when relevant — future agents need to know *where* things happened
9. Note any bugs found, decisions made, or known issues left open

## Entry format

```markdown
### YYYY-MM-DD
- Fixed `register.tsx` temporal dead zone bug (`joiningFamily` used before declaration)
- Verified all 5 web tabs render correctly with no console errors
- Enriched CLAUDE.md with auth flow, design tokens, and cross-platform gotchas
```

## What NOT to log

- Trivial reads or exploratory file browsing
- Failed attempts that were immediately reversed
- Internal tool mechanics (don't say "ran 3 bash commands")
- Anything the user asked to keep private

## Important

- Keep the total Session Log section manageable. If it grows past ~40 entries, summarize older entries into a single "Earlier work" block at the top of the section
- Never delete or modify existing log entries — only append
- Don't add entries if nothing meaningful happened since the last one
