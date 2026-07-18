# PROJECT_STRUCTURE.md

> 실제 코드(index.html, git 구조)를 분석해서 작성한 문서. 이 프로젝트는 별도의 빌드 시스템이나 프레임워크 없이, 단일 HTML 파일로 이루어진 정적 사이트다.

---

# 실제 폴더 구조

```
sudden-archive/                     (이 저장소, User 사이트 — github.com/K-Hena/sudden-archive)
├── index.html                      User 사이트 전체 (HTML+CSS+JS 단일 파일)
├── favicon.ico / favicon-16.png / favicon-32.png / favicon-192.png / apple-touch-icon-180.png
├── .gitignore
├── .claude/                        로컬 Claude Code 설정 (settings.local.json)
├── docs/                           AI 운영 문서 (이 문서들)
│   └── architecture/               세부 흐름 문서
└── sudden-archive-admin/           레거시 Admin 사이트 — 별도 git 저장소, .gitignore로 이 repo 추적에서 제외됨
    └── index.html                  Admin 사이트 전체 (HTML+CSS+JS 단일 파일)
```

`sudden-archive-admin/`은 `github.com/K-Hena/sudden-archive-admin`이라는 **완전히 별개의 git 저장소**이며, 이 저장소(`sudden-archive`) 안에는 로컬 참고용으로만 존재한다 (`.gitignore`에 `sudden-archive-admin/` 등록됨). 편집모드 이식 작업 시 로직을 참고하는 용도로 쓰인다.

빌드 도구, package.json, 프레임워크가 전혀 없다. Vercel이 두 저장소를 각각 정적 사이트로 배포한다.

CDN으로 불러오는 외부 라이브러리: `@supabase/supabase-js@2`, `cropperjs@1.6.1`(이미지 크롭, 레거시 Admin과 동일 버전), YouTube IFrame API(`https://www.youtube.com/iframe_api`, 클립 구간 재생/마킹용).

---

# 주요 파일 역할 (index.html, User 사이트)

단일 파일 안에서 `<style>`, `<body>`, `<script>` 세 영역으로 구성된다.

## CSS (`<style>`)
- `:root`에 색상 변수 정의: `--bg/--panel/--line/--text/--muted` (베이스), `--red/--blue` (팀 컬러), `--amber` (기존 강조색, 편집모드에는 미사용), `--edit-accent/--edit-accent-ink` (편집모드 전용 강조색), `--green` (성공 메시지)
- 컴포넌트별 스타일: 헤더/브랜드, 맵 그리드(`map-tile`), 카드 그리드(`card`, `card-del`), 재생 오버레이(`overlay`), 편집모드 UI(`tile-actions`, `add-tile`, `editmode-btn`, `admin-badge`), 항목 추가 모달(`modal`, `type-toggle`, `cropper-wrap`, `clip-tools`, `clip-sliders`, `clip-btns`, `clip-range`)

## HTML (`<body>`)
- `header`: 로고, CLIPS/TIPS 카운트, `#authArea`(로그인 상태에 따라 JS가 채움)
- `.subbar`: 전체 맵 / 현재 맵 이름 breadcrumb
- `#viewGrid`: 맵 선택 화면 (`#mapGrid`)
- `#viewDetail`: 맵 상세 화면 — RED/BLUE 팀 토글 + `#cardGrid`
- `#overlay`: 영상/이미지 재생 오버레이
- `#addModal`: 편집모드 항목 추가 모달 — 영상/이미지 유형 토글(`#typeToggle`), 이미지는 Cropper.js로 크롭 후 업로드, 영상은 `#clipTools`(버튼 + 슬라이더)로 클립 구간 지정. "맵 지명" 태그는 유형 토글 없이 이미지 고정
- `#mapImgInput`: 맵 이미지 업로드용 숨김 `<input type=file>`

