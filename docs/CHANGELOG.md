# CHANGELOG.md

> git history(`git log`)와 실제 현재 코드 상태를 비교해서 정리한 주요 변경 이력이다. 커밋 메시지가 불명확한 경우 diff를 확인해 실제 변경 내용을 적었다.

---

## 2026-07-21 — 유튜브 채널명 수집 1단계

- 신규 유튜브 영상 등록 시 oEmbed `author_name`을 `items.channel_name`에 저장하고, 조회 실패 시 `null`로 저장을 계속하도록 처리
- 기존 항목 소급 수집·채널명 검색 UI·수정 모달 갱신은 후속 단계로 유지

## 2026-07-16 — User 사이트 최초 업로드

- `index.html` 최초 업로드 (커밋 `e5eccc2`) — 맵 그리드, 팀별 카드, 유튜브/이미지 재생 오버레이의 기본 골격
- 맵 타일 hover 테두리 색상을 `--amber`에서 흰색(`#FFFFFF`)으로 변경, 사이트 footer 추가 (`36c83b6`)
- 카드/뒤로가기 버튼 hover 색상도 동일하게 흰색으로 통일 (`78aa5ce`)
- 유튜브 클립 **구간 재생** 기능 적용 — `clip_start`/`clip_end`가 있으면 IFrame API로 해당 구간만 반복 재생 (`b7a2d1a`)

## 2026-07-17 — AI 운영 문서 도입

- `docs/AI_CONTEXT.md` 최초 작성 (`250f1b7`) — 프로젝트 기준 문서 체계 시작

## 2026-07-18 — 인프라 정리 + 디스코드 로그인 + 편집모드 통합 착수

