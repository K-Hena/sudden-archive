# GitHub Copilot 지침 — Sudden Archive

이 저장소에서 코드를 제안할 때 아래 규칙을 따른다. 자세한 내용은 `docs/` 문서를 참고한다 (특히 `docs/AI_CONTEXT.md`가 기준 문서).

## 프로젝트 성격
- `index.html`(마크업), `styles.css`(전체 스타일), `app.js`(전체 동작)로 이루어진 바닐라 JavaScript 정적 사이트다. 빌드 도구, 프레임워크, 번들러가 없다.
- `app.js`는 ES Module이 아닌 기존 전역 스크립트다. `index.html`의 인라인 `onclick`이 전역 함수에 의존하므로 별도 설계 없이 모듈화하거나 실행 순서를 바꾸지 않는다. head 테마 선적용 스크립트는 화면 깜빡임 방지를 위해 HTML에 유지한다.
- 백엔드는 Supabase(Auth/DB/Storage)이며, 별도 서버 코드는 없다.
- User 사이트의 Master 대시보드가 운영 기능을 대체했고, 레거시 Admin 사이트(`sudden-archive-admin`, 별도 저장소)는 최종 정리만 남아 있다.

## 반드시 지킬 것
- 기존 코드 스타일과 구조를 유지한다. React/Vue/TypeScript로 바꾸지 않는다.
- 새 라이브러리는 사용자 승인 없이 추가하지 않는다.
- Supabase 호출은 `{ data, error }`를 반환한다 — 예외를 던지지 않으므로 `error` 필드로 확인한다. `try/catch`는 실제로 예외가 발생할 수 있는 코드(초기화 등)에만 쓴다.
- 맵/항목 이름처럼 사용자 입력값을 인라인 `onclick` 문자열에 넣을 때는 작은따옴표를 이스케이프한다 (`renderMapGrid()`의 `safe` 패턴 참고).
- 하나의 기능 = 하나의 커밋. 의미 없는 커밋을 만들지 않는다.
- DB(Supabase) 스키마/RLS 변경은 위험도에 따라 다르게 처리한다 — SELECT/INSERT/UPDATE는 Supabase MCP로 바로 실행 가능, DELETE/DROP/ALTER TABLE/RLS 정책 변경은 사용자에게 명시하고 확인받은 후에만 실행한다 (docs/DEVELOPMENT_GUIDE.md의 "SQL 실행 규칙" 참고).
- `docs/AI_CONTEXT.md`는 프로젝트의 기준 문서다. 수정이 필요해 보여도 먼저 사용자에게 확인한다.

## 하지 말 것
- 추측으로 존재하지 않는 기능/파일/테이블을 가정하지 않는다.
- 불필요한 리팩터링, 대규모 구조 변경을 하지 않는다.
- 검색 범위를 넘겨짚지 않는다 — 전체 맵 검색(`renderGlobalTitleSearch()`)과 맵·팀 내 검색(`renderCards()`)은 `items.title`과 `items.channel_name`만 검색하고 설명·태그·맵 이름·영상 URL은 검색하지 않는다 (`docs/ARCHITECTURE.md`의 "탐색/검색 흐름" 참고).

## 참고 문서
- 구조: `docs/ARCHITECTURE.md`
- DB: `docs/DATABASE.md`
- 진행 상황/결정: `docs/AI_CONTEXT.md`, `docs/TODO.md`, `docs/DECISIONS.md`
- 세부 흐름: `docs/architecture/*.md`
