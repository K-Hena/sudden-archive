# KNOWN_ISSUES.md

> 작업 중 발견했지만 그 작업의 범위 밖이라 수정하지 않은, 확인된 이슈를 기록한다.
> 추측이나 단순 개선 아이디어는 여기 두지 않고 TODO.md에 둔다 — 이 문서는 "실제로 확인된 현재 이슈"만 다룬다.
> 실제로 수정되면 이 문서에서 제거하고 CHANGELOG.md에 기록한다. 재발 방지 가치가 있으면 TROUBLESHOOTING.md에도 원인·해결·예방을 기록한다.

---

## items 전체 로딩 방식 — 대량 등록 시 초기 로딩 성능 저하 가능, 전체 검색 기능과 구조적으로 얽혀 있어 별도 설계 필요

- **발견 시점**: 2026-07-23, 썸네일 lazy loading 전환 작업(작업 1)과 함께 진행된 사전 조사(작업 2)
- **내용**: `loadAll()`이 `sb.from('items').select('*')`로 `map_id` 등 범위 제한 없이 전체 `items`를 매번 불러온다. `loadAll()` 호출 지점은 페이지 최초 로드 1회 + `addMap`/`renameMap`/`deleteMap`/`deleteItem`/`pickMapImage`(맵 이미지 변경)/항목 수정 저장/항목 추가 저장 후 — 총 8곳이다. `renderGlobalTitleSearch()`(전체 제목·채널명 검색), `renderMapGrid()`의 맵별 개수·헤더 CLIPS/TIPS 통계, `renderCards()`의 맵별 카드 그리드, `openOverlay()`/`openEditModal()`의 `items.find()`, `deleteMap()`의 삭제 확인 문구(맵별 항목 수)가 모두 이 전체 `items` 배열에 의존한다. `loadAll()`의 쿼리를 단순히 `map_id`로 제한하면 전체 검색·통계·삭제 확인 문구가 모두 깨진다. 2026-07-23 기준 `items` 테이블 실제 행 수는 7건으로 아직 문제가 될 규모는 아니다
- **위험도**: 현재 낮음(행 수 7건) — 대량 영상 등록 기능이 실제로 늘어나면 초기 로딩 성능 저하로 이어질 수 있음
- **상태**: 미해결(설계 필요)
- **참고**: 맵별로 필요할 때만 불러오고 전체 검색은 별도 서버 사이드 검색 쿼리(`ilike` 등)로 분리하는 방향과, 항목 수가 실제로 문제될 규모에 도달하기 전까지 현재 구조를 유지하는 방향을 놓고 설계 논의 예정

## title/note HTML 미이스케이프

- **발견 시점**: 그룹 E 2~3단계(채널명 표시 UI) 작업 중, 커밋 전 Codex 리뷰에서 지적됨
- **내용**: 카드 템플릿에서 `items.title`/`items.note`가 `innerHTML`에 이스케이프 없이 직접 삽입되고 있음(채널명은 `escapeHtml()` 적용됐지만 title/note는 기존부터 미적용 상태였음)
- **위험도**: 현재 낮음 — title/note는 관리자(admins 등록 사용자)만 입력 가능해 일반 사용자발 악성 입력 경로가 없음. 단, 향후 일반 사용자 입력이 늘어나는 기능(`docs/TODO.md`의 "2단계: 커뮤니티·운영 기능" 아이디어 목록 중 "댓글/피드백 기능")이 추가되면 위험도가 올라갈 수 있음
- **상태**: 미해결
- **참고**: Codex 리뷰에서 major로 지적됐으나, 지시서 범위 밖이라 해당 작업에서는 수정하지 않기로 결정. 결정 경위와 판단 근거는 `docs/DECISIONS.md`의 "그룹 E 2~3단계 > 이스케이프 처리" 문단에 기록되어 있음(단, 그 문단 자체에는 "Codex 리뷰"라는 표현이나 등급 없이, 확인된 사실과 위험도 판단으로만 서술되어 있음)

## renderAuthArea()의 admins 조회가 Supabase 오류를 놓칠 수 있음