- AI 협업 구조를 Claude(설계) + Claude Code(구현) 2인 체계로 명문화 (`dc7c457`)
- `.gitignore`에 `sudden-archive-admin/`(레거시 Admin 사이트, 별도 저장소)과 로컬 작업용 이미지 파일들 추가 (`c3e828c`, `83d7b61`)
- 디스코드 로그인 임시 테스트 코드 추가 (`eea3c8b`) → 정식 로그인 UI로 교체 (`4790dfb`)
- 파비콘 추가(조준경 로고, `6122fe6`) 후 최종 디자인으로 두 차례 재교체 (`57b2b24`, `440e953`)
- `docs/AI_CONTEXT.md`에 "디스코드 로그인 & 편집모드 통합" 진행 상황 섹션 신설 (`1c11f82`)
- **관리자 배지 + 편집모드 토글 버튼** 뼈대 추가 — `admins` 테이블 조회로 관리자 판별 (`1d8c67c`)
- **편집모드 맵 관리 기능** 이식 — 맵 이미지 변경/이름 변경/삭제, 맵 추가 (레거시 Admin 로직 포팅) (`93fe02e`)
- **편집모드 항목 추가 모달(뼈대)** 이식 — 영상(vid) 유형만 지원, `clip_start`/`clip_end`는 항상 `null`로 저장 (`62945d9`)
- 항목이 0개인 태그도 편집모드에서 "+추가" 타일이 보이도록 `renderCards()` 그룹핑 로직 수정 (`68238e5`)
- AI 운영 문서 5종(README_AI/CODING_RULES/PROMPTS/CLAUDE_CODE_RULES/MAINTENANCE) 정비 — 존재하지 않는 문서 참조 제거, 라이브러리 추가 규칙 통일 (`d4b763f`)
- **"맵 지명" 항목 추가 버그 수정** — 모달이 태그와 무관하게 항상 유튜브 링크 입력을 노출하던 문제를 고쳐, "맵 지명" 태그는 이미지 업로드(파일 선택/Ctrl+V 붙여넣기, 크롭 없이 원본 그대로 Storage `items/{timestamp}.jpg`에 업로드)만 가능하도록 분리. "위폭"/"팁"은 기존처럼 영상만 지원
- **편집모드 항목(카드) 개별 삭제 기능** 추가 — 레거시 Admin의 `deleteItem()`을 이식, 카드 호버 시 ✕ 아이콘으로 confirm 후 삭제
- **"위폭"/"팁" 태그 이미지 유형 추가 + 전체 이미지 업로드 크롭 도입** — 항목 추가 모달에 영상/이미지 유형 토글(`typeToggle`)을 복원해 `submitItem()`을 `modalType` 기준으로 일반화. Cropper.js(`cropperjs@1.6.1`, 레거시 Admin과 동일 CDN) 도입으로 맵 지명/위폭/팁 이미지 업로드 모두 크롭 후 jpg 업로드하도록 교체(원본 그대로 업로드하던 이전 로직 제거). `docs/MAINTENANCE.md`의 오래된 "문서 통합" 서술도 함께 정리
- **영상 클립 구간(`clip_start`/`clip_end`) 마킹 기능** 추가 — 레거시 Admin의 `loadClipPlayer()`/`markClipStart()`/`markClipEnd()`/`clearClip()`을 버튼 방식 그대로 이식하고, 그 위에 `<input type="range">` 슬라이더 2개(시작/끝)를 추가 도입해 드래그로도 구간을 지정할 수 있게 했다. 버튼과 슬라이더는 같은 `clipStart`/`clipEnd` 변수를 공유해 항상 동기화된다. `submitItem()`이 이제 실제 클립 값을 저장한다(이전엔 항상 `null`)
- **클립 재생 오버레이 컨트롤바 제거 + 전체 영상 보기** — `openOverlay()`가 클립 구간이 있는 영상은 YouTube `controls:0`으로 띄워 구간 밖 드래그 이탈을 막고, 커스텀 재생/일시정지 버튼(`toggleOverlayPlay()`)을 얹었다. 클립 항목에만 노출되는 "전체 영상 보기" 버튼(`showFullVideo()`)을 누르면 같은 위치에서 이어서 `controls:1` 플레이어로 재생성해 구간 제한 없이 볼 수 있다
- **클립 구간 슬라이더를 단일 트랙 구간 바로 재설계 + "끝쪽이 뻑뻑하다" 버그 수정 + 드래그 스크러빙** — 시작/끝 슬라이더가 서로의 `.value`를 계속 밀어내던 방식이 원인이던 뻑뻑함 버그를 고치고(각자 네이티브 `min`/`max`로 배타적 범위를 걸어 서로 침범 불가하게 함), 위/아래로 나뉘어 있던 슬라이더 2개를 겹친 단일 트랙 구간 바(진행바 표시 + thumb만 `pointer-events:auto`)로 교체했다. 손잡이를 드래그하는 동안 영상을 일시정지하고 그 지점의 정지 프레임을 계속 보여주는 스크러빙 미리보기(약 100ms 스로틀)를 추가했다
- **유튜브 플레이어 자막 자동 재생 끄기** — 클립 마킹 미리보기(`loadClipPlayer`), 클립 재생 오버레이, "전체 영상 보기" 재생성, 클립 없는 일반 영상 iframe 임베드까지 4곳 모두 `cc_load_policy:0`(또는 `cc_load_policy=0` 쿼리스트링)을 추가해, 영상에 자동 자막이 걸려 있어도 시작 시 자막이 켜지지 않게 통일
- **클립 구간 채움 바 오버플로우 수정** — 데이터(저장값)와 렌더링(채움 바 위치 계산)을 분리 진단해 순수 렌더링 문제로 확인. `updateClipRangeFill()`이 손잡이 반지름(8px)을 보정하지 않고 값/전체 트랙 폭 비율만으로 위치를 계산해 채움 바가 손잡이보다 바깥으로 튀어나오던 것을, `calc(8px + (100% - 16px) * 비율)` 방식으로 교체해 실제 손잡이 위치와 일치시켰다
- **쇼츠 등 짧은 영상의 클립 슬라이더 duration 불일치 버그 수정** — `loadClipPlayer()`가 `onReady`에서 `getDuration()`을 한 번만 믿고 슬라이더 `max`를 확정하던 방식이 쇼츠에서 부정확한(작은) duration을 그대로 반영해 트랙이 압축되어 보이던 문제를, 두 번 연속 같은 값이 나올 때까지 폴링하는 `applyClipDuration()`으로 교체해 해결. 모달/영상 전환 시 이전 영상의 슬라이더 상태가 남지 않도록 `applyClipDuration(0)`으로 즉시 초기화하는 로직도 함께 추가. 겸사겸사 클립 관련 `YT.Player` 3곳(모달 미리보기, 클립 재생 오버레이, 전체 영상 보기)의 `onReady`에 `setVolume(50)`을 추가해 기본 재생 볼륨을 50%로 고정

