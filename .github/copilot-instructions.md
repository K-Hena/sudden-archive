# GitHub Copilot 지침 — Sudden Archive

이 저장소에서 코드를 제안할 때 아래 규칙을 따른다. 자세한 내용은 `docs/` 문서를 참고한다 (특히 `docs/AI_CONTEXT.md`가 기준 문서).

## 프로젝트 성격
- `index.html` 하나로 이루어진 바닐라 JavaScript 정적 사이트다. 빌드 도구, 프레임워크, 번들러가 없다.
- 백엔드는 Supabase(Auth/DB/Storage)이며, 별도 서버 코드는 없다.
- User 사이트(이 저장소)와 레거시 Admin 사이트(`sudden-archive-admin`, 별도 저장소)가 공존하며, User 사이트에 편집모드를 이식해 Admin 사이트를 폐기하는 마이그레이션이 진행 중이다.

## 반드시 지킬 것
- 기존 코드 스타일과 구조를 유지한다. React/Vue/TypeScript로 바꾸지 않는다.
- 새 라이브러리는 사용자 승인 없이 추가하지 않는다.
- Supabase 호출은 `{ data, error }`를 반환한다 — 예외를 던지지 않으므로 `error` 필드로 확인한다. `try/catch`는 실제로 예외가 발생할 수 있는 코드(초기화 등)에만 쓴다.
- 맵/항목 이름처럼 사용자 입력값을 인라인 `onclick` 문자열에 넣을 때는 작은따옴표를 이스케이프한다 (`renderMapGrid()`의 `safe` 패턴 참고).
- 하나의 기능 = 하나의 커밋. 의미 없는 커밋을 만들지 않는다.
- DB(Supabase) 스키마/RLS 변경은 코드로 직접 실행하지 않는다 — SQL만 작성하고 사용자가 Supabase에서 직접 실행한다.
- `docs/AI_CONTEXT.md`는 프로젝트의 기준 문서다. 수정이 필요해 보여도 먼저 사용자에게 확인한다.

## 하지 말 것
- 추측으로 존재하지 않는 기능/파일/테이블을 가정하지 않는다.
- 불필요한 리팩터링, 대규모 구조 변경을 하지 않는다.
- 검색 기능이 있다고 가정하지 않는다 — 현재 코드에는 텍스트 검색이 없다 (`docs/architecture/search-flow.md` 참고).

## 참고 문서
- 구조: `docs/PROJECT_STRUCTURE.md`
- DB: `docs/DATABASE.md`
- 진행 상황/결정: `docs/AI_CONTEXT.md`, `docs/TODO.md`, `docs/DECISIONS.md`
- 세부 흐름: `docs/architecture/*.md`
