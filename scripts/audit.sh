#!/usr/bin/env bash
# Excellion Codebase Audit Script
# Runs TypeScript checks, secret scanning, and code quality checks

set -uo pipefail
cd "$(dirname "$0")/.."

ISSUES=0
REPORT=""

section() { REPORT+="\n## $1\n"; }
pass() { REPORT+="  PASS: $1\n"; }
fail() { REPORT+="  FAIL: $1\n"; ISSUES=$((ISSUES + 1)); }
warn() { REPORT+="  WARN: $1\n"; }

# ── 1. TypeScript Type Check ──────────────────────────────────
section "TypeScript"
TSC_OUTPUT=$(npx tsc --noEmit 2>&1) || true
TSC_ERRORS=$(echo "$TSC_OUTPUT" | grep "error TS" | wc -l | tr -d ' ')
if [ "$TSC_ERRORS" -eq 0 ]; then
  pass "No type errors"
else
  fail "$TSC_ERRORS type error(s) found"
  REPORT+="$(echo "$TSC_OUTPUT" | grep "error TS" | head -10)\n"
fi

# ── 2. Secret Scanning ───────────────────────────────────────
section "Secrets"
SECRET_PATTERNS="sk-ant-|sk_live|service_role|SUPABASE_SERVICE_ROLE|-----BEGIN PRIVATE KEY"
SECRET_HITS=$(grep -rn "$SECRET_PATTERNS" src/ --include="*.ts" --include="*.tsx" --include="*.js" 2>/dev/null | grep -v node_modules || true)
if [ -z "$SECRET_HITS" ]; then
  pass "No exposed secrets in src/"
else
  fail "Potential secrets found in frontend code!"
  REPORT+="$SECRET_HITS\n"
fi

# ── 3. Edge Function CORS Check ──────────────────────────────
section "Edge Functions"
for fn_dir in supabase/functions/*/; do
  fn_name=$(basename "$fn_dir")
  fn_file="$fn_dir/index.ts"
  [ -f "$fn_file" ] || continue

  if grep -q "corsHeaders\|getCorsHeaders\|Access-Control-Allow-Origin" "$fn_file"; then
    pass "$fn_name has CORS headers"
  else
    fail "$fn_name missing CORS headers"
  fi

  if grep -q "catch" "$fn_file"; then
    pass "$fn_name has error handling"
  else
    warn "$fn_name may lack error handling"
  fi
done

# ── 4. Unused Exports (quick heuristic) ─────────────────────
section "Dead Code (heuristic)"
UNUSED_COUNT=0
for file in src/services/*.ts src/lib/*.ts; do
  [ -f "$file" ] || continue
  while IFS= read -r export_name; do
    [ -z "$export_name" ] && continue
    USAGE=$(grep -rn "$export_name" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "$(basename "$file")" | head -1)
    if [ -z "$USAGE" ]; then
      warn "Possibly unused export '$export_name' in $file"
      UNUSED_COUNT=$((UNUSED_COUNT + 1))
    fi
  done < <(grep -oP 'export (function|const|class|type|interface) \K\w+' "$file" 2>/dev/null || true)
done
if [ "$UNUSED_COUNT" -eq 0 ]; then
  pass "No obviously unused exports found"
fi

# ── 5. Stripe Data Exposure Check ───────────────────────────
section "Stripe Security"
# Check that no frontend code selects stripe columns from courses table
# (profiles table stripe columns are the user's own data — OK)
# Exclude: types.ts (schema), profiles queries (user's own data), BillingSettings (reads own profile)
STRIPE_SELECTS=$(grep -rn "stripe_account_id\|stripe_price_id\|stripe_product_id" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v 'types\.ts\|\.d\.ts\|node_modules\|profiles\|BillingSettings' || true)
if [ -z "$STRIPE_SELECTS" ]; then
  pass "No frontend code references Stripe columns"
else
  fail "Frontend code references Stripe columns!"
  REPORT+="$STRIPE_SELECTS\n"
fi

# Check that no .select("*") is used on courses table (course_versions is OK)
STAR_SELECTS=$(grep -rn '\.select("\*")' src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -i 'from("courses")' || true)
if [ -z "$STAR_SELECTS" ]; then
  pass "No SELECT * on courses table"
else
  fail "SELECT * found on courses — may expose Stripe columns"
  REPORT+="$STAR_SELECTS\n"
fi

# ── 6. Build Check ───────────────────────────────────────────
section "Build"
if command -v node >/dev/null 2>&1 && node -e "require('vite')" 2>/dev/null; then
  BUILD_OUTPUT=$(npx vite build 2>&1) || true
  if echo "$BUILD_OUTPUT" | grep -q "built in"; then
    pass "Vite build succeeds"
  else
    fail "Vite build failed"
    REPORT+="$(echo "$BUILD_OUTPUT" | tail -5)\n"
  fi
else
  warn "Vite not resolvable in this environment — skipping build check"
fi

# ── Summary ──────────────────────────────────────────────────
echo ""
echo "=========================================="
echo "  EXCELLION CODEBASE AUDIT"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="
echo -e "$REPORT"
echo "------------------------------------------"
if [ "$ISSUES" -eq 0 ]; then
  echo "  ALL CHECKS PASSED"
else
  echo "  $ISSUES ISSUE(S) FOUND"
fi
echo "=========================================="
exit $ISSUES