## 2026-07-20 — 클립 구간 채움 바 오버플로우 근본 원인 수정

- **클립 구간 채움 바가 손잡이 밖으로 튀어나오는 버그 근본 원인 수정** — 앞선 두 차례 수정(반지름 보정 `calc()`, duration 폴링 확정) 이후에도 재현되던 버그를 재조사. 실제 원인은 "끝쪽이 뻑뻑함" 수정에서 도입한 교차 방지 방식(상대 슬라이더 값으로 `startRange.max`/`endRange.min`을 계속 좁힘)이 각 슬라이더의 실제 `min~max` 폭을 `clipDuration`보다 좁혀서, 손잡이의 실제 렌더링 비율이 `value/clipDuration`과 어긋나던 것 — 심한 경우 시작/끝 손잡이의 화면 위치가 역전되기까지 했다. `updateClipRangeFill()`을 각 슬라이더 자신의 살아있는 `min`/`max` 기준으로 비율을 계산하도록 바꾸고, 교차 방지 자체도 min/max를 좁히는 방식 대신 각 입력 핸들러가 자기 자신의 value만 clamp하는 방식으로 교체(양쪽 슬라이더의 min/max는 항상 `[0, clipDuration]` 고정). Playwright로 Chromium을 직접 띄워 여러 시나리오(구간 좁음/넓음/쇼츠급 짧은 영상/최소 간격)의 실제 픽셀 위치를 비교해 검증. 상세 진단/검증 표는 `docs/TROUBLESHOOTING.md` 참고
- **항목 추가 모달을 붙여넣기 우선 흐름으로 개편** — 첫 화면에서 `navigator.clipboard.read()`로 유튜브 URL/이미지를 자동 판별해 기존 클립 지정/Cropper 화면으로 연결하고, 실패 시 Ctrl+V `paste` 이벤트 폴백을 제공. media → 제목·설명 단계의 뒤로가기를 지원하며, 이미지 업로드와 GIF 차단, "맵 지명" URL 차단을 추가
- **편집모드 영상 미리보기의 지정 구간 밖 재생 차단** — 일반 오버레이와 분리된 `clipPreviewTimer`가 시작·끝이 모두 지정된 동안 250ms 간격으로 현재 위치를 확인해 `[clipStart, clipEnd)` 밖이면 시작점으로 복귀. 재생/버퍼링/종료 상태는 계속 재생하고 일시정지 상태는 유지하며, 구간 초기화·영상 교체·이미지 전환·모달 종료 시 타이머를 정리
- **현재 맵·팀 내 제목 검색 추가** — 상세 화면에서 현재 맵·RED/BLUE 팀의 `items.title`만 대소문자 없이 부분 일치로 필터링. 표시 건수와 빈 결과 메시지를 검색 결과에 맞추고 맵·팀 전환 시 검색어를 초기화
- **첫 화면 전체 제목 검색 및 검색창 위치 개선** — 맵 선택 문구 오른쪽에서 전체 맵·진영의 제목을 검색해 기존 카드 형태로 맵 이름·진영과 함께 표시하고 오버레이를 재사용. 상세 검색창은 뒤로가기 아래, 맵 제목·팀 선택 위로 이동
- **상세 검색창 상단 오른쪽 정렬** — 첫 화면과 같은 `map-head` 행을 재사용해 뒤로가기 버튼은 왼쪽, 제목 검색창은 같은 행의 오른쪽 끝에 배치하고 모바일에서는 세로로 전환
- **Discord 로그인 기반 즐겨찾기 추가** — Supabase `favorites` 테이블에 복합 PK·CASCADE FK·인덱스와 본인 행 전용 SELECT/INSERT/DELETE RLS를 구성. 위폭·팁 상세/전체 검색 카드에 별 토글을 추가하고 최신 즐겨찾기를 우선 정렬하며 로그아웃 시 상태를 초기화
- **"구간 끝 지정" 직후 시작 지점으로 튕기던 버그 수정** — `markClipEnd()`가 `Math.floor(getCurrentTime())`로 저장한 값을 곧바로 `clipPreviewTimer`의 상한 검사 경계로 재사용해, 지정 직후 첫 폴링에서 항상 구간 밖으로 오판되던 문제. `markClipEnd()`에만 짧은 유예(`clipEndMarkGraceUntil`)를 두고, 슬라이더 입력·구간 초기화 경로에서는 유예를 즉시 해제해 정밀도를 그대로 유지. 원인/검토 과정은 `docs/TROUBLESHOOTING.md` 참고
- **그룹 A: 맵 상세뷰 진영 뷰 확장(TOTAL/RED/BLUE/FAVORITE) + 진영 없음(공통) 항목 지원** — `items.team` CHECK 제약을 `['red','blue']`에서 `['red','blue','none']`로 교체(적용 시점 데이터 0건이라 별도 마이그레이션 불필요). `currentTeam`을 뷰 상태(`'total'|'red'|'blue'|'favorite'`)로 확장 재사용해 팀 토글 버튼을 2개→4개로 늘렸고, TOTAL은 현재 맵의 전체 항목, FAVORITE은 로그인 사용자의 즐겨찾기 항목(팀 무관)을 보여주도록 `renderCards()` 필터링을 분기했다. TOTAL/FAVORITE 카드에서만 타입 배지 아래 진영 텍스트 배지(RED/BLUE/공통)를 표시하며, `red`/`blue`/`none` 이외의 예상 밖 값은 배지를 그리지 않고 콘솔 경고만 남긴다(`teamLabel()`/`teamBadge()`). FAVORITE 버튼을 비로그인 상태로 누르면 기존 로그인 유도 confirm을 그대로 띄우되, 취소 시 이전 뷰를 유지하고 FAVORITE 버튼을 활성화하지 않는다(로그인 완료 후 자동으로 FAVORITE 뷰로 전환하는 것은 이번 범위에서 제외 — 아래 DECISIONS.md 참고). 항목 추가 모달에는 `teamWrap`(RED/BLUE/공통 select, 전역 `modalTeam`)을 새로 추가해 `submitItem()`이 `team: currentTeam` 대신 `team: modalTeam`을 저장하도록 바꿨다
- **편집 모달 클립 감시 복구 경로 보완** — 시작·끝 지정 후 `clipPreviewTimer`가 없는 상태에서 YouTube 플레이어가 재생·일시정지·버퍼링·종료 상태로 전환되면 기존 `syncClipPreviewTimer()`가 감시를 다시 연결하도록 보완. 구간 판정, 250ms 간격, `clipEndMarkGraceUntil`, 일반 카드의 `clipTimer`는 변경하지 않음
- **그룹 B: 항목 추가 모달 붙여넣기 UI 개선 + 저장 미리보기 카드 추가** — `pasteStep`의 버튼 2개(붙여넣기/붙여넣지 않고 업로드)를 처음부터 나란히 노출되는 점선 테두리 박스 2개(`.paste-box`)로 교체, 기존 자동판별 붙여넣기·Ctrl+V 폴백·맵 지명 URL 차단 로직은 그대로 재사용. `teamWrap`(`#mTeam`)을 새 `#savePreviewWrap` 카드로 감싸 영상은 유튜브 썸네일+재생아이콘+구간 시간 배지(없으면 "전체 재생"), 이미지는 크롭 결과 150×150 정사각 썸네일을 함께 보여주며, `showModalStep()`에서 `teamWrap`과 동일한 조건으로 노출 시점을 맞추고 그 시점에 `renderSavePreview()`를 한 번 렌더한다. Cropper 인스턴스의 `ready`/`cropend` 콜백에도 `renderSavePreview()`를 연결해 "맵 지명" 태그(제목·설명 단계 없이 media 단계에서 바로 저장)에서도 크롭 완료 시점에 미리보기가 뜨도록 했다. 모바일 미디어 쿼리에 두 박스/미리보기 카드의 세로 전환 규칙 추가. Codex 리뷰에서 지적된 `getCroppedCanvas()` null 미가드, `paste-box`의 키보드 접근성(div→button) 문제를 반영해 수정. DB 스키마 변경 없음
- **그룹 C: 저장된 항목 수정 기능(제목·설명·진영·클립구간)** — 항목 추가 모달을 전역 `modalMode`(`'add'|'edit'`)로 "수정 모드"까지 재사용하도록 확장. 카드 호버 액션에 기존 `.card-del`(✕) 옆 `.card-edit`(⚙, `openEditModal()`) 아이콘을 추가하고 `.card-fav`의 오프셋을 두 아이콘 자리만큼 넓혔다. `openEditModal()`은 영상이면 `mVideoUrl`을 읽기전용 텍스트 필드로 바꿔 URL을 노출하고 `loadClipPlayer()`에 새로 추가한 완료 콜백(duration 확정 후 호출)에서 저장된 `clip_start`/`clip_end`를 복원, 이미지면(맵 지명 포함) pasteStep/Cropper 화면을 건너뛰고 `showModalStep('details')` 호출 다음에 저장된 `img_url`을 미리보기에 직접 주입한다(재크롭 없음, `cropper`는 명시적으로 비움). `submitItem()`은 수정 모드에서 `insert` 대신 `update()`를 호출하며 payload에 `title`/`note`/`team`(영상이면 `clip_start`/`clip_end`)만 담아 `type`/`tag`/`video_url`/`img_url`은 절대 포함하지 않는다. "맵 지명" 항목은 화면에 노출하지 않는 `title`/`note`를 원본 값 그대로 재사용해 자동값으로 덮어쓰지 않는다. `showModalStep()`의 `savePreviewWrap`/`teamWrap` 노출 조건과 뒤로가기 버튼 표시 조건에 `modalMode==='edit'` 분기를 추가했고, `goBackModal()`에도 수정 모드에서는 절대 `paste` 단계로 가지 않는 방어 로직을 추가했다. Codex 리뷰에서 지적된 "duration 폴링 완료 콜백이 모달이 닫힌 뒤에도 늦게 도착해 `clipStart`/`clipEnd`를 오염시킬 수 있는 레이스"를 콜백 앞단에 `modalMode`/`editingItemId` 일치 가드를 추가해 반영. DB 스키마 변경 없음
- **그룹 C 후속 확인: 클립 리셋 범위·`mVideoUrl` 타입 재검증 + 실 DB 왕복 검증** — `openAddModal()`의 클립 상태 리셋 블록이 그룹 C 구현 중 삭제된 적이 없음을 코드로 재확인(혼동의 소지였던 것은 `loadClipPlayer()`가 이미 수행하는 리셋과 중복이라 `openEditModal()`에서만 제거했던 블록). `mVideoUrl`을 수정 모드에서 읽기전용으로 보여줄 때의 임시 타입을 `type="text"`에서 `type="url"`로 통일(기존 CSS가 두 타입에 동일 스타일을 적용해 시각적 차이 없음, `openAddModal()`/`closeModal()`은 그룹 C 때부터 이미 `type="hidden"`으로 되돌리고 있었음). 브라우저에서 수정→취소→추가 재오픈 시나리오로 클립 상태·타입이 완전히 초기화되는 것을 확인했고, 실 Supabase에 검증용 더미 항목을 INSERT한 뒤 `submitItem()` edit 분기와 동일한 payload로 UPDATE→SELECT까지 확인, 사용자 승인 후 DELETE로 원상 복구했다(SQL Editor 라벨: `group-c-update-roundtrip-test`)

