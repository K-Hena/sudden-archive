# GitHub Copilot 지침 — Sudden Archive

이 저장소에서 코드를 제안할 때 아래 규칙을 따른다. 프로젝트 개요와 진행 상황은 `docs/AI_CONTEXT.md`(기준 문서), AI 워크플로우와 행동 규칙은 `docs/DEVELOPMENT_GUIDE.md`를 참고한다.

## 코드 제안 시 반드시 지킬 것
- `index.html`/`styles.css`/`app.js` 3개 정적 파일 구조를 유지한다. 빌드 도구, 프레임워크, 번들러, `import`/`export` 문법을 제안하지 않는다.
- `app.js`는 ES Module이 아닌 전역 스크립트다. `index.html`의 인라인 `onclick`이 전역 함수에 의존하므로 `type="module"`이나 모듈화를 제안하지 않는다.
- 기존 코드 스타일과 구조를 유지한다. React/Vue/TypeScript로 바꾸지 않는다.
- 새 라이브러리는 사용자 승인 없이 추가하지 않는다.
- Supabase 호출은 `{ data, error }`를 반환한다 — 예외를 던지지 않으므로 `error` 필드로 확인한다. `try/catch`는 실제로 예외가 발생할 수 있는 코드(초기화 등)에만 쓴다.
- 맵/항목 이름처럼 사용자 입력값을 인라인 `onclick` 문자열에 넣을 때는 작은따옴표를 이스케이프한다 (`renderMapGrid()`의 `safe` 패턴 참고).
- 하나의 기능 = 하나의 커밋. 의미 없는 커밋을 만들지 않는다.
- DB(Supabase) 스키마/RLS 변경은 위험도에 따라 다르게 처리한다 (`docs/DEVELOPMENT_GUIDE.md`의 "SQL 실행 규칙" 참고).
- 검색 범위를 넘겨짚지 않는다 — 전체 맵 검색과 맵·팀 내 검색은 `items.title`, `items.channel_name`, `items.note`, `items.contributor_name` 네 필드만 검색한다. 검색어가 순수 초성(`ㄱ~ㅎ`만으로 구성)일 때만 초성 매칭을 시도하고, 완성형·영문·숫자가 섞이면 기존 부분일치만 동작한다 (`docs/ARCHITECTURE.md`의 "탐색/검색 흐름" 참고).
- 추측으로 존재하지 않는 기능/파일/테이블을 가정하지 않는다.
- 불필요한 리팩터링, 대규모 구조 변경을 하지 않는다.

## 참고 문서
- 구조: `docs/ARCHITECTURE.md`
- DB: `docs/DATABASE.md`
- 진행 상황/결정: `docs/AI_CONTEXT.md`, `docs/TODO.md`, `docs/DECISIONS.md`
