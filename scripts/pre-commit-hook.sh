#!/usr/bin/env bash
# Pre-commit hook: fast security checks before every commit
# Full audit runs via scripts/audit.sh; this is the quick version

set -uo pipefail
cd "$(git rev-parse --show-toplevel)"

FAIL=0

# 1. Exposed API keys in staged files
STAGED=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|json)$' | grep -v node_modules || true)
if [ -n "$STAGED" ]; then
  KEY_HITS=$(echo "$STAGED" | xargs grep -ln 'sk-ant-\|sk_live\|sk_test\|service_role_key\|-----BEGIN PRIVATE KEY' 2>/dev/null || true)
  if [ -n "$KEY_HITS" ]; then
    echo "BLOCKED: Potential secret keys in staged files:"
    echo "$KEY_HITS"
    FAIL=1
  fi
fi

# 2. Stripe columns referenced in frontend (not types)
if [ -n "$STAGED" ]; then
  STRIPE_HITS=$(echo "$STAGED" | grep '^src/' | xargs grep -ln 'stripe_account_id\|stripe_price_id\|stripe_product_id' 2>/dev/null | grep -v 'types\.ts' || true)
  if [ -n "$STRIPE_HITS" ]; then
    echo "BLOCKED: Frontend code references Stripe columns:"
    echo "$STRIPE_HITS"
    FAIL=1
  fi
fi

# 3. SELECT * on courses table
if [ -n "$STAGED" ]; then
  STAR_HITS=$(echo "$STAGED" | grep '^src/' | xargs grep -ln '\.select("\*")' 2>/dev/null | xargs grep -li 'course' 2>/dev/null || true)
  if [ -n "$STAR_HITS" ]; then
    echo "BLOCKED: SELECT * on courses may expose Stripe data:"
    echo "$STAR_HITS"
    FAIL=1
  fi
fi

# 4. Old guided mode references (prevent resurrection)
if [ -n "$STAGED" ]; then
  GUIDED_HITS=$(echo "$STAGED" | grep '^src/' | xargs grep -ln 'GuidedModeFields\|EMPTY_GUIDED\|buildPromptFromGuided' 2>/dev/null || true)
  if [ -n "$GUIDED_HITS" ]; then
    echo "BLOCKED: Old GuidedModeFields system detected — use GuidedPromptBuilder:"
    echo "$GUIDED_HITS"
    FAIL=1
  fi
fi

if [ "$FAIL" -ne 0 ]; then
  echo ""
  echo "Pre-commit checks failed. Fix the issues above before committing."
  exit 1
fi