---

## 2026-07-21 — 그룹 D 1단계: 항목 클릭수 추적 스키마 + 기록 로직

- **`item_clicks` 테이블 생성** — 항목(카드) 클릭·재생 횟수를 이벤트 로그 방식(클릭마다 새 행)으로 쌓는 신규 테이블. `item_id`(FK, CASCADE)/`user_id`(nullable FK, SET NULL)/`created_at`. RLS로 INSERT는 `anon`/`authenticated` 모두 허용하되 본인 `user_id` 또는 `null`만 허용(타인 사칭 차단), SELECT는 `admins` 등록 사용자만 허용. `favorites`가 쓰던 `(select auth.uid())` 감싸기 패턴을 그대로 따랐다
- **클릭 기록 함수 `trackClick(itemId)` 추가 + `openOverlay()` 연결** — `openOverlay(id)` 최상단에서 `void trackClick(id)`로 fire-and-forget 호출해 오버레이 여는 속도에 영향이 없다. 응답 에러와 네트워크 예외 모두 `console.warn`만 남기고 `alert`은 띄우지 않아, 클릭 기록 실패가 카드 열람을 막지 않는다. `openOverlay()`를 재사용하는 모든 진입점(전체 검색/상세/즐겨찾기 카드)에서 자동으로 함께 기록된다
- 실제 anon 세션으로 Supabase REST API를 직접 호출해 RLS를 검증(관리자 권한 SQL 조회로 정책 존재만 확인한 것이 아님) — `user_id: null` INSERT 성공, 타인 `user_id` 스푸핑 INSERT 실패, anon SELECT는 빈 배열. 배포 후 Playwright로 운영 URL에 직접 접속해 미디어 없는 테스트 항목을 클릭, `POST .../item_clicks` 201 응답을 Network 탭에서 실측 확인. 이 작업 중 최초 구현분이 한 차례 미커밋 상태로 남아있던 것을 발견해 커밋을 별도로 나눴다(`b743418`) — 자세한 경위는 `docs/TROUBLESHOOTING.md` 참고
- 대시보드 UI·집계 쿼리는 이번 범위 밖(그룹 D 2단계). 세부 결정과 알려진 한계는 `docs/DECISIONS.md`, 스키마는 `docs/DATABASE.md` 참고