## JS (`<script>`)
- Supabase 클라이언트 초기화 (`sb`)
- 전역 상태: `maps`, `items`, `currentMap`, `currentMapName`, `currentTeam`, `editMode`, `modalTag`, `modalType`, `cropper`, `pendingMapId`, `clipStart`, `clipEnd`, `clipYtPlayer`(재생 오버레이용 `ytPlayer`와는 별도 — `docs/DECISIONS.md` 참고)
- 데이터 로드: `loadAll()` — `maps`/`items` 테이블을 조회해 전역 배열을 채우고 `renderMapGrid()` 호출
- 맵 그리드: `renderMapGrid()`, 편집모드 전용 `addMap()/renameMap()/deleteMap()/pickMapImage()`
- 상세 카드: `renderCards()`, 편집모드 전용 `openAddModal()/closeModal()/setModalType()/submitItem()/deleteItem()`, 이미지 크롭 `loadImageIntoCropper()`
- 클립 구간 지정: `loadClipPlayer()/markClipStart()/markClipEnd()/clearClip()/updateClipLabel()`(버튼), `onClipStartInput()/onClipEndInput()/onClipStartChange()/onClipEndChange()/syncClipSliders()`(슬라이더) — 둘 다 `clipStart`/`clipEnd`를 공유
- 재생: `openOverlay()/closeOverlay()` — 유튜브 IFrame API로 클립 구간 반복 재생 지원
- 인증: `initAuth()/renderAuthArea()` — Discord OAuth 로그인, `admins` 테이블 조회로 관리자 판별, `toggleEditMode()`

---

# 데이터 흐름

## 일반 사용자 (비로그인 / editMode=false)
```
initAuth() + loadAll() 동시 시작
  → loadAll(): maps/items 테이블 SELECT → renderMapGrid()
  → 맵 타일 클릭 → openMap() → renderCards() (팀 필터 + 태그별 그룹핑)
  → 카드 클릭 → openOverlay() (유튜브 임베드 또는 이미지 표시)
```

## 로그인 + 관리자 (editMode=true)

로그인 → 관리자 판별 → 편집모드 진입의 자세한 흐름은 `docs/architecture/auth-flow.md`를,
편집모드에서 실제로 어떤 CRUD가 이식/미이식 상태인지는 `docs/architecture/admin-flow.md`를 참고한다.
여기서는 데이터가 화면과 어떻게 얽혀 있는지만 짚는다: 편집모드 액션(맵 이미지 변경/이름 변경/삭제/추가, 항목 추가)은
전부 `renderMapGrid()`/`renderCards()`가 그리는 화면 안에서 발생하며, Supabase에 쓴 뒤 항상 `loadAll()`로
전체 목록을 다시 불러와 화면을 갱신하는 패턴을 공유한다 (부분 갱신 없음, `docs/architecture/database-flow.md` 참고).

---

# 수정 시 주의사항

- **단일 파일 + 전역 변수 구조**: `maps`, `items`, `currentMap`, `currentTeam`, `editMode` 등은 모두 스크립트 최상단의 전역 변수다. 여러 렌더 함수(`renderMapGrid`, `renderCards`)가 이 전역 상태를 직접 참조하므로, 상태를 바꾸는 코드를 추가할 때는 관련된 모든 렌더 함수를 다시 호출해줘야 화면이 갱신된다 (예: `toggleEditMode()`와 로그아웃 처리에서 `renderMapGrid()`/`renderCards()`를 함께 호출하는 이유).
- **인라인 onclick과 함수명 결합**: 카드/타일 HTML은 템플릿 리터럴로 `onclick="함수명(...)"` 문자열을 직접 만든다. 전역 함수명을 바꾸면 HTML 문자열 안의 문자열도 함께 바꿔야 한다 — 타입 체커나 링터가 잡아주지 않는다.
- **문자열 이스케이프**: 맵/항목 이름에 작은따옴표(`'`)가 들어가면 onclick 인라인 속성이 깨지므로, `renderMapGrid()`에서 `m.name.replace(/'/g,"\\'")`로 이스케이프한 `safe` 값을 사용한다. 이름을 쓰는 새 UI를 추가할 때 이 패턴을 재사용해야 한다.
- **Supabase 에러 패턴**: 비동기 Supabase 호출은 예외를 던지지 않고 `{ data, error }`를 반환한다. 새 코드도 이 패턴(`if(error){ alert(...); return; }`)을 따라야 한다 — CODING_RULES.md 참고.
- **재생 오버레이의 YouTube 플레이어 정리**: `openOverlay()`를 다시 열거나 닫을 때 기존 `ytPlayer`/`clipTimer`를 정리하지 않으면 중복 재생/누수가 생긴다. 관련 코드를 건드릴 때는 이 정리 로직을 유지해야 한다.
- **`sudden-archive-admin/`은 이 저장소의 일부가 아니다**: 편집모드 로직을 이식할 때 참고는 하되, 그 폴더 자체를 수정해도 이 저장소에는 반영되지 않는다 (별도 git 저장소, `.gitignore` 처리됨).
