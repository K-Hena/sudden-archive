# AI_CONTEXT.md

> Project: Sudden Archive
> Version: 1.2
> Last Updated: 2026-07-18 (문서 체계 리팩터링 — 세부 내용을 docs/ 하위 문서로 이동, 참조 링크로 연결)

---

# 프로젝트 소개

Sudden Archive는 서든어택 관련 데이터를 보관하고 검색할 수 있는 웹 서비스이다.

서비스는 사용자 사이트(User)와 관리자 사이트(Admin)로 구성되어 있으며,
관리자는 데이터를 등록 및 수정하고,
사용자는 최신 데이터를 조회하는 구조이다.

**(진행 중) User 사이트와 Admin 사이트를 하나로 통합하는 작업이 진행 중이다.**
자세한 내용은 "진행 중인 기능 개발 — 디스코드 로그인 & 편집모드 통합" 섹션 참고.

---

# 서비스 구성

## User

목적

일반 사용자가 기록을 검색하고 조회하는 서비스

배포

https://sudden-archive.vercel.app/

주요 기능

- 기록 조회
- 첫 화면 전체 제목 검색 + 현재 맵·팀 내 제목 부분 일치 검색
- 상세 정보 확인
- 공개 데이터 이용
- (진행 중) 디스코드 로그인
- Discord 로그인 기반 위폭·팁 즐겨찾기
- (예정) 관리자 로그인 시 편집모드 전환

---

## Admin

목적

관리자가 서비스를 운영하는 관리 시스템

배포

https://sudden-archive-admin.vercel.app/

주요 기능

- 데이터 등록
- 데이터 수정
- 데이터 삭제
- 서비스 운영

**※ User 사이트에 편집모드가 통합되면 이 사이트는 정리(폐기)될 예정.**

---

# 시스템 구조

Admin (또는 통합 후 User 사이트의 편집모드)

↓

Supabase

↓

User

관리자에서 등록하거나 수정한 데이터는 Supabase를 통해 사용자 사이트에 즉시 반영된다.

실제 폴더/파일 구조는 `docs/PROJECT_STRUCTURE.md`, DB 스키마는 `docs/DATABASE.md`,
쓰기 후 반영되는 방식(전체 재조회, Realtime 미사용 등)은 `docs/architecture/database-flow.md` 참고.

---

# 현재 기술 스택

Frontend

- HTML
- JavaScript
- CSS

Backend

- Supabase (Auth, DB, Storage)

Infrastructure

- GitHub
- Vercel

파일별 상세 구성(CSS/HTML/JS 영역)은 `docs/PROJECT_STRUCTURE.md` 참고.

---

# 진행 중인 기능 개발 — 디스코드 로그인 & 편집모드 통합

## 배경 / 목표
1. User 사이트에 디스코드 로그인 도입 (조회는 비로그인도 가능, 로그인은 즐겨찾기 등 개인화 기능에만 필요)
2. 관리자(대표) 로그인도 디스코드 계정으로 통합 — 별도 Admin 사이트 로그인 없이, User 사이트에서 로그인한 계정이 관리자로 확인되면 같은 화면에서 "편집모드"로 전환
3. 최종적으로 User/Admin 사이트를 하나로 합치고, 구 Admin 사이트는 정리

## 확정된 설계 결정
- **관리자 통합 방식**: 옵션 B 채택 — 사이트 하나로 통합, 같은 화면에서 편집모드 토글
- **로그인 방식**: Supabase Auth의 Discord Provider 사용
- **관리자 판별**: `admins` 테이블에 등록된 `user_id`만 편집 가능 (RLS로 강제)
- **로그인 버튼 스타일**: B안 채택 — 사이트 톤 매칭, 레드 아웃라인 (`--red` 컬러, Rajdhani 폰트, 기존 팀 토글 버튼과 통일감)
- **즐겨찾기**: 위폭/팁 항목에만 별 아이콘 적용 (맵 지명 태그는 제외). 정렬은 즐겨찾기 항목이 맨 위, 즐겨찾기한 시각 최신순
- **클립보드 붙여넣기(관리자)**: 브라우저 확장프로그램 없이 `navigator.clipboard.read()`로 이미지/유튜브 URL을 자동 판별하고, 권한·지원 문제 시 페이지 내 Ctrl+V `paste` 이벤트로 폴백하는 붙여넣기 우선 흐름 구현 완료