---

## 2026-07-21 — 기본 뷰 TOTAL 전환 + 즐겨찾기 별 아이콘 스타일 변경

- **맵 상세뷰 기본 팀을 RED에서 TOTAL로 변경** — `openMap()`이 `currentTeam = 'red'` 대입 없이 `setTeam('total')`만 호출하도록 정리하고, 전역 초기값도 `let currentTeam = 'total'`로 통일. `setTeam()` 내부 로직(버튼 클래스 토글, `renderCards()` 호출)과 FAVORITE 비로그인 확인 로직은 그대로 유지. Codex 리뷰에서 항목 추가 모달의 `modalTeam`이 `currentTeam`이 `'red'`/`'blue'`일 때만 자동 선택되어 TOTAL 진입 직후에는 팀 미선택 상태로 시작하는 부작용이 지적됐으나, 사용자 확인 후 이번 범위에서는 그대로 두기로 결정
- **즐겨찾기 별 버튼(`.card-fav`) 사각 테두리/배경 제거** — `border`/`background`를 명시적으로 `0`/`transparent`로 지정해 브라우저 기본 버튼 스타일이 새로 나타나지 않게 하고, 대신 `text-shadow`로 가독성을 보완. 클릭 영역(32×32)과 `.with-delete` 오프셋은 그대로 유지하며, 기존에 없던 `.card-fav:focus-visible` 아웃라인을 추가해 키보드 포커스 표시를 보완. `favoriteButton()`의 구조·onclick·active 판별 로직은 변경 없음
- DB 스키마 변경 없음

