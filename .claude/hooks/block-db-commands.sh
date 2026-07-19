#!/bin/bash
# PreToolUse hook: Bash 도구 호출 시 DB 직접 실행 명령을 차단한다.
INPUT=$(cat)

CMD=$(echo "$INPUT" | python3 -c "import json,sys; print(json.load(sys.stdin).get('tool_input',{}).get('command',''))" 2>/dev/null)
if [ $? -ne 0 ]; then
  CMD=$(echo "$INPUT" | python -c "import json,sys; print(json.load(sys.stdin).get('tool_input',{}).get('command',''))" 2>/dev/null)
  if [ $? -ne 0 ]; then
    echo "🔧 DB 명령 검사용 Python 실행에 실패해 안전하게 차단합니다 (python3/python 모두 사용 불가). Bash 명령을 확인해주세요." >&2
    exit 2
  fi
fi

if echo "$CMD" | grep -Eq 'supabase (db push|db reset|migration)|psql[[:space:]]'; then
  echo "🔧 Bash를 통한 DB 직접 실행(CLI/psql)은 금지되어 있습니다. 실행은 항상 Supabase MCP를 통해서만 하고, 고위험 SQL(DELETE/DROP/ALTER/RLS)은 사용자 확인 후에만 실행합니다 (docs/CLAUDE_CODE_RULES.md 'SQL 실행 규칙' 참고)." >&2
  exit 2
fi

exit 0
