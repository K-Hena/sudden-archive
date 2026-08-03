# Sudden Archive — AI 에이전트 온보딩

이 저장소에서 코드를 작업하기 전에 `docs/README_AI.md`를 먼저 읽고,
`docs/AI_CONTEXT.md`의 "문서 지도"를 따라 필요한 문서를 확인한다.
코드 위치와 관련 문서를 빠르게 찾을 때는 `docs/LLM_WIKI.md`를 위키 허브로 사용한다. 자동 생성된 `.code-review-graph/wiki/`는 보조 자료로만 사용한다.

## 프로젝트 성격
- `index.html`(마크업), `styles.css`(전체 스타일), `app.js`(전체 동작)로 이루어진 바닐라 JavaScript 정적 사이트. 빌드 도구, 프레임워크, 번들러 없음.
- `app.js`는 ES Module이 아닌 기존 전역 스크립트다. `index.html`의 인라인 `onclick`과 전역 상태가 이 구조에 의존하므로 별도 설계 없이 모듈화하거나 실행 순서를 바꾸지 않는다. `<head>`의 짧은 테마 선적용 스크립트는 화면 깜빡임 방지를 위해 의도적으로 HTML에 남겨뒀다.
- 백엔드는 Supabase(Auth/DB/Storage). 별도 서버 코드 없음.
- User 사이트(이 저장소)의 Master 대시보드가 운영 기능을 대체했고, 레거시 Admin 사이트(`sudden-archive-admin`, 별도 저장소)는 최종 정리만 남아 있다.

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
- 검색 범위를 넘겨짚지 않는다 — 전체 맵 검색(`renderGlobalTitleSearch()`)과 맵·팀 내 검색(`renderCards()`)은 `items.title`과 `items.channel_name`만 검색하고 설명·태그·맵 이름·영상 URL은 검색하지 않는다 (`docs/architecture/search-flow.md` 참고).

## 참고 문서
- 구조: `docs/PROJECT_STRUCTURE.md`
- DB: `docs/DATABASE.md`
- 진행 상황/결정: `docs/AI_CONTEXT.md`, `docs/TODO.md`, `docs/DECISIONS.md`
- 세부 흐름: `docs/architecture/*.md`

## Notion 개발 기록 자동 갱신
- 기능 구현, 버그 수정, DB/RLS 변경, 배포처럼 개발 이력으로 남길 실질적인 작업이 완료되면 사용자가 따로 요청하지 않아도 Notion `개발 공부 → 개발 기록 → 서든 아카이브 (Sudden Archive)` 페이지를 갱신한다.
- 대상 페이지 ID: `3aae0df0-3fa7-819b-87ea-d620a4d7901d`
- 기존 페이지를 먼저 읽고, 중복 없이 작업 배경·핵심 결정·발견한 문제·검증 결과·커밋/배포·남은 TODO를 간결하게 추가한다. 기존 기록 중 이번 작업으로 상태가 바뀐 항목도 함께 바로잡는다.
- 단순 조회, 설계 대화만 진행한 경우, 작업이 실패하거나 미완료인 경우에는 자동 기록하지 않는다.
- 비밀값, 인증 토큰, 개인 데이터, 테스트용 원문 데이터는 기록하지 않는다.

<!-- code-review-graph MCP tools -->
## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes_tool` or `query_graph_tool` instead of Grep
- **Understanding impact**: `get_impact_radius_tool` instead of manually tracing imports
- **Code review**: `detect_changes_tool` + `get_review_context_tool` instead of reading entire files
- **Finding relationships**: `query_graph_tool` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview_tool` + `list_communities_tool`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool | Use when |
| ------ | ---------- |
| `detect_changes_tool` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context_tool` | Need source snippets for review — token-efficient |
| `get_impact_radius_tool` | Understanding blast radius of a change |
| `get_affected_flows_tool` | Finding which execution paths are impacted |
| `query_graph_tool` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes_tool` | Finding functions/classes by name or keyword |
| `get_architecture_overview_tool` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes_tool` for code review.
3. Use `get_affected_flows_tool` to understand impact.
4. Use `query_graph_tool` pattern="tests_for" to check coverage.
