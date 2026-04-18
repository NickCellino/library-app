#!/bin/bash

set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: $0 <iterations>"
  exit 1
fi

STATUS_FILE=".ralph-status"

if [ ! -f "$STATUS_FILE" ]; then
  printf 'INCOMPLETE\n' > "$STATUS_FILE"
fi

touch progress.txt

for ((i=1; i<=$1; i++)); do
  opencode run "@PRD.md @TASKS.md @progress.txt @$STATUS_FILE \
1. Read PRD.md, TASKS.md, progress.txt, .ralph-status. \
2. Find the single highest-priority incomplete task and implement it (using red-green TDD wherever possible/reasonable). \
3. Use the top-level '### Completion Checklist' section in TASKS.md as the source of truth for task completion, and keep TASKS.md synchronized with the work you actually completed. \
4. Append a short chronological journal entry to progress.txt describing exactly what you completed in this iteration and any notable verification results. Never rewrite or summarize earlier entries. \
5. Overwrite .ralph-status with exactly one word: COMPLETE if all planned work is finished, otherwise INCOMPLETE. \
6. Commit your changes. \
ONLY DO ONE TASK. DO NOT START A SECOND TASK."

  if [ -f "$STATUS_FILE" ]; then
    status="$(tr -d '[:space:]' < "$STATUS_FILE")"
  else
    status=""
  fi

  if [ "$status" = "COMPLETE" ]; then
    echo "All work complete after $i iterations."
    exit 0
  fi
done

echo "Stopped after $1 iterations with status: ${status:-UNKNOWN}"