편집모드 렌더링 방식, 이스케이프 패턴, 강조색(`--edit-accent`) 신설 등 구현 단위의 세부 결정과 그 이유는 `docs/DECISIONS.md` 참고.

## 완료된 작업
- [x] Discord Developer Portal에 앱 등록 완료
- [x] Supabase Discord Provider 연결 완료 (Client ID/Secret, Redirect URL, Site URL 설정 완료)
- [x] 디스코드 로그인 테스트 성공 (임시 테스트 코드로 확인, 이후 정식 코드로 교체 지시함)
- [x] `admins` 테이블 생성 + RLS 정책 교체 완료
  - `items`, `maps` 테이블의 INSERT/UPDATE/DELETE 정책을 "로그인 사용자 전체 허용"에서 "admins 테이블에 등록된 사용자만 허용"으로 교체함
  - SELECT(조회)는 기존대로 "누구나 가능" 유지
  - 대표 계정 user_id: `c9642556-c6d5-427d-9e46-92ecfe507f2e` (admins 테이블에 등록됨)
- [x] 파비콘 / 앱 아이콘 디자인 확정 및 적용
  - 디자인: 조준경 모티프 (원형 링 + 위/왼쪽 삐침 + 중앙 레드 포인트), 검정 아웃라인 + 흰색 내부, 완전 투명 배경
  - 최종 확정 스펙: 삐침이 원 안쪽으로 길게 들어감, 중앙 레드 점에 두꺼운 검정 테두리
  - `favicon.ico`, `favicon-192.png`, `favicon-32.png`, `favicon-16.png`, `apple-touch-icon-180.png` 적용 완료
  - Discord 앱 아이콘(512px)은 초기 버전 업로드됨 — **최종 확정 디자인(긴 삐침 + 두꺼운 테두리)으로는 아직 재업로드 안 함, 필요시 재생성 요청 필요**
- [x] 1차: 디스코드 로그인 버튼 정식 적용 지시서 전달 완료 (User 사이트, index.html)
  - 임시 테스트 코드 제거, 정식 로그인/로그아웃 UI로 교체하는 작업 지시함
  - **적용 및 배포 확인은 아직 안 됨 — 다음 대화에서 결과 확인 필요**
- [x] 관리자 클립보드 자동인식 붙여넣기 기능 설계 및 구현

이후 진행된 세부 작업 이력(커밋 단위)은 `docs/CHANGELOG.md` 참고.

## 남은 작업 (순서대로)
- [ ] 1차 결과 확인 (로그인/로그아웃 UI 정상 동작 여부)
- [ ] 2차: 로그인 계정이 `admins`에 있는지 판별하는 로직 + "편집모드" 토글 버튼 뼈대 추가 (아직 실제 CRUD 기능 없이 버튼만)
- [ ] 3차: Admin 사이트의 CRUD 기능(맵/항목 추가·수정·삭제, 이미지 크롭, 영상 클립 구간)을 편집모드 안으로 이식
- [x] 즐겨찾기 기능: `favorites` 테이블·본인 행 전용 RLS, 위폭·팁 별 버튼, 최신 즐겨찾기 우선 정렬 적용
- [ ] 정상 동작 확인 후 구 Admin 사이트(`sudden-archive-admin.vercel.app`) 정리

**참고**: 이 체크리스트는 2026-07-18 오전 기준이며, 이후 편집모드 관련 작업이 여러 건 더 진행되어
실제로는 2차가 완료되었고 3차 중 맵 CRUD와 항목 추가(영상만)까지 이식된 상태다.
완료/진행중/예정이 더 세분화된 최신 상태는 `docs/TODO.md`를 참고 — 이 문서보다 최신이다.
편집모드 이식 완료/미완료 항목과 레거시 Admin과의 기능 격차는 `docs/architecture/admin-flow.md` 참고.

