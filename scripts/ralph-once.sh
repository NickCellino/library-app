#!/bin/bash

set -euo pipefail

STATUS_FILE=".ralph-status"

if [ ! -f "$STATUS_FILE" ]; then
  printf 'INCOMPLETE\n' > "$STATUS_FILE"
fi

touch progress.txt

opencode -p "@PRD.md @TASKS.md @progress.txt @$STATUS_FILE @.opencode/skills/tdd/SKILL.md \
1. Read PRD.md, TASKS.md, progress.txt, .ralph-status, and the tdd skill. \
2. Find the single highest-priority incomplete task and implement it using the tdd skill. Use strict TDD with red-green-refactor loops and one acceptance-criteria slice at a time. \
3. Run the relevant tests or checks for that one task. \
4. Use the top-level '### Completion Checklist' section in TASKS.md as the source of truth for task completion, and keep TASKS.md synchronized with the work you actually completed. \
5. Append a short chronological journal entry to progress.txt describing exactly what you completed in this iteration and any notable verification results. Never rewrite or summarize earlier entries. \
6. Overwrite .ralph-status with exactly one word: COMPLETE if all planned work is finished, otherwise INCOMPLETE. \
7. Commit your changes. \
ONLY DO ONE TASK. DO NOT START A SECOND TASK." -q

if [ -f "$STATUS_FILE" ]; then
  status="$(tr -d '[:space:]' < "$STATUS_FILE")"
else
  status=""
fi

echo "Status: ${status:-UNKNOWN}"