---

## 2026-07-21 — 진영 선택 로직 변경: "공통" 옵션 제거 + 미선택 시 자동 공통 저장

- **그룹 A의 "미선택 시 저장 차단" 결정을 대체** — `mTeam` select에서 `<option value="none">공통</option>`을 삭제하고 placeholder를 "선택 안 함 (공통)"으로 변경. `submitItem()`의 `if(!modalTeam){...}` 차단문을 제거하고 `const savedTeam = modalTeam || 'none';`을 한 번 계산해 edit update·vid insert·img insert 세 저장 경로 모두 재사용하도록 통일
- **항목 추가 모달만 항상 미선택으로 시작** — `openAddModal()`이 `currentTeam`이 RED/BLUE일 때 자동으로 팀을 선택하던 로직을 제거, TOTAL/RED/BLUE/FAVORITE 어느 뷰에서 열어도 미선택 상태로 시작. 수정 모달(그룹 C)의 `openEditModal()`은 변경하지 않았고, 저장된 값이 `'none'`인 항목을 열면 select에 해당 옵션이 없어 브라우저가 자동으로 빈 값(미선택)으로 표시하는 것을 확인(별도 분기 코드 불필요)
- Codex 리뷰 통과(지적 사항 없음). 실 Supabase에 검증용 더미 항목을 INSERT(`team:'none'`)한 뒤 `team:'red'`로 UPDATE까지 실제로 확인하고, 앱에서 TOTAL/RED/BLUE 필터링이 의도대로 동작하는 것을 확인한 뒤 사용자 승인을 받아 DELETE로 원상 복구했다. DB 스키마(CHECK 제약·RLS) 변경 없음. 세부 결정은 `docs/DECISIONS.md` 참고
- **후속 보완 검증(코드 변경 없음, Codex 리뷰 대상 아님)** — 최초 보고에서 빠졌던 두 케이스를 추가로 확인했다. ① FAVORITE 뷰: 로그인·즐겨찾기 상태를 클라이언트에서 시뮬레이션해 `team:'none'`(공통) 항목도 팀과 무관하게 FAVORITE 뷰에 정상 노출되는 것을 확인(`renderCards()`의 FAVORITE 필터는 `favoriteRow(id)` 기준이라 이번 변경과 무관, 회귀 없음). ② "맵 지명" 태그: 추가 모달이 TOTAL/RED/BLUE/FAVORITE 어느 뷰에서 열어도 미선택으로 시작하고 수정 모달은 red/blue 선택값·`'none'` 빈 값 표시가 위폭/팁과 동일하게 동작함을 함수 호출로 확인. 실 Supabase에도 `tag:'맵 지명'` 더미 항목을 INSERT(`team:'none'`) 후 `team:'blue'`로 UPDATE해 TOTAL(2)/BLUE(1)/RED(0) 필터링을 실제로 재확인한 뒤 사용자 승인을 받아 DELETE로 정리했다

