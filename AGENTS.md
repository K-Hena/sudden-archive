# Sudden Archive — AI 에이전트 온보딩

이 저장소에서 코드를 작업하기 전에 `docs/README_AI.md`를 먼저 읽고,
`docs/AI_CONTEXT.md`의 "문서 지도"를 따라 필요한 문서를 확인한다.

## 프로젝트 성격
- `index.html` 하나로 이루어진 바닐라 JavaScript 정적 사이트. 빌드 도구, 프레임워크, 번들러 없음.
- 백엔드는 Supabase(Auth/DB/Storage). 별도 서버 코드 없음.
- User 사이트(이 저장소)와 레거시 Admin 사이트(`sudden-archive-admin`, 별도 저장소)가 공존하며, 편집모드를 User 사이트로 이식해 Admin 사이트를 폐기하는 마이그레이션이 진행 중.

## 반드시 지킬 것
- 기존 코드 스타일/구조 유지. React/Vue/TypeScript 전환 금지.
- 새 라이브러리는 사용자 승인 없이 추가하지 않는다.
- Supabase 호출은 `{ data, error }`를 반환한다(예외 아님) — `error` 필드로 확인. 실제 예외 가능성 있는 코드(초기화 등)에만 try/catch.
- 사용자 입력값을 인라인 `onclick`에 넣을 때는 작은따옴표 이스케이프 (`renderMapGrid()`의 `safe` 패턴 참고).
- 하나의 기능 = 하나의 커밋.
- **Supabase DB 변경은 위험도에 따라 다르게 처리한다** — SELECT/INSERT/UPDATE는 Supabase MCP로 바로 실행 가능, DELETE/DROP/ALTER TABLE/RLS 정책 변경은 실행 전 사용자에게 명시하고 확인받은 후에만 실행한다 (자세한 내용은 docs/CLAUDE_CODE_RULES.md의 "SQL 실행 규칙" 참고).
- 코드 작업 완료 후 git add / commit / push까지 진행한다.
- 큰 기능은 단계별로 나눠서 진행하고, 각 단계 완료 확인 후 다음 단계로 넘어간다.

## 하지 말 것
- 추측으로 존재하지 않는 기능/파일/테이블을 가정하지 않는다.
- 불필요한 리팩터링, 대규모 구조 변경.
- 검색 범위를 넘겨짚지 않는다 — 첫 화면 전체 제목 검색(`renderGlobalTitleSearch()`)과 맵·팀 내 제목 검색(`renderCards()`)이 구현되어 있지만, 둘 다 `items.title`만 검색하고 설명·태그·맵 이름·영상 URL은 검색하지 않는다 (`docs/architecture/search-flow.md` 참고).

## 참고 문서
- 구조: `docs/PROJECT_STRUCTURE.md`
- DB: `docs/DATABASE.md`
- 진행 상황/결정: `docs/AI_CONTEXT.md`, `docs/TODO.md`, `docs/DECISIONS.md`
- 세부 흐름: `docs/architecture/*.md`
