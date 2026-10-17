#!/bin/bash
# Installs dependencies for Claude Code cloud sessions, so typecheck, lint, tests and build work
# from the start. npm ci, so the session never rewrites package-lock.json.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"
npm ci --no-audit --no-fund
