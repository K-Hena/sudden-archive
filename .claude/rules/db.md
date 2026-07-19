# DB Rules

Supabase(DB) 관련 파일이나 SQL을 다룰 때 지키는 규칙.

## 규칙 (2026-07-20 변경 — 위험도 기준 세분화, `docs/CLAUDE_CODE_RULES.md`의 "SQL 실행 규칙" 참고)
- SELECT/INSERT/UPDATE는 Supabase MCP 플러그인으로 바로 실행할 수 있다.
- 테이블 생성/삭제, 컬럼 변경(ALTER TABLE), DELETE/DROP/TRUNCATE, RLS 정책 생성/변경/삭제는 SQL을 작성한 뒤 무엇을 실행하는지·되돌릴 수 없다는 점을 명시하고 사용자 확인을 받은 후에만 실행한다.
- supabase CLI(`db push`/`db reset`/`migration`)나 `psql` 같은 Bash 기반 직접 실행은 여전히 금지한다 (`.claude/hooks/block-db-commands.sh`로 강제 차단됨) — 실행은 항상 Supabase MCP를 통해서만 한다.
- SQL 블록에 제목을 붙일 때는 Supabase SQL Editor 기존 쿼리 목록과 같은 네이밍(소문자, 하이픈 연결, 설명형)을 따른다. 예: `admin-rls-and-storage`
- DB 구조 변경이 필요하다고 판단되면 먼저 사용자에게 확인한다.
