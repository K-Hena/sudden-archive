# Sudden Archive — AI 에이전트 온보딩

서든어택 기록을 보관·검색하는 웹 서비스. `index.html` + `styles.css` + `app.js`로 구성된 빌드 없는 정적 사이트다.

작업을 시작하기 전에 **반드시** `docs/AI_CONTEXT.md`(프로젝트 기준 문서, 문서 지도)와 `docs/DEVELOPMENT_GUIDE.md`(AI 행동 규칙, SQL 실행 규칙, 커밋 전 리뷰 규칙)를 먼저 읽는다.
코드 위치와 관련 문서는 `docs/LLM_WIKI.md`로 빠르게 찾는다.

이 프로젝트에서 Codex는 Mode A에서 Claude Code 구현 직후의 리뷰어, Mode B(Claude Code 사용량 소진 시)에서는 구현+리뷰를 겸한다 — 자세한 역할은 `docs/DEVELOPMENT_GUIDE.md`의 "AI 역할 & 워크플로우 모드" 참고.

## 절대 하지 말 것
- 사용자 승인 없는 새 라이브러리 추가, 프로젝트 구조 변경, 대규모 리팩터링
- 사용자 확인 없는 고위험 SQL 실행 (DELETE/DROP/ALTER TABLE/RLS 정책 변경)
- Codex 리뷰 없이 코드 커밋 (`docs/DEVELOPMENT_GUIDE.md`의 "커밋 전 필수 리뷰 규칙" 참고, 문서 전용 커밋은 예외)

읽기 전에는 작업하지 않는다. 확신이 없으면 추측하지 말고 질문한다.

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