## 참고 — 반복 작업 시 원칙
DB 작업을 Claude Chat과 먼저 설계한 뒤, 위험도에 따라 Supabase MCP로 바로 실행하거나 고위험 SQL은 사용자 확인 후 실행하는 원칙, 코드 작업 지시서 작성 방식,
git push까지 포함해야 Vercel 배포에 반영된다는 점은 `docs/README_AI.md`, `docs/PROMPTS.md`(6. Git 작업),
`docs/CLAUDE_CODE_RULES.md`, `docs/MAINTENANCE.md`에 운영 규칙으로 정리되어 있다.

## 진영 뷰 확장 & 항목 편집 기능 (기획 단계)

Claude(Chat)와 사용자가 분류한 향후 작업(그룹 A~E, `docs/TODO.md`의 "예정"/"아이디어" 섹션 참고)의
세부 설계는 아직 확정되지 않았다. 각 그룹의 구현 방식은 착수 시점에 Claude(Chat)와 별도로 설계한다.
아래는 아직 결정되지 않은 질문을 그대로 남긴 것이며, 답이 정해진 것처럼 서술하지 않는다.

- 진영 없음 항목이 Total/Favorite 뷰에서만 보이고 Red/Blue 필터에서는 안 보이는 게 맞는지 — 미정
- 진영 없음 명칭 (없음/공용/전체 중) — 미정
- 진영 스티커 디자인 방향 — 미정
- 붙여넣기 버튼 UI 참고 시안 — 미정
- 유튜브 채널명 수집 API 방식 — 미정
- 채널 검색을 기존 검색창에 통합할지 별도로 둘지 — 미정

---

# AI 협업 방식

이 프로젝트는 상황에 따라 Mode A(Claude Chat 설계 → Claude Code 구현 → Codex 자동 리뷰) 또는
Mode B(GPT 설계 → Codex 구현+리뷰, Claude Code 사용량 소진 시 대체)로 작업한다.
Mode 전환은 사용자가 명시적으로 지시한다. 각 역할의 자세한 담당 업무는 `docs/README_AI.md`의
"AI 역할 & 워크플로우 모드" 참고.

## Claude (Chat) — Technical Lead

설계, 분석, 코드 리뷰, 작업 지시서 작성, 디자인 시안 제시를 담당한다 (Mode A).
구현 전에 항상 Claude와 설계를 먼저 진행한다.

담당 업무의 전체 목록은 `docs/README_AI.md`의 "AI 역할 & 워크플로우 모드" 참고.

---

## Claude Code — Developer

실제 코드 구현, 여러 파일 수정, 리팩터링, Git 작업(커밋·푸시 포함)을 담당한다 (Mode A).
설계 변경은 Claude(Chat)와 협의 후 진행한다.

담당 업무와 행동 규칙은 `docs/CLAUDE_CODE_RULES.md` 참고.

---

## Codex — 리뷰어 (Mode A) / 구현+리뷰어 (Mode B)

Mode A에서는 Claude Code가 코드를 수정한 직후 `stop-review-gate`(플러그인 내장 기능, `/codex:setup --enable-review-gate`로 1회 설정 시 자동 동작하도록 설계됨)로 git diff를 자동 검토만 한다 — 설계 단계가 아니라 구현 직후, 턴이 끝나기 전에 동작한다. 단, VS Code 확장/사이드바 세션에서는 자동 발동이 관찰되지 않는 경우가 있어, 발동하지 않으면 `codex:rescue`로 수동 요청한다(터미널 세션에서의 자동 동작 여부는 아직 확정 검증되지 않음 — `docs/README_AI.md` 참고).
Mode B(Claude Code 사용량 소진 시)에서는 GPT의 설계를 바탕으로 구현까지 직접 담당하고, 구현 후 동일한 방식(자동 또는 수동)으로 리뷰가 붙는다.

자세한 내용은 `docs/README_AI.md` 참고.

---

# 개발 원칙

프로젝트의 안정성과 유지보수성을 최우선으로 한다.

새로운 기능은

설계 → 구현 → 리뷰 순서로 진행한다.

불필요한 리팩터링은 하지 않는다.

기존 프로젝트 구조를 최대한 유지한다.

필요한 파일만 수정한다.

큰 기능(로그인 통합 등)은 한 번에 다 구현하지 않고 단계별로 나눠서 진행하고, 각 단계마다 결과를 확인한 뒤 다음 단계로 넘어간다.

구체적인 코드 스타일, 커밋 규칙, 에러 처리 방식은 `docs/CODING_RULES.md` 참고.

