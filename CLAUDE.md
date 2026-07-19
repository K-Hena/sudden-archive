# Sudden Archive — Claude Code 진입 문서

이 프로젝트에서 작업을 시작하기 전에 **반드시** `docs/README_AI.md`를 먼저 읽고,
거기 안내된 순서대로 `docs/` 하위 문서를 확인한다.

## 절대 원칙 (요약 — 상세는 docs/ 참고)
- 이 프로젝트는 index.html 단일 파일 정적 사이트다. React/Vue/TypeScript로 전환하지 않는다.
- Supabase DB 변경은 위험도에 따라 다르게 처리한다 — SELECT/INSERT/UPDATE는 Supabase MCP로 바로 실행 가능, DELETE/DROP/ALTER TABLE/RLS 정책 변경은 실행 전 사용자에게 명시하고 확인받은 후에만 실행한다 (자세한 내용은 docs/CLAUDE_CODE_RULES.md의 "SQL 실행 규칙" 참고).
- 코드 작업 완료 후에는 항상 git add / commit / push까지 진행한다 (push 안 하면 Vercel 배포 안 됨).
- 큰 기능은 한 번에 구현하지 않고 단계별로 나눠 진행하며, 각 단계 완료 확인 후 다음 단계로 넘어간다.
- 사용자 승인 없이 새 라이브러리 추가, 프로젝트 구조 변경, 대규모 리팩터링을 하지 않는다.
- 확신이 없으면 추측하지 말고 질문한다.
- Codex 리뷰는 `stop-review-gate`(플러그인 내장 기능)로 자동 동작한다. 코드를 수정한 턴이 끝날 때마다 Codex가 자동으로 git diff를 검토하고, 문제가 있으면 멈춘다. 사용자가 수동으로 리뷰 명령을 칠 필요는 없다.
- 게이트가 멈추면(문제 발견) 그 내용을 사용자에게 보고하고, 지시 없이 임의로 다시 구현을 강행하지 않는다.

세부 규칙: `docs/CODING_RULES.md`, `docs/CLAUDE_CODE_RULES.md`, `docs/PROMPTS.md`
문서 전체 지도: `docs/AI_CONTEXT.md`의 "문서 지도" 표
