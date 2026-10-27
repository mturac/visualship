#!/bin/sh
# Asserts each fixture produces the expected verdict + exit code.
set -u
cd "$(dirname "$0")/.."
fail=0
expect() { # dir code verdict
  out=$(node bin/visualship.js check "$1"); code=$?
  last=$(printf '%s\n' "$out" | tail -n 1)
  printf '%s\n' "$out"
  if [ "$code" -ne "$2" ] || [ "$last" != "$(printf 'VERDICT\t%s' "$3")" ]; then
    echo "SMOKE FAIL: $1 expected exit $2 / $3, got exit $code / $last"; fail=1
  else echo "SMOKE OK: $1 -> exit $code $3"; fi
}
expect fixtures/pass 0 PASS
expect fixtures/warn 0 WARN
expect fixtures/fail 1 FAIL
expect fixtures/badges-only 1 FAIL
expect fixtures/broken 1 FAIL
expect fixtures/no-readme 1 FAIL
expect . 0 PASS
exit $fail
