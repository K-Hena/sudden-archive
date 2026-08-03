# LLM_WIKI.md

> Claude Code와 다른 LLM이 전체 파일을 무작정 읽지 않고, 작업에 필요한 코드와 기준 문서로 바로 이동하기 위한 저장소 위키 허브다.

## 시작 순서

1. 프로젝트 기준과 현재 상태는 `AI_CONTEXT.md`에서 확인한다.
2. 이 문서의 작업별 라우팅으로 관련 함수와 세부 문서를 찾는다. 구조·흐름 설명 자체는 `ARCHITECTURE.md`가 기준이다 (이 문서는 중복 서술하지 않는다).
3. 코드 관계와 변경 영향은 code-review-graph를 먼저 조회한다.
4. 그래프가 다루지 못하는 HTML/CSS/문서 내용만 `rg`와 파일 읽기로 확인한다.
5. 구현 전 `TODO.md`와 `DECISIONS.md`, 구현 후 `DEVELOPMENT_GUIDE.md`의 "문서 자동 동기화 규칙"을 확인한다.

## 작업별 코드 지도

| 작업 | 먼저 볼 함수/영역 | 함께 볼 문서 |
|---|---|---|
| 초기 데이터와 공개 범위 | `loadAll()`, `publicItems()`, `refreshPublicDataIfStale()` | `ARCHITECTURE.md`(데이터베이스 흐름), `DATABASE.md` |
| 홈 대시보드 | `renderHome()`, `renderMyItems()`, `openHomeAdd()`, `recentItemsKey()` | `ARCHITECTURE.md`(index.html 내부 구성), `TODO.md` |
| 전체 맵과 검색 | `renderMapGrid()`, `renderGlobalTitleSearch()`, `openMap()` | `ARCHITECTURE.md`(탐색/검색 흐름) |
| 상세 카드와 즐겨찾기 | `renderCards()`, `favoriteButton()`, `toggleFavorite()` | `ARCHITECTURE.md`(탐색/검색 흐름), `tests/favorites.test.js` |
| 인증과 관리자 판별 | `initAuth()`, `renderAuthArea()`, `discordLogin()` | `ARCHITECTURE.md`(인증 흐름), `DATABASE.md` |
| Master 대시보드 | `openMaster()`, `switchMasterTab()`, `loadMasterStats()`와 `renderMaster*` 함수 | `ARCHITECTURE.md`(관리자 흐름) |
| 승인 흐름 | `renderMasterApprovals()`, `reviewItem()`, `renderMyItems()`, `hideOwnItem()` | `ARCHITECTURE.md`(관리자 흐름), `DATABASE.md` |
| 재생 오버레이 | `openOverlay()`, `closeOverlay()`, `showFullVideo()`와 `overlay*` 함수 | `DECISIONS.md`, `TROUBLESHOOTING.md` |
| 이미지 확대·이동 | `initImageZoomPan()`과 `onImage*` 함수 | `DECISIONS.md` |
| 댓글 | `renderCommentsSection()`, `loadComments()`, `submitComment()`, `deleteComment()` | `DATABASE.md`, `ARCHITECTURE.md`(관리자 흐름) |
| 컨텐츠 추가·수정 | `openAddModal()`, `openEditModal()`, `submitItem()` | `DATABASE.md`, `DECISIONS.md` |
| 클립 구간 편집 | `loadClipPlayer()`, `syncClipSliders()`, `updateClipRangeFill()`과 `onClip*` 함수 | `TROUBLESHOOTING.md`, `tests/clip-preview.test.js` |
| 임시저장 | `loadContentDrafts()`, `buildDraftFromCurrentModal()`, `resumeContentDraft()` | `DECISIONS.md` |
| 테마·폰트·레이아웃 | `styles.css`, `renderThemeToggle()`, `toggleTheme()` | `ARCHITECTURE.md`(index.html 내부 구성), `DECISIONS.md` |

## 핵심 상태 라우팅 (변수 → 카테고리)

- 서버 데이터 캐시: `maps`, `items`, `favorites`, `masterComments`
- 화면 선택 상태: `currentMap`, `currentMapName`, `currentTeam`
- 인증 상태: `currentSession`, `isAdminUser`
- 오버레이 상태: `overlay*`, `ytPlayer`
- 추가 모달 상태: `modal*`, `clip*`, `cropper`, `resumingDraftId`

각 상태의 사용 원칙(공개 범위, 신뢰 경계, 에러 패턴 등)은 `ARCHITECTURE.md`를 기준으로 한다.

## 변경 시 같이 확인할 것 (구조 설명은 ARCHITECTURE.md 참고)

- 공개/승인 상태를 바꾸면 클라이언트 필터와 DB RLS 양쪽을 확인한다.
- 이미지 업로드 경로를 바꾸면 Storage 정책의 사용자 폴더 규칙을 확인한다.
- CSS는 전역이며 같은 명시도에서는 뒤에 선언된 규칙이 이긴다.
- DB 고위험 작업은 `DEVELOPMENT_GUIDE.md`의 "SQL 실행 규칙"을 따른다.
- 전역 함수명·전역 상태 변경 시 함께 확인할 것은 `ARCHITECTURE.md`의 "수정 시 주의사항"에 정리되어 있다.

## 최소 검증

```powershell
node --check app.js
node tests\channel-name.test.js
node tests\favorites.test.js
node tests\clip-preview.test.js
node tests\volume-persistence.test.js
git diff --check
```

화면이나 동작을 바꿨다면 실제 Chromium에서 데스크톱·모바일, 콘솔 오류, 관련 사용자 흐름을 추가로 확인한다. push 뒤에는 Vercel 프로덕션 응답과 변경 기능을 다시 확인한다.

## code-review-graph 사용

MCP 연결이 정상이면 `get_minimal_context_tool`로 시작한 뒤 목적에 맞게 `semantic_search_nodes_tool`, `query_graph_tool`, `get_impact_radius_tool`, `detect_changes_tool`을 사용한다.

MCP가 `Transport closed`이면 저장소 루트에서 CLI로 대체한다.

```powershell
code-review-graph update
code-review-graph status
code-review-graph search "함수 또는 기능"
code-review-graph impact --help
code-review-graph detect-changes --base HEAD
code-review-graph wiki --force
```

자동 생성 위키는 `.code-review-graph/wiki/`에 저장되며 캐시 성격이라 git에는 포함하지 않는다. 현재 `app.js`가 하나의 전역 파일이어서 커뮤니티 자동 분류는 테스트 코드 중심으로만 생성된다. 따라서 자동 위키를 프로젝트 전체 구조의 기준으로 간주하지 말고, `ARCHITECTURE.md`와 `AI_CONTEXT.md`를 기준으로 사용한다.

## 문서 우선순위

충돌할 때는 다음 순서로 판단한다.

1. 실제 코드와 현재 DB 스키마/RLS
2. `AI_CONTEXT.md`, `DATABASE.md`, `TODO.md`
3. `ARCHITECTURE.md`와 이 문서
4. `DECISIONS.md`, `CHANGELOG.md`, `TROUBLESHOOTING.md`의 과거 기록
5. `.code-review-graph/wiki/` 자동 산출물