---

# 개발 프로세스

기능 요청 → Claude와 설계 → (DB 변경 시) 위험도에 따라 Supabase MCP로 바로 실행하거나 사용자 확인 후 실행 → Claude Code 구현 → Claude 코드 리뷰 → 문서 갱신 확인 → 커밋+푸시 → Vercel 자동 배포 확인

시나리오별(새 기능 구현/버그 수정/코드 리뷰/SQL 작성/리팩터링/Git 작업/문서 업데이트) 세부 절차는 `docs/PROMPTS.md` 참고.

---

# 향후 개발 예정

예정 기능

- 관리자 기능 확장
- 검색 기능 고도화
- UI 개선
- 데이터 관리 기능 강화

※ 기능 추가 시 계속 업데이트. 완료/진행중/예정/아이디어로 세분화된 최신 목록은 `docs/TODO.md` 참고.

---

# AI 운영 원칙

AI는 프로젝트 전체 구조를 우선 이해한 후 작업하며, 불확실한 부분은 추측하지 않고 확인 후 구현한다.

기존 기능과 DB 구조를 임의로 변경하지 않고, 새로운 라이브러리는 반드시 검토 후 추가한다.

구체적인 AI 행동 규칙 목록은 `docs/CODING_RULES.md`의 "AI 규칙" 참고.

---

# 문서 지도 (Document Map)

이 문서(AI_CONTEXT.md)는 프로젝트의 기준 문서(Single Source of Truth)다.
아래는 더 자세한 내용을 찾을 수 있는 문서 목록이다.

| 알고 싶은 것 | 문서 |
|---|---|
| AI에게 작업을 어떻게 요청하는지, AI 역할(Claude Chat/Code) 상세 | `docs/README_AI.md` |
| 코드 스타일, 에러 처리, 파일 수정 원칙, AI 행동 규칙 | `docs/CODING_RULES.md` |
| Claude Code의 행동 규칙, 담당 업무 | `docs/CLAUDE_CODE_RULES.md` |
| 기능 추가/버그 수정/SQL 작성/리팩터링 등 표준 작업 절차 | `docs/PROMPTS.md` |
| 어떤 작업을 하면 어떤 문서를 함께 확인해야 하는지 | `docs/MAINTENANCE.md` |
| 실제 폴더/파일 구조, index.html 내부 CSS/HTML/JS 구성 | `docs/PROJECT_STRUCTURE.md` |
| Supabase 테이블/컬럼/RLS/Storage 버킷 구조 | `docs/DATABASE.md` |
| 커밋 단위 변경 이력 | `docs/CHANGELOG.md` |
| 완료/진행중/예정/아이디어 최신 목록 | `docs/TODO.md` |
| 확정된 설계 결정과 그 이유(세부) | `docs/DECISIONS.md` |
| 실제로 해결했던 문제와 원인/해결/예방 | `docs/TROUBLESHOOTING.md` |
| 로그인(Discord OAuth / 이메일·비밀번호) 흐름, 관리자 판별 세부 | `docs/architecture/auth-flow.md` |
| 첫 화면 전체 제목 검색과 맵→팀→태그·상세 제목 검색 흐름 | `docs/architecture/search-flow.md` |
| 편집모드 이식 완료/미완료, 레거시 Admin과의 기능 격차 | `docs/architecture/admin-flow.md` |
| 데이터 조회/쓰기/Storage 흐름, Realtime 미사용 등 | `docs/architecture/database-flow.md` |
| GitHub Copilot용 핵심 규칙 요약 | `.github/copilot-instructions.md` |

---

# 참고

이 문서는 프로젝트의 기준 문서이다.

프로젝트 변경 사항이 발생하면 항상 최신 상태로 유지한다.

**새 채팅 시작 시 이 문서를 먼저 공유하면, 지금까지의 설계 결정과 진행 상황을 빠르게 파악할 수 있다.**

다른 문서와 겹치는 세부 내용은 각 문서로 옮기고 참조 링크로 연결했다 (2026-07-18 리팩터링).
이 문서만 읽어도 프로젝트 전체를 이해할 수 있도록, 세부 내용이 아니라 각 주제의 핵심 요약과 "어디를 보면 되는지"를 유지한다.