---

## 2026-07-21 — 제목/설명 글자수 제한 (실측 기반 maxlength 적용)

- **실측으로 `maxlength` 산정** — 말줄임 CSS 적용 전, 실제 렌더링된 `.card .meta .title`/`.note`에 한글 반복 문자열을 대입해 측정. 카드 폭이 가장 좁아지는 768px 뷰포트(title `clientWidth:198px`) 기준, 제목은 16자부터 `scrollWidth(199px)`가 `clientWidth`를 초과, 설명은 37자부터 2줄(`34.5px`)을 넘어 3줄(`52px`)째로 진입. 각각 여유 2자를 두고 제목 `maxlength="14"`, 설명 `maxlength="35"`로 확정
- **CSS 안전장치** — `.card .title`에 1줄 말줄임(`white-space:nowrap;overflow:hidden;text-overflow:ellipsis`), `.card .note`에 2줄 말줄임(`overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical`) 추가. `renderGlobalTitleSearch()`도 같은 클래스를 재사용해 자동 적용됨을 확인
- **입력 필드 + 카운터** — `mTitle`/`mNote`에 `maxlength` 속성과 `oninput="updateTextCounters()"`를 연결하고, 새 공용 함수 `updateTextCounters()`를 `openAddModal()`/`openEditModal()`에서도 호출해 모달 진입 시점에도 정확한 초기 카운터가 보이도록 했다
- **기존 저장 값 자동 절단 금지** — `openEditModal()`이 `.value`에 DB 값을 대입하는 것은 `maxlength` 적용 대상이 아니라는 브라우저 기본 동작을 그대로 이용(별도 방어 코드 없음). 실 DB 확인 결과 이 시점 기존 데이터에는 기준 초과 값이 없었고, 검증용 더미(제목 19자·설명 36자)를 INSERT해 수정 모달에서 잘리지 않고 그대로(카운터 `19/14`, `36/35`) 로드되는 것을 확인한 뒤 사용자 승인을 받아 DELETE로 정리
- Codex 리뷰 통과 — 카운터/`maxlength`가 UTF-16 코드 유닛 기준이라 이모지 등 서로게이트 페어가 2자로 계산될 수 있다는 점을 지적받았으나, 지시서에서 명시한 알려진 한계라 별도 처리하지 않기로 확인. DB 스키마 변경 없음(`items.title`/`items.note`는 여전히 길이 제한 없는 `text`). 실측 근거·최종값은 `docs/DECISIONS.md`, DB 레벨 무제한이라는 점은 `docs/DATABASE.md` 참고