- **발견 시점**: 그룹 D-2 1단계(Master 대시보드) 설계 리뷰 중
- **내용**: `renderAuthArea()`의 관리자 판정이 `const { data } = await sb.from('admins')...`만 구조분해하고 `error`는 확인하지 않는다. Supabase JS는 쿼리 실패 시 예외를 던지지 않고 `{ data: null, error }`를 반환하므로, 네트워크 오류나 권한 오류가 나도 `try/catch`에 잡히지 않고 조용히 `isAdmin = false`로 넘어간다(관리자가 일시적으로 관리자 UI를 못 보게 될 뿐 보안 문제는 아님 — 실제 쓰기 권한은 RLS가 담당)
- **위험도**: 낮음 — 관리자 본인에게만 영향, 데이터 노출 위험 없음
- **상태**: 미해결
- **참고**: Master 버튼도 이 동일한 `isAdmin` 값을 재사용하도록 구현했다(지시서가 "기존 판정 로직 재사용, 새로 만들지 않음"을 명시). 오류 처리 보강은 이번 작업 범위 밖이라 그대로 두었다

## Master 대시보드의 "항목 관리"/"맵 관리" 탭 테이블이 좁은 화면(≈390px)에서 페이지 전체 가로 스크롤을 유발함

- **발견 시점**: 헤더·모달 모바일 오버플로우 수정 작업(`mobile_header_modal_overflow_fix.md`) 중 작업 3(다른 기능 실기기 재확인) 스팟체크에서 발견
- **내용**: `.master-table-wrap{overflow-x:auto}` + `.master-table-wrap .master-table{min-width:640px}`는 표 자체의 가로 스크롤을 의도한 것이지만(3단계 "항목 관리" 탭 도입 시 결정, `docs/DECISIONS.md` 참고), 실제로는 표 컨테이너 스크롤이 아니라 **페이지 전체**가 넓어진다. Playwright 실제 디바이스 에뮬레이션(iPhone, 390px)으로 각 요소의 `getBoundingClientRect().width`를 추적한 결과:
  - `.master-shell`: 326px (정상 — `@media(max-width:768px)`로 `flex-direction:column` 적용됨)
  - `.master-content`(`flex:1;min-width:0`), `.master-pane`, `#masterItemsTableWrap`, `.master-table`, `.master-add-row`: 전부 640px
  
  `.master-content{min-width:0}`은 데스크톱(가로 flex) 레이아웃에서 flex 아이템이 내용 때문에 무한정 늘어나는 것을 막는 용도인데, 390px처럼 `.master-shell`이 `flex-direction:column`으로 바뀐 모바일 레이아웃에서는 `.master-content`가 교차축(너비) 기준으로 부모 폭(326px)에 stretch되지 않고 자식(`.master-table`)의 `min-width:640px`를 그대로 따라가며, 그 상위 조상들(`.master-content`/`.master-pane`/`#masterItemsTableWrap`) 어디에도 `width:100%` 같은 명시적 폭 제한이 없어 640px가 body까지 그대로 전파된다. 결과적으로 `document.body.scrollWidth`가 672px(뷰포트 390px 대비 282px 초과)로 나오고, `.master-table-wrap`의 `overflow-x:auto`는 사실상 아무 효과가 없다(래핑하는 박스 자체가 이미 640px로 늘어나 있어 넘칠 내용이 없음). "맵 관리" 탭(4단계에서 추가, 같은 `.master-table-wrap`/`.master-table` 패턴 재사용)도 동일한 원인으로 동일하게 672px 확인됨. "통계"/"영상 추가" 탭은 이 패턴을 안 써서 정상(390px)
- **위험도**: 중간 — 관리자가 휴대폰으로 Master "항목 관리"/"맵 관리" 탭에 들어가면 표를 보기 위해 페이지 전체를 가로로 스크롤해야 하고, 그 사이 헤더·사이드바 탭도 함께 밀려 사용성이 떨어진다. 다만 관리자 전용 화면이라 일반 사용자에게는 영향 없음
- **상태**: 미해결
- **참고**: `mobile_header_modal_overflow_fix.md`는 헤더·모달만 실제로 고치도록 범위를 한정했고, 이 이슈는 "이번 지시서 범위와 무관한 것은 기록만 하라"는 지시에 따라 수정하지 않았다. 고칠 때는 `.master-content`/`.master-pane`/`#masterItemsTableWrap`(`#masterMapsTableWrap`도 동일) 중 하나에 `width:100%`(모바일 컬럼 레이아웃 한정)를 명시하거나, `.master-table-wrap`에 `max-width:100%`를 추가해 실제로 내부 스크롤이 발동하도록 하는 방향을 검토
