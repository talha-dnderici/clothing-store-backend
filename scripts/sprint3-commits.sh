#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# Sprint 3 commit helper for baranutkuguler.
#
# Usage:
#   bash scripts/sprint3-commits.sh <step>
#   bash scripts/sprint3-commits.sh all          # run 1..6 in order
#   bash scripts/sprint3-commits.sh list         # show what each step stages
#
# Each step stages a small, focused diff and commits as baranutkuguler
# (so the other email never appears on these grade-counting commits).
#
# Steps (>= 5 commits required for grading):
#   1) backend: product-manager stock management (SCRUM-12)
#   2) FE-4   : out-of-stock product card UI   (SCRUM-33)
#   3) FE-8   : cart page + guest login flow   (SCRUM-36)
#   4) FE-9   : mock checkout / payment form   (SCRUM-37)
#   5) FE-10  : on-screen invoice summary      (SCRUM-38)
#   6) FE-11  : jest/vitest UI component tests (SCRUM-39)
# -----------------------------------------------------------------------------

set -euo pipefail

# ---- Identity override (your OTHER email, not this one) ---------------------
GIT_NAME="baranutkuguler"
GIT_EMAIL="baranutkuguler@users.noreply.github.com"   # <-- EDIT to your real email
# Use `GIT_AUTHOR_*` + `GIT_COMMITTER_*` so the repo config stays untouched.
export GIT_AUTHOR_NAME="$GIT_NAME"
export GIT_AUTHOR_EMAIL="$GIT_EMAIL"
export GIT_COMMITTER_NAME="$GIT_NAME"
export GIT_COMMITTER_EMAIL="$GIT_EMAIL"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# ---- File groups (what each step stages) ------------------------------------
files_step_1=(
  "backend/apps/main-service/src/dto/update-stock.dto.ts"
  "backend/apps/main-service/src/product-manager.controller.ts"
  "backend/apps/main-service/src/main.module.ts"
  "backend/apps/main-service/src/main.service.ts"
  "backend/apps/api-gateway/src/app.controller.ts"
)
files_step_2=(
  "frontend/src/app/components/ProductCard.tsx"
)
files_step_3=(
  "frontend/src/app/pages/Cart.tsx"
  "frontend/src/app/routes.ts"
  "frontend/src/app/components/CartDrawer.tsx"
)
files_step_4=(
  "frontend/src/app/pages/Checkout.tsx"
)
files_step_5=(
  "frontend/src/app/pages/Invoice.tsx"
)
files_step_6=(
  "frontend/src/app/__tests__/setup.ts"
  "frontend/src/app/__tests__/ProductCard.test.tsx"
  "frontend/src/app/__tests__/Cart.test.tsx"
  "frontend/src/app/__tests__/Checkout.test.tsx"
  "frontend/vitest.config.ts"
  "frontend/package.json"
)

msg_1="backend(product-manager): add stock management + manager product endpoints (SCRUM-12)"
msg_2="frontend(FE-4): visually mark out-of-stock items and disable Add to Cart (SCRUM-33)"
msg_3="frontend(FE-8): cart page with guest-to-login redirection flow (SCRUM-36)"
msg_4="frontend(FE-9): mock checkout/payment form interface (SCRUM-37)"
msg_5="frontend(FE-10): on-screen invoice summary after payment confirmation (SCRUM-38)"
msg_6="frontend(FE-11): jest/vitest component tests for checkout flow (SCRUM-39)"

do_commit() {
  local step=$1
  local files_var="files_step_${step}[@]"
  local msg_var="msg_${step}"
  local msg="${!msg_var}"
  git add -- "${!files_var}" 2>/dev/null || true
  if git diff --cached --quiet; then
    echo "[step $step] nothing to commit (already clean) — skipping"
    return 0
  fi
  git commit -m "$msg"
  echo "[step $step] committed: $msg"
}

list_steps() {
  for s in 1 2 3 4 5 6; do
    local files_var="files_step_${s}[@]"
    local msg_var="msg_${s}"
    echo "[$s] ${!msg_var}"
    for f in "${!files_var}"; do echo "    - $f"; done
  done
}

case "${1:-}" in
  1|2|3|4|5|6) do_commit "$1" ;;
  all)
    for s in 1 2 3 4 5 6; do do_commit "$s"; done
    ;;
  list) list_steps ;;
  *)
    echo "Usage: $0 {1|2|3|4|5|6|all|list}"
    exit 1
    ;;
esac