---

## 2026-07-21 — 카드 그리드/테마 UI 후속 개선

- **카드 그리드 고정 브레이크포인트 전환 + 글자수 제한 재산정** — 유동 그리드(`auto-fill minmax`)를 고정 열 구조로 바꾸고, `renderGlobalTitleSearch()`가 지도 선택용 `.map-grid`를 상속하던 기존 버그를 `.card-grid-inner`/`.map-grid` 클래스 전환으로 수정. PC 카드 폭 기준으로 제목 `maxlength="17"`, 설명 `maxlength="41"`로 재산정했다 (`50b75f0`)
- **라이트/다크 테마 토글 추가** — `:root[data-theme="light"]` 오버라이드, `localStorage` 키 `sa-theme`, 초기 렌더 전 테마 적용 스크립트를 추가. 포인트 컬러는 테마 무관 고정하고, 호버/포커스 반전용 `--hover-invert`를 도입했다 (`d6ad20e`)
- **테마 토글 스위치 UI + 로고 반전** — 기존 이모지 토글을 pill 형태의 `role="switch"` 버튼으로 교체하고, `aria-checked="true"`를 라이트 테마 기준으로 갱신하도록 변경. 라이트 테마에서 흰 배경 위에 묻히던 `.reticle` 로고는 `var(--hover-invert)`로 반전했다 (`3ab9736`)
- **카드 그리드 왼쪽 정렬** — `.card-grid-inner`의 `margin:0 auto`를 제거해 태그 라벨/구분선과 카드 시작점을 같은 왼쪽 기준선에 맞췄다 (`fc00ecc`)
- **넓은 화면 카드 7열 적용** — 1920px급 PC에서 7열 한 줄 배치를 검증한 뒤, 넓은 화면은 `repeat(7,1fr)`/`max-width:1840px`, 1904px 이하는 3열, 600px 이하는 1열로 조정했다 (`fe49b2a`)
- **GPT/Codex 작업 규칙 문서 보완** — 작업 완료 보고는 지시서의 테스트 확인 사항을 항목별 ✅/❌/➖로 보고하도록 하고, 코드 변경 커밋은 push 전 자체 리뷰 또는 Codex 리뷰를 예외 없이 거치도록 `docs/PROMPTS.md`에 추가했다 (`42df03f`)

---

# 참고

- 이 문서는 커밋 단위 이력이다. 기능별 완료/진행 상태는 `TODO.md`, 설계 이유는 `DECISIONS.md`를 참고.
- 앞으로 의미 있는 변경이 생기면 이 문서에 이어서 기록한다.
