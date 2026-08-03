# Sudden Archive — Claude Code 진입 문서

이 프로젝트에서 작업을 시작하기 전에 **반드시** `docs/README_AI.md`를 먼저 읽고,
거기 안내된 순서대로 `docs/` 하위 문서를 확인한다.

코드 위치와 관련 문서를 빠르게 찾을 때는 `docs/LLM_WIKI.md`를 위키 허브로 사용한다. 자동 생성된 `.code-review-graph/wiki/`는 보조 자료이며 프로젝트 전체 구조의 기준 문서가 아니다.

## 절대 원칙 (요약 — 상세는 docs/ 참고)
- 이 프로젝트는 `index.html` + `styles.css` + `app.js`로 구성된 빌드 없는 정적 사이트다. React/Vue/TypeScript로 전환하지 않는다.
- `app.js`는 기존 전역 스크립트 구조와 함수 순서를 그대로 유지한다. `type="module"` 전환, 전역 상태 재설계, 인라인 `onclick` 제거는 별도 설계 없이 진행하지 않는다. `<head>`의 테마 선적용 스크립트는 화면 깜빡임 방지를 위해 `index.html`에 유지한다.
- Supabase DB 변경은 위험도에 따라 다르게 처리한다 — SELECT/INSERT/UPDATE는 Supabase MCP로 바로 실행 가능, DELETE/DROP/ALTER TABLE/RLS 정책 변경은 실행 전 사용자에게 명시하고 확인받은 후에만 실행한다 (자세한 내용은 docs/CLAUDE_CODE_RULES.md의 "SQL 실행 규칙" 참고).
- 코드 작업 완료 후에는 항상 git add / commit / push까지 진행한다 (push 안 하면 Vercel 배포 안 됨).
- 큰 기능은 한 번에 구현하지 않고 단계별로 나눠 진행하며, 각 단계 완료 확인 후 다음 단계로 넘어간다.
- 사용자 승인 없이 새 라이브러리 추가, 프로젝트 구조 변경, 대규모 리팩터링을 하지 않는다.
- 확신이 없으면 추측하지 말고 질문한다.
- Codex 리뷰는 `stop-review-gate`(플러그인 내장 기능, `/codex:setup --enable-review-gate`로 1회 설정하면 이후 자동 동작하도록 설계됨 — 설정 자체는 정상 확인됨)로 코드를 수정한 턴이 끝날 때마다 git diff를 자동 검토하도록 되어 있다. 단, VS Code 확장/사이드바 세션에서는 자동 발동이 관찰되지 않는 경우가 있었다(터미널 통합 세션에서는 정상 동작할 가능성이 있으나 아직 확정 검증되지 않음). 코드 수정 후 자동 리뷰가 뜨지 않으면 `docs/CLAUDE_CODE_RULES.md`의 "커밋 전 필수 리뷰 규칙"에 따라 `codex:rescue`로 수동 요청해야 한다.
- 게이트가 멈추거나(자동 발동 시) 수동 리뷰에서 문제가 발견되면 그 내용을 사용자에게 보고하고, 지시 없이 임의로 다시 구현을 강행하지 않는다.

세부 규칙: `docs/CODING_RULES.md`, `docs/CLAUDE_CODE_RULES.md`, `docs/PROMPTS.md`
문서 전체 지도: `docs/AI_CONTEXT.md`의 "문서 지도" 표

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
