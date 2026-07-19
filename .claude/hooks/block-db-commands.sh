#!/bin/bash
# PreToolUse hook: Bash 도구 호출 시 DB 직접 실행 명령을 차단한다.
INPUT=$(cat)
CMD=$(echo "$INPUT" | python3 -c "import json,sys; print(json.load(sys.stdin).get('tool_input',{}).get('command',''))" 2>/dev/null)

if echo "$CMD" | grep -Eq 'supabase (db push|db reset|migration)|psql[[:space:]]'; then
  echo "🔧 DB 직접 실행은 금지되어 있습니다. SQL은 작성만 하고, 사용자가 Supabase SQL Editor에서 직접 실행해야 합니다 (docs/PROMPTS.md '4. SQL 작성' 참고)." >&2
  exit 2
fi

exit 0
