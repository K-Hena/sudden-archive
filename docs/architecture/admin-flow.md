# admin-flow.md

> 관리자 기능이 현재 **두 곳에 나뉘어 존재**한다 — 레거시 Admin 사이트(전체 CRUD)와 User 사이트의 편집모드(일부만 이식됨). 둘 다 실제 코드를 근거로 정리했다.

---

# 레거시 Admin 사이트 (`sudden-archive-admin/index.html`, 폐기 예정)

이메일/비밀번호로 로그인한 뒤(`auth-flow.md` 참고) 전체 CRUD를 제공한다.

## 맵 관리
- `renderMapGrid()` — 모든 맵 타일에 항상 `tile-actions`(이미지 변경/이름 변경/삭제)와 "맵 추가" 타일을 노출 (로그인한 사람은 곧 관리자이므로 조건 분기가 없음)
- `pickMapImage()` → `mapImgInput` change → Storage `media` 버킷의 `maps/{id}-{timestamp}.{ext}`에 업로드 → `maps.img` 갱신
- `renameMap()` → `maps.name` 갱신
- `deleteMap()` → 해당 맵에 속한 항목 개수를 보여주는 confirm 후 `maps` 행 삭제 (연결된 `items`는 DB 쪽 FK 설정에 따라 함께 삭제될 수 있음 — 코드로는 확인 불가)
- `addMap()` → 이름 중복 체크 후 `sort_order = max+1`로 insert

## 항목 관리
- 태그 섹션마다 `add-tile` → `openAddModal(tag)`
- 모달에서 영상/이미지 유형 선택(`type-toggle`), "맵 지명" 태그면 제목/설명 입력을 숨김(`isMapLabel`)
- **영상**: 유튜브 링크 입력 → `loadClipPlayer()`로 실제 유튜브 플레이어를 모달 안에 띄우고, `markClipStart()`/`markClipEnd()`로 재생 중 현재 시각을 클립 시작/끝으로 기록 (`clip_start`/`clip_end`)
- **이미지**: 파일 선택 또는 Ctrl+V 붙여넣기(`pasteImage`, `document.addEventListener('paste', ...)`) → Cropper.js로 자르기 → jpg blob으로 변환 → Storage `media`의 `items/{timestamp}.jpg`에 업로드
- `deleteItem()` → confirm 후 `items` 행 삭제
- `submitItem()` → 위 입력값으로 `items` insert, 완료 후 `loadAll()` 재조회

## 라이브러리
Cropper.js(CDN, `cropperjs@1.6.1`)를 이미지 크롭에 사용 — User 사이트에도 동일 버전이 이식됐다(아래 참고).

---

# User 사이트 편집모드 (`index.html`, 이식 진행 중)

로그인 + `admins` 테이블 등록 여부로 관리자를 판별한다(`auth-flow.md`). 레거시 Admin과 달리 **모든 사용자가 보는 같은 화면**에서 `editMode` 상태에 따라 액션 UI를 조건부로 보여주거나 숨긴다.

## 이식 완료
- 맵 타일 호버 액션(이미지 변경 / 이름 변경 / 삭제) — 레거시 `pickMapImage`/`renameMap`/`deleteMap`과 동일 로직
- "맵 추가" 타일 — 레거시 `addMap`과 동일 로직
- 태그 섹션별 "+추가" 타일 → `openAddModal(tag)` → 모달
- **붙여넣기 우선 3단계 모달** — `paste → media → details` 순서로 같은 모달 안에서 화면만 전환한다. 첫 화면은 `readAddClipboard()` 버튼과 이미지 업로드 링크만 노출하고, 자동 판별된 유튜브 URL은 기존 `loadClipPlayer()`, 이미지는 기존 Cropper.js 흐름으로 보낸다. media/details 단계에는 뒤로가기를 제공한다.
- **클립보드 자동 판별 + 폴백** — 사용자 클릭 안에서 `navigator.clipboard.read()`를 우선 호출해 `text/plain`은 `parseYouTube()`로 검증하고 이미지 MIME은 Cropper로 전달한다. API 미지원·권한 거부·빈 클립보드는 전용 입력 영역에 포커스를 주고 네이티브 `paste` 이벤트로 Ctrl+V를 받는다. "맵 지명"에서 URL을 붙여넣으면 이미지 전용 오류를 표시한다.
- **모든 태그의 이미지 업로드** — 붙여넣기 또는 "붙여넣지 않고 업로드" → Cropper.js로 크롭 → jpg blob 변환 → Storage `media`의 `items/{timestamp}.jpg`에 업로드 → `img_url` 저장. 파일 선택은 `accept="image/*"`를 유지하고 GIF는 선택/붙여넣기 직후 명시적으로 거부한다.
- `submitItem()`이 `isMapLabel` 전용 분기가 아니라 레거시처럼 `modalType`(vid/img) 기준으로 일반화됨
- **개별 항목 삭제** — `deleteItem()`, 카드 호버 시 ✕ 아이콘(`card-del`) → confirm → `items` 행 삭제. 레거시 `deleteItem()`과 동일하게 confirm 한 번만 거침
- **클립 구간(`clip_start`/`clip_end`) 마킹** — 레거시의 `loadClipPlayer()`/`markClipStart()`/`markClipEnd()`/`clearClip()`/`updateClipLabel()`을 버튼 방식 그대로 이식. 레거시에는 없던 **슬라이더 UI**(`<input type=range>` 2개, 시작/끝)를 추가로 도입해 드래그로도 구간 지정이 가능하다. 버튼/슬라이더 모두 같은 `clipStart`/`clipEnd` 전역 변수를 공유해 항상 동기화됨(`docs/DECISIONS.md` 참고). `submitItem()`이 `modalType==='vid'`일 때 이 값들을 그대로 저장한다(더 이상 항상 `null`이 아님)
- 모달의 클립 플레이어는 오버레이 재생용 `ytPlayer`와 이름이 겹치지 않도록 `clipYtPlayer`라는 별도 변수로 분리 (재생 중인 유튜브 IFrame API 로드 자체는 오버레이 코드와 공유)

## 편집모드 On/Off에 따른 렌더링 차이
`renderMapGrid()`/`renderCards()` 안에서 `editMode` 전역 변수를 직접 참조해 액션 HTML을 조건부로 문자열에 끼워 넣는다. 레거시 Admin처럼 "로그인 = 관리자 = 항상 액션 노출"이 아니라, "로그인 + admins 등록 + editMode=true"일 때만 노출되므로 조건이 하나 더 있다.

---

# 두 관리자 흐름의 최종 목표

`AI_CONTEXT.md`에 따르면 편집모드가 레거시 Admin의 기능을 전부 흡수하면 `sudden-archive-admin` 사이트는 정리(폐기)된다. 현재는 과도기라 두 곳에 관리자 로직이 나뉘어 있다는 점을 유의해야 한다 — 편집모드 관련 버그를 볼 때 레거시 Admin 코드가 아니라 `index.html`을 봐야 한다.
