#!/bin/bash
# PreToolUse hook: Bash 도구 호출 시 DB 직접 실행 명령을 차단한다.
INPUT=$(cat)
CMD=$(echo "$INPUT" | python3 -c "import json,sys; print(json.load(sys.stdin).get('tool_input',{}).get('command',''))" 2>/dev/null)

if echo "$CMD" | grep -Eq 'supabase (db push|db reset|migration)|psql[[:space:]]'; then
  echo "🔧 Bash를 통한 DB 직접 실행(CLI/psql)은 금지되어 있습니다. 실행은 항상 Supabase MCP를 통해서만 하고, 고위험 SQL(DELETE/DROP/ALTER/RLS)은 사용자 확인 후에만 실행합니다 (docs/CLAUDE_CODE_RULES.md 'SQL 실행 규칙' 참고)." >&2
  exit 2
fi

exit 0
