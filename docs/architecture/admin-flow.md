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
Cropper.js(CDN)를 이미지 크롭에 사용 — User 사이트에는 아직 로드되지 않는다.

---

# User 사이트 편집모드 (`index.html`, 이식 진행 중)

로그인 + `admins` 테이블 등록 여부로 관리자를 판별한다(`auth-flow.md`). 레거시 Admin과 달리 **모든 사용자가 보는 같은 화면**에서 `editMode` 상태에 따라 액션 UI를 조건부로 보여주거나 숨긴다.

## 이식 완료
- 맵 타일 호버 액션(이미지 변경 / 이름 변경 / 삭제) — 레거시 `pickMapImage`/`renameMap`/`deleteMap`과 동일 로직
- "맵 추가" 타일 — 레거시 `addMap`과 동일 로직
- 태그 섹션별 "+추가" 타일 → `openAddModal(tag)` → 모달
- **"맵 지명" 태그 이미지 업로드** — 모달에서 `isMapLabel`이면 유튜브 링크 입력(`videoWrap`)을 숨기고 이미지 입력(`imageWrap`: 파일 선택 + Ctrl+V 붙여넣기)만 노출. 레거시와 달리 **유형 토글 버튼은 없음** — "맵 지명" 태그 자체가 항상 이미지 전용, "위폭"/"팁" 태그는 항상 영상 전용으로 고정되어 있어 사용자가 유형을 선택할 필요가 없는 구조
- **개별 항목 삭제** — `deleteItem()`, 카드 호버 시 ✕ 아이콘(`card-del`) → confirm → `items` 행 삭제. 레거시 `deleteItem()`과 동일하게 confirm 한 번만 거침

## 이식 안 됨 / 축소해서 이식
- 항목 추가 모달은 **영상 링크 저장까지만** 동작(위폭/팁 태그) — `clip_start`/`clip_end`는 항상 `null`로 저장 (레거시의 클립 마킹 플레이어 없음)
- **이미지 크롭 없음** — 레거시는 Cropper.js로 자른 뒤 업로드하지만, User 사이트에는 Cropper.js가 아직 로드되지 않아 원본 이미지를 그대로 업로드한다 (`docs/DECISIONS.md` 참고)
- "위폭"/"팁" 태그에는 이미지 업로드가 없음 — 현재는 "맵 지명" 태그에만 이미지 업로드가 적용됨

## 편집모드 On/Off에 따른 렌더링 차이
`renderMapGrid()`/`renderCards()` 안에서 `editMode` 전역 변수를 직접 참조해 액션 HTML을 조건부로 문자열에 끼워 넣는다. 레거시 Admin처럼 "로그인 = 관리자 = 항상 액션 노출"이 아니라, "로그인 + admins 등록 + editMode=true"일 때만 노출되므로 조건이 하나 더 있다.

---

# 두 관리자 흐름의 최종 목표

`AI_CONTEXT.md`에 따르면 편집모드가 레거시 Admin의 기능을 전부 흡수하면 `sudden-archive-admin` 사이트는 정리(폐기)된다. 현재는 과도기라 두 곳에 관리자 로직이 나뉘어 있다는 점을 유의해야 한다 — 편집모드 관련 버그를 볼 때 레거시 Admin 코드가 아니라 `index.html`을 봐야 한다.
