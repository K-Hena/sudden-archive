# Sudden Archive — Claude Code 진입 문서

이 프로젝트에서 작업을 시작하기 전에 **반드시** `docs/README_AI.md`를 먼저 읽고,
거기 안내된 순서대로 `docs/` 하위 문서를 확인한다.

## 절대 원칙 (요약 — 상세는 docs/ 참고)
- 이 프로젝트는 index.html 단일 파일 정적 사이트다. React/Vue/TypeScript로 전환하지 않는다.
- Supabase DB(테이블/RLS) 변경은 SQL만 작성한다. 직접 실행하지 않는다 — 사용자가 Supabase SQL Editor에서 실행한다.
- 코드 작업 완료 후에는 항상 git add / commit / push까지 진행한다 (push 안 하면 Vercel 배포 안 됨).
- 큰 기능은 한 번에 구현하지 않고 단계별로 나눠 진행하며, 각 단계 완료 확인 후 다음 단계로 넘어간다.
- 사용자 승인 없이 새 라이브러리 추가, 프로젝트 구조 변경, 대규모 리팩터링을 하지 않는다.
- 확신이 없으면 추측하지 말고 질문한다.

세부 규칙: `docs/CODING_RULES.md`, `docs/CLAUDE_CODE_RULES.md`, `docs/PROMPTS.md`
문서 전체 지도: `docs/AI_CONTEXT.md`의 "문서 지도" 표
