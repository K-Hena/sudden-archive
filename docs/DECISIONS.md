# DECISIONS.md

> AI_CONTEXT.md에 기록된 확정 사항과, 실제 코드에서만 확인 가능한 구현 결정을 함께 정리했다. "선택 이유"는 AI_CONTEXT.md의 서술 또는 DEVELOPMENT_GUIDE.md 등 확인 가능한 원칙에 근거했다.

---

## 관리자 통합 방식: 사이트 하나로 통합 + 편집모드 토글

**결정**: 별도 Admin 사이트를 계속 운영하는 대신, User 사이트 안에 관리자가 로그인하면 같은 화면에서 "편집모드"로 전환되는 방식(AI_CONTEXT의 "옵션 B")을 채택했다.

**이유**: 로그인 계정을 하나로 통합하고, 두 사이트를 유지보수해야 하는 부담을 줄이기 위해 (AI_CONTEXT.md).

---

## 로그인 방식: Supabase Auth Discord Provider

**결정**: User 사이트의 신규 로그인은 이메일/비밀번호가 아니라 Discord OAuth로 구현했다.

**이유**: 관리자뿐 아니라 일반 사용자도 로그인(향후 즐겨찾기 등 개인화 기능)을 하게 될 것이므로, 서든어택 커뮤니티가 이미 사용 중인 Discord 계정으로 가입 마찰을 줄이기 위해 (AI_CONTEXT.md).

레거시 Admin 사이트(`sudden-archive-admin`)는 여전히 이메일/비밀번호 로그인을 쓰고 있으며, 이 결정은 그 사이트를 바꾸지 않고 새로 만드는 User 사이트 로그인에만 적용됐다.

---

## 관리자 판별: `admins` 테이블 + RLS

**결정**: 클라이언트 코드에서 역할을 검사하는 대신, `admins` 테이블에 등록된 `user_id`만 `maps`/`items`의 INSERT/UPDATE/DELETE가 가능하도록 Supabase RLS로 강제했다. 클라이언트는 이 테이블을 조회해 UI를 보여줄지만 결정한다.

**이유**: 프론트엔드 조건문만으로 권한을 막으면 우회가 가능하므로, 실제 쓰기 권한은 DB 레벨(RLS)에서 강제한다 (AI_CONTEXT.md).

---

## 편집모드 전용 강조색: `--edit-accent` 신설, `--amber` 재사용 금지

**결정**: 편집모드 관련 UI(배지, 토글 버튼, 타일 액션, 추가 타일, 모달 버튼)는 기존 `--amber`(오렌지 계열, `#F2A93B`)를 쓰지 않고 새로 만든 `--edit-accent`(`#FF5C9E`) 팔레트로 통일했다.

**이유**: 편집모드 UI를 사용자에게 명확히 시각적으로 구분해주기 위한 작업 지시. 참고로 초기 커밋(`36c83b6`, `78aa5ce`)에서 맵 타일/카드/뒤로가기 버튼의 hover 강조색을 `--amber`에서 흰색으로 이미 바꾼 적이 있어, `--amber` 변수 자체는 남아 있지만 현재 UI에서 거의 쓰이지 않는 상태였다.

---

## 편집모드 CRUD 이식은 단계적으로 진행

**결정**: 레거시 Admin 사이트의 CRUD 기능을 한 번에 옮기지 않고, ①관리자 판별+토글 뼈대 → ②맵 CRUD(이미지/이름/삭제/추가) → ③항목 추가(영상만, 클립마킹 제외)의 순서로 나눠서 이식했다. 항목 삭제, 이미지 업로드/크롭, 클립 구간 마킹은 아직 다음 단계로 남겨뒀다.

**이유**: "큰 기능은 한 번에 다 구현하지 않고 단계별로 나눠서 진행하고, 각 단계마다 결과를 확인한다"는 AI_CONTEXT.md의 개발 원칙을 따름.

---

## 편집모드 UI는 렌더 함수 안에서 전역 `editMode` 변수로 조건부 렌더링

**결정**: 별도의 상태 관리 라이브러리나 컴포넌트 구조를 도입하지 않고, 기존 `renderMapGrid()` / `renderCards()` 함수 내부에서 전역 `editMode` boolean을 직접 참조해 액션 UI를 문자열 템플릿으로 조건부 삽입하는 방식을 택했다. `editMode`가 바뀌면 (`toggleEditMode()`, 로그인/로그아웃 시) 이 렌더 함수들을 다시 호출해 갱신한다.

**이유**: 프로젝트가 프레임워크 없는 단일 HTML/바닐라 JS 구조이고(DEVELOPMENT_GUIDE.md), 기존 렌더 함수를 재사용하는 것이 새 상태 관리 계층을 추가하는 것보다 최소 변경 원칙에 맞음.

---

## 맵/항목 이름의 작은따옴표 이스케이프(`safe` 변수) 도입

**결정**: `renderMapGrid()`에서 맵 이름을 `onclick` 인라인 속성에 넣기 전에 `m.name.replace(/'/g,"\\'")`로 이스케이프한 `safe` 값을 사용하도록 바꿨다 (기존에는 이스케이프 없이 `m.name`을 그대로 넣었음).

**이유**: 편집모드의 `renameMap`/`deleteMap`이 이름을 인자로 받는 `onclick` 문자열을 새로 추가하면서, 이름에 작은따옴표가 포함되면 HTML이 깨지는 문제를 막기 위해 (레거시 Admin 코드에 이미 있던 동일 패턴을 그대로 이식).

---

## "맵 지명" 항목 이미지 업로드: 크롭 없이 원본 그대로 저장 (이후 결정으로 대체됨)

**결정(2026-07-18 1차)**: 레거시 Admin 사이트는 이미지 업로드 시 Cropper.js(CDN)로 자른 뒤 업로드하지만, User 사이트 편집모드에는 Cropper.js가 로드되어 있지 않다. 사용자 승인 없이 새 라이브러리를 추가하지 않는다는 원칙에 따라, 이번 이식에서는 Cropper.js를 새로 도입하지 않고 파일 선택 또는 Ctrl+V로 받은 이미지를 크롭 없이 그대로 Storage에 업로드하는 최소 구현으로 진행했다.

**이후 상태**: 같은 날 후속 작업에서 사용자가 Cropper.js CDN 추가를 명시적으로 승인해, 아래 "이미지 업로드 크롭 기능 도입" 결정으로 대체됐다. 이 항목은 "왜 처음엔 크롭 없이 갔는지"를 남기기 위한 기록으로 유지한다.

---

## 이미지 업로드 크롭 기능 도입: Cropper.js, 레거시 Admin과 동일 CDN/설정, 크롭 비율 고정 없음

**결정**: "맵 지명"뿐 아니라 "위폭"/"팁" 태그의 이미지 업로드에도 Cropper.js(`cropperjs@1.6.1`, 레거시 Admin `sudden-archive-admin/index.html`과 동일 CDN 버전)를 도입해 모든 이미지 업로드가 크롭을 거치도록 통일했다. Cropper 초기화 옵션은 `{ viewMode: 1, autoCropArea: 1, background: false }`로 레거시와 동일하게 맞췄고, **`aspectRatio`는 지정하지 않았다(자유 비율 크롭)**.

**크롭 비율을 고정하지 않은 이유**: "맵 지명" 카드와 "위폭"/"팁" 카드의 실제 CSS를 확인한 결과, 둘 다 동일한 `.card > .thumb` 마크업을 쓰고 `.thumb{height:130px;...}`(고정 높이) + 그리드 컬럼(`minmax(220px,1fr)`, 가변 너비) + `background-size:cover`로 렌더링된다 — 즉 태그별로 다른 비율이 정해져 있는 게 아니라, 애초에 카드 썸네일 자체가 뷰포트에 따라 폭이 변하는 고정 비율이 아닌 레이아웃이다. 이런 구조에서 임의로 하나의 `aspectRatio`(예: 16:9)를 고정하면 오히려 `cover`로 다시 잘리면서 사용자가 크롭한 의도와 실제 표시가 어긋날 수 있다. 레거시 Admin도 같은 이유로 `aspectRatio`를 지정하지 않았던 것으로 보이며(코드에 없음), 이번에도 그 방식을 그대로 따랐다.

**이전 결정과의 관계**: 바로 위의 "크롭 없이 원본 그대로 저장" 결정을 대체한다 — Cropper.js 도입이 이번 작업에서 사용자 승인을 받았기 때문이다.

---

## 클립 구간 지정: 버튼(레거시 이식) + 슬라이더(신규)를 같은 변수로 동기화 (배치/방식은 이후 대체됨)

**결정(2026-07-18, 1차)**: 영상 클립 구간(`clip_start`/`clip_end`) 지정 UI를 레거시 Admin의 버튼 방식(`markClipStart`/`markClipEnd`/`clearClip`)과 신규 슬라이더 방식(`<input type="range">` 2개, 시작/끝) 두 가지로 제공하되, 둘 다 동일한 전역 변수 `clipStart`/`clipEnd`를 공유했다. 이 1차 버전은 슬라이더 2개를 겹치지 않고 위아래로 나란히 배치했고, 서로 교차하지 못하게 "상대방 슬라이더의 `.value`를 직접 밀어내는" 방식으로 경계를 강제했다.

**이후 상태**: 이 방식이 "끝 슬라이더가 뻑뻑하게 움직인다"는 버그의 원인이 되어(교차 구간에서 매 드래그 틱마다 상대방 값을 계속 다시 써야 했음), 아래 "구간 슬라이더 재설계" 결정으로 배치/구현 방식이 모두 대체됐다. `clipStart`/`clipEnd`를 버튼과 슬라이더가 공유한다는 원칙 자체와 `clipYtPlayer` 변수 분리 이유는 그대로 유지된다.

**모달 전용 플레이어 변수명(`clipYtPlayer`)을 새로 둔 이유**: 재생 오버레이(`openOverlay`)가 이미 전역 변수 `ytPlayer`를 클립 재생용 YouTube 플레이어 인스턴스에 쓰고 있다. 모달의 클립 마킹 플레이어에 같은 이름을 재사용하면, 모달과 오버레이가 겹치는 시나리오에서 서로의 플레이어 인스턴스를 덮어써 `destroy()`가 엉뚱한 인스턴스를 정리하는 문제가 생길 수 있어 별도 변수로 분리했다.

---

## 구간 슬라이더 재설계: 단일 트랙 겹침 + 네이티브 min/max 배타적 범위 + 드래그 스크러빙

**결정**: 위/아래로 분리돼 있던 슬라이더 2개를, 하나의 트랙 위에 두 `<input type=range>`(시작/끝)를 절대 위치로 겹친 뒤 손잡이(thumb)만 클릭 가능하게 만든 단일 구간 바로 교체했다. 두 손잡이 사이 구간은 별도 `div`(`#clipRangeFill`)로 색칠해 시각적으로 보여준다. 교차 방지는 더 이상 "상대방 값을 미는" 방식이 아니라, **각 슬라이더 자신의 `min`/`max` 속성을 상대방 값 기준으로 좁혀서**(`startRange.max = clipEnd-1`, `endRange.min = clipStart+1`) 브라우저의 네이티브 range 클램핑이 알아서 경계를 막게 했다. 새 라이브러리는 추가하지 않았다(순수 HTML/CSS/JS).

**"끝쪽이 뻑뻑하다" 버그의 실제 원인**: 이전 방식(`onClipStartInput`/`onClipEndInput`이 반대쪽 슬라이더의 `.value`를 직접 재할당)은, 두 핸들이 교차하기 시작하면 그 이후 드래그가 끝날 때까지 **매 `oninput` 틱마다** 반대쪽 슬라이더의 값을 계속 다시 써야 하는 구조였다. 끝 슬라이더의 기본 위치가 항상 맨 오른쪽(전체 길이)이다 보니, 사용자가 끝 핸들을 왼쪽으로 크게 끄는 일반적인 조작에서 이 "교차 유지 갱신" 구간이 시작 핸들보다 훨씬 넓게 발생해 유독 끝 쪽이 뻑뻑하게 느껴졌다. 새 방식은 애초에 상대방 슬라이더의 값을 쓰는 코드 자체가 없어(자기 자신의 min/max만 좁힘) 이 문제가 구조적으로 사라진다. 자세한 원인 분석은 `docs/TROUBLESHOOTING.md` 참고.

**겹친 슬라이더의 클릭 우선순위 문제 해결**: `.clip-range-input`(두 range 자체)은 `pointer-events:none`으로 클릭을 통과시키고, `::-webkit-slider-thumb`/`::-moz-range-thumb`(손잡이 부분)만 `pointer-events:auto`로 되살렸다. 트랙 영역을 클릭해도 아무 슬라이더에도 클릭이 가로채이지 않고, 손잡이를 직접 잡을 때만 해당 슬라이더가 반응한다 — 두 슬라이더가 같은 위치에 겹쳐 있어도 "어느 쪽이 클릭을 먹을지" 경쟁하지 않는다.

**드래그 스크러빙(정지 프레임 미리보기)**: 각 슬라이더의 `onpointerdown`에서 `pauseVideo()`로 즉시 멈추고, `oninput`(드래그 중)마다 `scrubClipPreview()`가 `seekTo(현재값, true)`를 호출해 그 지점의 정지 프레임을 계속 갱신한다. 유튜브 IFrame API가 과도한 `seekTo` 호출에 버벅일 수 있어 약 100ms 시간 기반 스로틀을 적용했다(마지막 성공 호출 이후 100ms가 지나지 않으면 무시). 손을 뗀 시점(`onchange`)에는 스로틀과 무관하게 정확한 최종 위치로 한 번 더 `seekTo`하고, 별도로 `playVideo()`를 호출하지 않으므로 자동재생되지 않는다.

**버튼 마킹과의 관계**: `markClipStart()`/`markClipEnd()`(현재 재생 시점을 기록하는 버튼)는 이번 스크러빙/경계 로직과 무관하게 그대로 뒀다 — 이 둘은 여전히 `syncClipSliders()`를 통해 슬라이더 위치·범위에 반영된다.

---

## 클립 재생 오버레이: 컨트롤바 제거는 재생성(옵션 즉시 변경 불가), 전체 영상 보기는 새 플레이어로 이어재생

**결정**: 클립 구간이 있는 영상은 `openOverlay()`에서 YT.Player를 `controls:0`으로 생성해 컨트롤바 자체를 없애고, 대신 오버레이 위에 커스텀 재생/일시정지 버튼(`overlayPlayPause`)을 하나 얹었다. "전체 영상 보기"(`showFullVideo()`)를 누르면 기존 플레이어를 `destroy()`하고 **같은 videoId로 `controls:1` 플레이어를 새로 생성**하되, 직전 `getCurrentTime()` 값을 `start`로 넘기고 `onReady`에서 `seekTo()`해 이어서 재생되게 했다.

**옵션을 즉시 바꾸지 않고 재생성한 이유**: YouTube IFrame Player API는 `controls` 같은 `playerVars`를 iframe 생성 시점에만 반영하고, 이미 만들어진 플레이어 인스턴스에서 이 값을 나중에 바꾸는 API(`setOption` 류)를 제공하지 않는다. 즉 "컨트롤바를 다시 켠다"는 요구 자체가 플레이어 재생성 없이는 구현 불가능해서, 지시서에서 제시한 대안(재생성 + 이어재생)을 그대로 따랐다.

**재생/일시정지 아이콘 동기화**: 커스텀 버튼 클릭뿐 아니라 `onStateChange` 이벤트에서도 아이콘을 갱신한다(`PLAYING`→⏸, `PAUSED`→▶). 컨트롤바가 없어도 포커스 상태에서 스페이스바 등으로 재생 상태가 바뀌는 경우까지 아이콘이 실제 상태와 어긋나지 않도록 하기 위함이다.

**오버레이 DOM 구조 변경**: 기존에는 `#overlayMedia`의 `innerHTML`을 직접 갈아끼웠는데, 재생/일시정지 버튼과 "전체 영상 보기" 버튼을 오버레이 위에 계속 떠 있게 하려면 그 자리를 `innerHTML`로 지우면 안 된다. 그래서 실제 미디어(iframe/img/안내문구)만 담는 `#overlayMediaContent`를 `#overlayMedia` 안에 하나 더 두고, 두 버튼은 그 바깥 형제 요소로 분리했다 — 열고 닫을 때마다 버튼까지 다시 만들 필요 없이 `style.display`만 토글하면 되도록.

**세션 한정(저장 안 됨)**: "전체 영상 보기"로 전환한 상태는 `overlayHasClip`/`overlayVideoId` 같은 오버레이 전용 변수에만 남고 DB에는 쓰지 않는다. `closeOverlay()`가 이 변수들을 매번 초기화하므로, 오버레이를 닫았다가 같은 항목을 다시 열면 항상 클립 모드(컨트롤바 없음)로 재시작한다 — 지시서의 "그 세션에서만 유효" 요구와 일치.

---

## 항목 추가 진입: Async Clipboard API 우선 + 네이티브 paste 이벤트 폴백

**결정**: 편집모드 항목 추가 모달의 수동 영상/이미지 토글을 제거하고, 사용자 클릭 안에서 `navigator.clipboard.read()`로 최신 클립보드의 이미지 또는 `text/plain`을 읽어 자동 분기한다. 텍스트는 기존 `parseYouTube()`가 유효한 풀영상/쇼츠 URL로 판별한 경우에만 기존 `loadClipPlayer()`로 보내고, 이미지는 기존 `loadImageIntoCropper()`로 보낸다. 권한 거부·API 미지원·빈 클립보드는 포커스된 입력 영역과 네이티브 `paste` 이벤트로 Ctrl+V를 받는다.

**이유**: Async Clipboard API는 HTTPS와 사용자 제스처가 있는 지원 브라우저에서 버튼 한 번으로 이미지와 텍스트를 함께 판별할 수 있지만, 브라우저·권한 정책에 따라 실패할 수 있다. 네이티브 `paste` 이벤트는 사용자가 직접 Ctrl+V를 수행하므로 별도 읽기 권한 없이 동일한 판별 로직으로 복구할 수 있다. 새 라이브러리나 브라우저 확장프로그램은 필요하지 않다.

**제한**: Stage 1은 로딩 표시, 영구 권한 거부 안내 고도화, 브라우저별 문구 차등 처리를 추가하지 않는다. 파일 입력은 `accept="image/*"`를 유지하되 선택·클립보드 GIF는 라우팅 시 명시적으로 거부한다.

---

## 클립 슬라이더 duration 확정: `onReady` 1회 호출 대신 안정될 때까지 폴링

**결정**: `loadClipPlayer()`가 슬라이더 `min`/`max`를 확정하는 시점을, `onReady`에서 `getDuration()`을 한 번 호출한 결과를 즉시 쓰는 대신, 같은 값이 두 번 연속 나올 때까지(또는 최대 20회, 약 3초) 150ms 간격으로 재확인한 뒤에 확정하도록 바꿨다. 이 로직은 `applyClipDuration(duration)`이라는 별도 함수로 분리해 `loadClipPlayer()`의 초기화(영상 전환 시 슬라이더를 즉시 0으로 되돌리는 용도)와 폴링 완료 시점 양쪽에서 재사용한다.

**이유**: 유튜브 IFrame API는 `onReady` 시점에 `getDuration()`이 항상 최종 값을 반환한다고 보장하지 않는다 — 특히 쇼츠처럼 매우 짧은 영상은 메타데이터가 늦게 채워져 `onReady` 직후엔 0이거나 실제보다 작은 값을 반환하다가 곧 정확한 값으로 바뀌는 경우가 있었다(자세한 진단은 `docs/TROUBLESHOOTING.md` 참고). "두 번 연속 동일한 양수 값"을 확정 조건으로 삼아, 값이 아직 흔들리는 중간 단계에서 슬라이더 범위를 확정해버리는 일을 막았다. 풀영상처럼 애초에 `onReady` 시점부터 정확한 값이 나오는 경우는 폴링이 즉시(최대 150ms 이내) 끝나므로 실사용에 체감되는 지연은 없다.

**모달을 새로 열거나 같은 모달 안에서 다른 영상을 불러올 때의 상태 초기화**: `openAddModal()`과 `loadClipPlayer()` 양쪽 모두 새 영상을 로드하기 전에 `applyClipDuration(0)`을 호출해 이전 영상의 `clipDuration`/슬라이더 `min`/`max`/`value`를 완전히 0으로 리셋한다. 이렇게 하지 않으면, 같은 모달에서 긴 영상을 먼저 불러왔다가 곧바로 쇼츠로 바꿔 부르는 경우 새 영상의 duration이 폴링으로 확정되기 전까지 이전 영상의 슬라이더 범위가 잠깐 남아있을 수 있다.

---

## 편집 미리보기 구간 감시는 일반 오버레이 타이머와 분리

**결정**: 편집모드의 `clipYtPlayer`는 전용 `clipPreviewTimer`를 사용한다. `clipStart`와 `clipEnd`가 모두 있을 때만 250ms 간격으로 현재 시간을 확인하고, `current < clipStart || current >= clipEnd`이면 시작점으로 이동한다. 일반 재생 오버레이의 `clipTimer`와 플레이어 상태는 공유하지 않는다.

**이유**: 두 화면은 서로 다른 YouTube 플레이어 인스턴스(`clipYtPlayer`/`ytPlayer`)와 생명주기를 가진다. 같은 타이머를 공유하면 한 화면의 닫기·재생성 동작이 다른 플레이어의 감시를 중단할 수 있다. 250ms는 일반 오버레이에서 이미 사용 중인 간격을 그대로 재사용했다.

**재생 상태 보존**: 구간 밖 감지 당시 상태가 `PLAYING`, `BUFFERING`, `ENDED`이면 시작점 이동 후 재생을 유지하고, `PAUSED`이면 다시 `pauseVideo()`를 호출한다. 컨트롤바 탐색 직후의 일시적 `BUFFERING`을 일시정지로 오판하지 않기 위한 처리다.

---

## 즐겨찾기는 위폭·팁과 로그인 사용자 본인 행만 지원

**결정**: `맵 지명`을 제외한 위폭·팁 카드만 즐겨찾기를 제공한다. DB는 `(user_id, item_id)` 복합 PK와 본인 행 전용 SELECT/INSERT/DELETE RLS를 사용하며, 클라이언트에는 service role을 두지 않는다.

**정렬**: 각 태그와 전체 제목 검색에서 즐겨찾기를 먼저, 즐겨찾기끼리는 `created_at` 최신순으로 표시한다. 비즐겨찾기는 원본 `items` 순서를 유지한다.

---

## 그룹 A: 진영 없음(공통) 값은 NULL이 아니라 명시적 문자열 `'none'`

**결정**: `items.team` 컬럼은 계속 NOT NULL로 유지하고, CHECK 제약(`items_team_check`)을 `['red','blue']`에서 `['red','blue','none']`로 교체했다. 작업 착수 시점에 `items` 테이블 실제 데이터가 0건이어서 기존 NULL/예상 밖 값 마이그레이션 이슈가 없었다.

**이유**: NULL을 "공통"으로 취급하면 `item.team === null` 비교를 코드 곳곳에서 반복해야 하고, DB에 새로 들어오는 값이 실수로 NULL이 되는 경우와 "의도적으로 공통으로 지정한" 경우를 구분하기 어렵다. `'none'`이라는 명시적 값을 쓰면 `item.team === 'none'`처럼 다른 팀 값과 동일한 방식으로 비교할 수 있고, 예상 밖 값(둘 다 아닌 제3의 문자열)이 들어와도 "우연히 NULL이라 공통으로 보이는" 상황과 구분된다.

## 그룹 A: 맵 상세뷰 진영 뷰 확장(TOTAL/RED/BLUE/FAVORITE)

**결정**: 기존 팀 토글 2개(RED/BLUE)를 4개(TOTAL/RED/BLUE/FAVORITE)로 확장하면서, 새 상태 변수를 만들지 않고 기존 전역 변수 `currentTeam`을 뷰 상태(`'total'|'red'|'blue'|'favorite'`)로 그대로 확장해 재사용했다. `renderCards()`는 TOTAL이면 현재 맵의 전체 항목(레드/블루/공통 모두), FAVORITE이면 팀과 무관하게 로그인 사용자의 즐겨찾기 항목만, RED/BLUE면 기존처럼 해당 팀 항목만(공통 제외) 보여주도록 분기했다. 항목을 실제로 저장할 때 쓰는 팀 값은 `currentTeam`과 분리된 모달 전용 변수 `modalTeam`에서 가져온다(아래 항목 참고). 맵 진입 시 기본 뷰는 기존과 동일하게 RED를 유지한다.

**이유**: 프레임워크 없는 단일 HTML/바닐라 JS 구조에서 새 상태 변수·별도 렌더 경로를 추가하는 것보다, 이미 "현재 뷰가 무엇인지"를 나타내던 `currentTeam`의 값 범위만 넓히는 쪽이 최소 변경 원칙에 맞는다.

## 그룹 A: TOTAL/FAVORITE 카드의 진영 텍스트 배지

**결정**: TOTAL/FAVORITE 뷰의 카드에서만 타입 배지(영상/이미지) 바로 아래(`top:28px;left:8px`)에 진영 텍스트 배지를 스택으로 표시한다(RED/BLUE는 기존 `--red`/`--blue` 재사용, 공통은 `--muted` 배경 + 어두운 글자). `teamLabel(team)` 헬퍼가 `'red'`/`'blue'`/`'none'` 세 값만 명시적으로 매핑하고, 그 외 값(또는 예상치 못한 값)은 `null`을 반환해 배지를 그리지 않고 `console.warn`만 남긴다. RED/BLUE 뷰에서는 이 배지 자체를 표시하지 않는다.

**이유**: 지시서에서 "예상 밖 값이나 NULL을 공통으로 위장하지 말라"고 명시했고, DB CHECK 제약이 세 값만 허용하더라도(레코드를 대시보드에서 직접 수정하는 등) 클라이언트가 그 제약을 100% 신뢰할 근거는 없어 방어적으로 처리했다. 새 CSS 클래스 대신 기존 `.badge`에 인라인 스타일로 위치·색상만 얹어 최소 변경으로 구현했다.

## 그룹 A: 항목 추가 모달 `teamWrap`/`modalTeam` — `titleWrap`과 분리

**결정**: "공통" 항목을 만들 수 있는 최소한의 UI로, 항목 추가 모달에 RED/BLUE/공통 select와 전역 변수 `modalTeam`을 추가했다. `titleWrap` 안에 넣지 않고 별도 `teamWrap` 요소로 분리해, "맵 지명" 태그(제목·설명 입력 자체가 없고 미디어 단계에서 바로 저장됨)에서는 미디어 단계에 노출하고, "위폭"/"팁"(제목·설명 입력이 있는 상세 단계에서 저장)에서는 상세 단계에 노출하도록 `showModalStep()`에서 분기했다. 기본값은 모달을 RED/BLUE 뷰에서 열면 해당 팀이 자동 선택되고, TOTAL/FAVORITE 뷰에서 열면 선택 없음 상태로 시작해 `submitItem()`에서 미선택 시 저장을 차단하고 안내 메시지를 띄운다. `submitItem()`의 저장 값도 `team: currentTeam`에서 `team: modalTeam`으로 교체했다.

**이유**: `titleWrap`은 "맵 지명" 태그에서 항상 숨겨진 채로 미디어 단계에서 바로 저장까지 진행되는 구조라, 그 안에 팀 선택 필드를 넣으면 "맵 지명" 추가 시 팀을 고를 방법 자체가 사라진다. 저장 가능한 단계마다 별도로 노출 조건을 주는 것이 기존 2단계(media/details) 흐름을 건드리지 않는 가장 작은 변경이었다.

## 그룹 A: FAVORITE 뷰 비로그인 클릭 — 로그인 완료 후 자동 전환은 이번 범위 제외

**결정**: FAVORITE 버튼을 비로그인 상태로 누르면 기존 즐겨찾기 로그인 유도 confirm을 그대로 띄우고, 취소하면 `currentTeam`을 바꾸지 않고 리턴해 이전 뷰(RED/BLUE/TOTAL)와 버튼 활성 상태를 그대로 유지한다. 다만 지시서가 요구한 "로그인을 완료하면 그때 FAVORITE 뷰로 전환"은 이번 구현에 포함하지 않았다(사용자 확인 후 생략 확정).

**이유**: 이 프로젝트의 Discord 로그인은 `signInWithOAuth`로 외부 사이트로 나갔다 돌아오는 전체 페이지 리다이렉트 방식이라, 리다이렉트 후에는 `currentMap`/`currentTeam`을 포함한 모든 JS 메모리 상태가 초기화되고 항상 맵 그리드 화면으로 돌아간다. 기존 카드별 즐겨찾기 버튼의 로그인 유도도 동일한 이유로 로그인 후 맵을 복원하지 않는다. "로그인 완료 후 FAVORITE 뷰로 자동 전환"을 만들려면 로그인 시도 직전 현재 맵 ID·의도한 뷰를 `sessionStorage` 등에 저장했다가 재진입 시 복원하는 새로운 내비게이션 상태 지속화 장치가 필요한데, 이는 이 프로젝트에 아직 존재하지 않는 아키텍처 패턴이라 그룹 A 범위를 넘어선다고 판단해 사용자에게 확인 후 생략했다.

---

## 그룹 B: 붙여넣기 UI — 처음부터 "붙여넣기/파일 선택" 두 갈래 박스로 확정

**결정**: 기존에는 큰 "📋 붙여넣기" 버튼 하나만 먼저 보이고 "붙여넣지 않고 업로드"는 그 아래 작은 텍스트 링크였다. Claude(Chat) 설계 단계에서 이를 처음부터 동등한 비중의 점선 테두리 박스 2개(왼쪽 "붙여넣기"/오른쪽 "파일 선택")를 나란히 배치하는 시안으로 확정했다. 각 박스의 클릭 핸들러는 기존 `readAddClipboard()`/`document.getElementById('mImageFile').click()`을 그대로 재사용했고, Ctrl+V `paste` 이벤트 폴백과 "맵 지명" URL 차단 로직은 건드리지 않았다. 강조 색상은 새 CSS 변수를 만들지 않고 기존 `--red`만 hover 시 재사용했다(`--amber`/`--edit-accent` 사용 금지 — 편집모드 전용 강조색인 `--edit-accent`와 시각적으로 구분하기 위함, 위 "편집모드 전용 강조색" 결정 참고).

**이유**: "붙여넣기"가 항상 더 우선인 흐름을 유지하면서도, 클립보드 자동 판별이 지원되지 않는 브라우저·권한 거부 상황에서 파일 선택이 "안내 문구 뒤에 숨은 보조 수단"처럼 보이지 않도록 두 경로를 동등하게 노출해달라는 설계 요구를 반영했다. Codex 리뷰에서 `<div onclick>`은 키보드로 접근할 수 없다는 지적을 받아, 최종 마크업은 `<button type="button" class="paste-box">`로 구현했다(클릭 동작과 다이얼로그 안 레이아웃은 시안과 동일하게 유지, UA 기본 버튼 스타일만 CSS로 리셋).

## 그룹 B: `savePreviewWrap`을 `titleWrap`에서 분리 — `teamWrap`과 동일한 노출 시점 재사용

**결정**: 저장 미리보기 카드(`#savePreviewWrap`, 영상 썸네일+구간 배지 또는 크롭 이미지 썸네일 + `#mTeam`)를 `titleWrap` 안에 넣지 않고 별도 요소로 만들었다. 노출 조건은 기존 `teamWrap`이 이미 쓰고 있던 분기(`isMapLabel ? step === 'media' : step === 'details'`)를 `showModalStep()`에서 그대로 재사용해 `teamWrap`과 완전히 동일한 타이밍에 같이 뜨고 같이 숨긴다. `teamWrap`(`#mTeam` select) 자체는 DOM 위치만 `savePreviewWrap` 내부로 옮겼을 뿐, `id`/`onchange`/옵션/기본값·미선택 차단·저장값 로직은 전혀 바꾸지 않았다.

**이유**: "그룹 A: 항목 추가 모달 `teamWrap`/`modalTeam` — `titleWrap`과 분리" 결정과 같은 이유다 — `titleWrap`은 "맵 지명" 태그에서 항상 숨겨진 채 미디어 단계에서 바로 저장까지 진행되는 구조라, 미리보기를 그 안에 두면 "맵 지명"에는 저장 미리보기 자체가 노출될 방법이 사라진다. 이미 `teamWrap`이 이 두 갈래(맵 지명=media 단계 / 위폭·팁=details 단계) 노출 조건을 검증된 방식으로 쓰고 있었으므로, 새 조건을 따로 설계하는 대신 같은 조건식을 공유해 두 요소가 어긋나지 않게 했다.

**렌더 시점과 Cropper 콜백 추가**: 영상 미리보기는 지시서 요구대로 `showModalStep('details')` 진입 시 그 시점의 `modalType`/영상 URL/`clipStart`/`clipEnd`를 한 번만 읽어 `renderSavePreview()`로 렌더하고, 슬라이더나 `markClipStart`/`markClipEnd` 같은 개별 함수에는 추가 렌더 호출을 넣지 않았다(클립 조작 중 매 틱마다 미리보기를 갱신하지 않음). 이미지 미리보기는 이 규칙만으로는 "맵 지명" 흐름에서 문제가 생긴다 — `startImageFlow()`가 `showModalStep('media')`를 먼저 호출하고, `Cropper` 인스턴스는 그 이후 `FileReader.onload`에서 비동기로 생성되기 때문에 `showModalStep()` 안에서만 렌더하면 아직 존재하지 않는 `cropper`를 참조하게 된다. 이를 위해 `Cropper` 생성 옵션에 `ready`/`cropend` 콜백으로 `renderSavePreview()`를 추가로 연결했다 — "위폭"/"팁" 태그(이미지가 `details` 단계에서만 보임, 그 시점엔 이미 크롭이 끝난 상태)에는 중복 렌더일 뿐이지만, "맵 지명"(크롭이 끝나야 비로소 미리보기를 그릴 수 있는 `media` 단계에서 노출)에는 필수였다. Codex 리뷰에서 `cropper.getCroppedCanvas()`가 준비 전이면 `null`을 반환할 수 있다는 지적을 받아, `null`이면 이전 미리보기 이미지를 지우고 갱신을 건너뛰도록 방어 코드를 추가했다.

---

## 그룹 C: 저장된 항목 수정은 새 화면 대신 기존 "추가" 모달을 수정 모드로 재사용

**결정**: 별도의 수정 UI를 새로 만들지 않고, 기존 항목 추가 모달을 전역 `modalMode`(`'add'|'edit'`)로 분기해 "수정 모드"로도 재사용했다.

**이유**: 제목/설명/진영/클립구간 등 수정 대상 필드가 추가 모달이 이미 다루는 필드와 대부분 겹치고, `titleWrap`/`teamWrap`/`savePreviewWrap`/클립 슬라이더 등 그룹 A·B에서 확정한 레이아웃을 그대로 재사용할 수 있어 새 모달을 만드는 것보다 변경 범위가 훨씬 작다.

## 그룹 C: 수정 가능 필드는 메타데이터·클립구간으로 제한, 매체·타입·태그 변경은 삭제 후 재등록

**결정**: 수정 가능한 필드는 제목·설명·진영과(영상이면) 클립 구간뿐이다. 태그, 타입(영상↔이미지), 이미지 자체, 영상 URL은 수정 대상에서 제외했고 `submitItem()`의 update payload에도 포함하지 않는다. 이 값들을 바꾸고 싶으면 기존 `deleteItem()`으로 삭제 후 새로 등록하도록 안내한다.

**이유**: 저장된 매체(이미지 Storage 경로, 영상 URL)나 타입·태그를 바꾸는 기능은 업로드·크롭·Storage 정리 등 훨씬 큰 작업이 되고, 이미 있는 삭제+재등록 흐름으로 충분히 대체 가능하다.

## 그룹 C 후속: 클립 상태 리셋 범위, `mVideoUrl` 타입 확인 결과

**클립 상태 리셋**: `openAddModal()`은 수정 모드였는지와 무관하게 항상 호출되는 단일 진입점이며, `clipStart`/`clipEnd`/`clipEndMarkGraceUntil` null 리셋 → `applyClipDuration(0)` → `clipTools` 숨김 → `stopClipPreviewTimer()` → `clipYtPlayer` destroy+null → `updateClipLabel()` 순서의 리셋 블록을 이미 포함하고 있었다(그룹 C 구현 때 삭제된 적 없음 — `openEditModal()`에 임시로 추가했다가 `loadClipPlayer()`가 내부적으로 동일 리셋을 이미 수행하므로 제거한 중복 블록과 혼동하기 쉬워 확인 차 재검증했다). 반대로 `openEditModal()`은 이 블록을 타지 않고, `loadClipPlayer()`의 duration 확정 콜백에서 저장된 `clip_start`/`clip_end`를 복원한다. 브라우저에서 구간(0:10~0:40)이 있는 항목을 수정 모드로 열었다가 취소하고 곧바로 "추가" 모달을 다시 열어, `clipStart`/`clipEnd`가 `null`로, 슬라이더가 `[0,0]`으로 돌아오는 것을 확인했다.

**`mVideoUrl` 타입**: 이 필드의 HTML 기본값은 원래부터(붙여넣기 우선 흐름 도입 이전에는 `type="url"`인 적이 있었으나, 그 이후로는) `type="hidden"`이며, `type="url"`로 되돌아갈 히스토리상의 "원래 타입"은 아니다. 그룹 C에서 수정 모드 진입 시 읽기전용으로 노출하기 위해 `type="text"`로 바꿨던 것을, 이 필드가 유튜브 URL을 담는다는 의미에 더 맞고 기존 CSS(`input[type=url]`이 `input[type=text]`와 동일한 스타일 규칙을 이미 공유)에서도 차이가 없어 `type="url"`로 통일했다. `openAddModal()`/`closeModal()` 양쪽에서 `type="hidden"`으로 되돌리는 코드는 그룹 C 구현 시점부터 이미 있었다(수정 대상 아님). 브라우저에서 수정 모드 진입 시 `type` 값이 `"url"`로 바뀌고, 취소 후 "추가" 모달을 다시 열면 `"hidden"`으로 정확히 복원되는 것을 확인했다.

---

## 그룹 D 1단계: 항목 클릭수 추적 스키마 + 기록 로직

**결정**: 클릭수를 "카운터 컬럼"이 아니라 `item_clicks` 이벤트 로그 테이블(클릭마다 새 행)로 쌓는다. `user_id`는 로그인 사용자만 채우고 비로그인 클릭은 `null`로 익명 카운트한다. INSERT는 `anon`/`authenticated` 모두 허용하되 `user_id is null or user_id = (select auth.uid())`로 타인 사칭만 막고, SELECT는 `admins` 등록 사용자만 허용한다. 기록 함수 `trackClick(itemId)`는 `openOverlay(id)` 최상단에서 `void trackClick(id)`로 fire-and-forget 호출해, 카드 종류(전체 검색/상세/즐겨찾기)와 무관하게 `openOverlay`를 거치는 모든 진입점에서 자동으로 기록되게 했다. 실패(응답 에러·네트워크 예외 둘 다)는 `console.warn`만 남기고 `alert`을 띄우지 않는다 — 클릭 기록 실패가 카드 열람을 막으면 안 되기 때문이다. RLS 조건은 `favorites`가 이미 쓰던 `(select auth.uid())` 감싸기 패턴을 그대로 따랐다(동작은 `auth.uid()` 직접 호출과 동일, 대량 행에서 재평가 비용을 줄이는 최신 권장 패턴).

**이유**: 이벤트 로그 방식은 "언제 클릭했는지"(추후 기간별 집계, 유저별 선호 맵 분석)까지 보존하지만 카운터 컬럼은 총합만 남긴다. 1단계 목표가 "집계용 원본 데이터를 쌓기 시작하는 것"이라 로그 방식이 맞다. fire-and-forget + 조용한 실패 처리는 클릭 기록이 부가 기능(텔레메트리)이지 핵심 기능(오버레이 열람)이 아니기 때문 — 오버레이가 열리는 속도나 성공 여부가 클릭 기록에 좌우되면 안 된다.

**알려진 한계(문서화만 하고 이번 범위에서 추가 방어 안 함)**: 이 RLS는 타인의 `user_id`로 스푸핑하는 것은 막지만, 로그인한 사용자가 고의로 `user_id: null`을 보내 자기 클릭을 익명 처리하는 것까지는 막지 못한다. 서버 사이드 세션 검증(예: Edge Function을 거쳐서만 INSERT 허용) 같은 방어는 2단계(대시보드) 이후 필요성이 확인되면 별도로 검토한다.

---

## 2단계: 진영 선택 로직 변경 — "공통" 옵션 제거 + 미선택 시 자동 공통 저장 (그룹 A 결정 대체)

**결정**: 위 "그룹 A: 항목 추가 모달 `teamWrap`/`modalTeam`" 문단에서 확정했던 "미선택 시 저장 차단 + 안내 메시지" 동작을 뒤집었다. `mTeam` select에서 `<option value="none">공통</option>`을 삭제하고 placeholder를 "선택 안 함 (공통)"으로 바꿔, 아무것도 고르지 않으면 공통으로 저장된다는 것을 UI 문구에서 바로 알 수 있게 했다. `submitItem()`의 `if(!modalTeam){...return;}` 차단문을 제거하고, 저장 직전 `const savedTeam = modalTeam || 'none';`을 한 번만 계산해 edit update·vid insert·img insert 세 경로 모두 이 값을 재사용한다. 이 변경은 **항목 추가 모달(`modalMode === 'add'`)에만** 적용된다 — `openAddModal()`이 `currentTeam`에 따라 RED/BLUE를 자동 선택하던 로직도 함께 제거해, TOTAL/RED/BLUE/FAVORITE 어느 뷰에서 열든 항상 미선택 상태로 시작한다.

**수정 모달(그룹 C)은 변경하지 않는다**: `openEditModal()`은 기존처럼 `modalTeam = it.team`을 그대로 대입한다. 저장된 값이 `'red'`/`'blue'`면 select에 그 옵션이 남아있어 그대로 선택되어 보인다. 저장된 값이 `'none'`이면 이제 select에 해당 `<option>` 자체가 없으므로, `select.value = 'none'`(존재하지 않는 옵션 값)을 대입해도 브라우저가 자동으로 `selectedIndex = -1`(빈 값)로 처리해 미선택 상태로 표시된다 — 별도 분기 코드 없이 네이티브 동작만으로 의도한 결과가 나오는 것을 브라우저에서 직접 확인했다. 이 상태로 다시 저장해도 `modalTeam` 변수 자체는 여전히 `'none'`이므로(사용자가 select를 직접 건드리지 않는 한) `savedTeam` 계산 결과도 그대로 `'none'`이라 값이 바뀌지 않는다.

**이유**: 그룹 A 시점에는 "진영을 명시적으로 고르게 강제"하는 쪽이 안전하다고 판단했지만, 실사용 중 미선택이 잦고 매번 안내 메시지에 막히는 것이 번거롭다는 문제 제기로 방향을 바꿨다. "선택 안 함 = 공통"을 UI 문구로 명시하는 것으로 오해 가능성을 줄이고, 대신 저장을 막지 않는 쪽을 택했다. 수정 모달에서 로직을 건드리지 않은 이유는, `'none'` 항목을 다시 열었을 때 select가 자연히 빈 값으로 보이는 브라우저 기본 동작만으로 요구사항이 충족되어 추가 분기가 불필요했기 때문이다. `items.team` CHECK 제약(`'red'|'blue'|'none'`)과 RLS는 그룹 A에서 이미 `'none'`을 허용하도록 되어 있어 이번 변경에서 스키마를 건드리지 않았다.

---

## 2단계: 제목/설명 글자수 제한 — 실측 기반 `maxlength` 산정

**측정 방법**: "적당해 보이는" 값을 임의로 고르지 않고, 실제 렌더링된 `.card .meta .title`/`.note` 요소에 한글 반복 문자열(`'가'.repeat(n)`)을 직접 대입해 `scrollWidth`/`offsetHeight`를 실측했다. 혼합 문자열이 아니라 한글만 쓴 이유는 한글이 영문보다 글자당 폭이 넓어 더 보수적인(짧은) 기준이 나오기 때문이다. 말줄임 CSS(작업 2)를 적용하기 전에 측정해야 임계점이 가려지지 않는데, 실제로 CSS 적용 전 `.title`은 `white-space:nowrap`이 없어 텍스트가 자동으로 줄바꿈되므로 `scrollWidth`가 절대 `clientWidth`를 넘지 않는다는 것을 먼저 확인했다(1~40자 전부 overflow 없음). 그래서 요소에 측정 전용 임시 인라인 스타일 `white-space:nowrap`만 걸어(말줄임 `overflow:hidden`/`text-overflow:ellipsis`는 아직 안 건 상태) "한 줄로 쭉 이어졌을 때"의 자연스러운 폭을 측정한 뒤, 측정이 끝나면 원래 텍스트와 인라인 스타일을 복원했다.

**카드 폭 대표값 선정**: `auto-fill minmax(220px,1fr)` 그리드 특성상 뷰포트 폭에 따라 카드 폭이 들쭉날쭉하다(실측: 1920px→225px, 1440px→236px, 1280px→204px, 1024px→202px, 900px→242px, **768px→198px(최소)**, 600px→234px, 480px→375px, 390px→285px, 320px→215px). 가장 좁아 가장 불리한 768px 뷰포트(title 요소 `clientWidth: 198px`)를 기준으로 삼았다 — 이보다 넓은 카드는 전부 여유가 더 있어 안전한 쪽이다.

**제목 실측 결과**: 768px 뷰포트, `.card .meta .title`(`clientWidth: 198px`)에서 `white-space:nowrap`만 임시로 걸고 `'가'`를 1자씩 늘려가며 측정. **15자까지 `scrollWidth === clientWidth === 198px`로 안 넘치다가, 16자에서 `scrollWidth: 199px > clientWidth: 198px`로 처음 넘쳤다.** 여기서 여유 2자를 두고 **`maxlength="14"`**로 정했다.

**설명 실측 결과**: 같은 768px 뷰포트, `.card .meta .note`(`clientWidth: 198px`, `line-height` 계산값 `17.25px`, 2줄 기준선 `34.5px`)에서 동일한 방식으로 측정. **36자까지 `offsetHeight: 35px`(2줄에 정확히 맞음)였다가, 37자에서 `offsetHeight: 52px`(3줄째로 넘어감)로 처음 2줄을 초과했다.** 여기서 여유 2자를 두고 **`maxlength="35"`**로 정했다.

**검증**: 각 최댓값(제목 14자, 설명 35자)으로 실제 카드를 렌더링해 768px 뷰포트에서 `.title`의 `scrollWidth(198px) === clientWidth(198px)`(안 넘침, 1줄 유지)이고 `.note`의 `offsetHeight(35px) === scrollHeight(35px)`(2줄에서 멈춤, 3줄로 안 넘어감)임을 실측으로 재확인했다. 390px(모바일) 뷰포트에서는 카드 폭이 오히려 더 넓어져(285px) 넘치지 않는 것도 함께 확인했다.

**결정**: `<input id="mTitle" maxlength="14">`, `<textarea id="mNote" maxlength="35">`를 적용하고, `updateTextCounters()`가 `value.length`(브라우저 `maxlength`와 동일한 UTF-16 코드 유닛 단위)로 `N/최댓값` 카운터를 표시한다. 이 함수는 입력 이벤트(`oninput`)뿐 아니라 `openAddModal()`(값을 빈 문자열로 리셋한 직후)과 `openEditModal()`(저장된 값을 불러온 직후)에서도 호출해, 모달을 열자마자 정확한 초기 카운터가 보이도록 했다. 이모지 등 서로게이트 페어가 2자로 계산되는 것은 지시서에서 명시한 알려진 한계로 남겨두고 별도 처리하지 않았다(Codex 리뷰에서도 동일하게 확인, 요구사항과 합치).

**기존 값 자동 절단 금지**: `openEditModal()`이 `mTitle.value`/`mNote.value`에 DB에서 불러온 값을 프로그래밍적으로 대입하는 것은 `maxlength`의 적용 대상이 아니다(브라우저의 `maxlength`는 사용자 타이핑/붙여넣기만 제한하고 `.value` 대입은 제한하지 않는다) — 이 네이티브 동작을 그대로 이용했고 별도 방어 코드를 추가하지 않았다. 실제로 Supabase에 기준을 초과하는 더미 항목(제목 19자·설명 36자)을 INSERT해 수정 모달로 열어본 결과, `mTitle.value.length === 19`/`mNote.value.length === 36`으로 잘리지 않고 그대로 로드되며 카운터도 `19/14`, `36/35`(초과 상태)로 정확히 표시되는 것을 확인한 뒤 사용자 승인을 받아 삭제했다. 실제 기존 DB(`items` 테이블, 이 작업 시점 기준)에는 이 기준을 초과하는 실사용 데이터가 없었다(SELECT로 확인).

**이유**: 카드 그리드가 `auto-fill minmax(220px,1fr)`라 뷰포트에 따라 폭이 계속 바뀌는 구조라, 모든 폭에서 완벽히 맞는 하나의 숫자는 존재하지 않는다. 그래서 실측 가능한 뷰포트 중 가장 불리한(좁은) 경우를 기준으로 보수적인 값을 잡고, 그보다 넓은 카드에서는 항상 여유가 있도록 설계했다. `items.title`/`items.note`는 DB 레벨 길이 제한이 없는 `text` 컬럼이라(`docs/DATABASE.md` 참고), 이번 `maxlength`는 순수하게 클라이언트 입력 단계의 방어이며 DB 자체에 강제되지 않는다.

---

## 2단계: 카드 그리드 고정 브레이크포인트 전환 (위 "유동 그리드 최악 폭 기준" 결정을 대체)

**대체 이유**: 바로 위 문단의 `maxlength=14/35`는 유동 그리드(`auto-fill minmax(220px,1fr)`)에서 "카드가 가장 좁아지는 극단적 상황"(768px 뷰포트, 카드 198px)을 기준으로 잡은 값이었다. 이 방식 자체는 유효했지만, 일반 PC 화면에서는 카드가 오히려 훨씬 넓어져(예: 1280px에서 204px가 아니라 열 개수가 자동으로 늘어나며) 여백이 과도하게 남는 문제가 있었다. 그래서 유동 그리드를 버리고 PC/태블릿/모바일 3단계 고정 열 구조로 바꿨고, 이에 따라 "가장 좁은 경우"가 아니라 "PC 구간의 실제 카드 폭"을 기준으로 글자수 제한도 다시 산정해야 했다.

**PC 브레이크포인트 실측 근거**: `body`/`.view`의 좌우 패딩(`padding:28px 32px` → 좌우 각 32px, 합 64px)과 `.card-grid-inner`의 `gap:16px`(4개 간격 = 64px)를 코드에서 직접 확인했다(추측 아님). 목표 카드 폭 250~260px 구간에서 계산이 깔끔한 **256px**를 택해 `필요 폭 = 256×5 + 64 + 64 = 1408px`을 PC 브레이크포인트로 확정했다. `.card-grid-inner` 자신은 이미 부모 `.view`의 패딩을 지나 렌더링되므로, 그 안에서 정확히 256px×5열이 나오려면 `.card-grid-inner`의 `max-width`는 패딩을 뺀 `1408-64=1344px`여야 한다(이 둘을 혼동하면 안 된다 — 브레이크포인트 1408px은 미디어 쿼리 조건, max-width 1344px은 그리드 자신의 상한). 실측으로 1409px 이상 전 구간(1409/1500/1920/2560px)에서 카드 폭이 정확히 256px로 고정되고 그리드 폭도 1344px로 고정되는 것을, 1408px 이하에서는 미디어 쿼리가 즉시 3열로 전환되는 것을 Playwright로 확인했다.

**태블릿(3열)**: 범위는 `600px < 뷰포트 ≤ 1408px`(태블릿 상한이 더 이상 1024px 고정이 아니라 PC 브레이크포인트에 연동됨). 이 구간 안에서는 카드 폭이 뷰포트에 비례해 계속 바뀌며(601px에서 약 163px까지 좁아짐), 별도의 목표 폭을 두지 않았다 — 지시서에 태블릿 폭 목표가 없었고, 3열이라는 열 개수 고정만 요구됐기 때문이다.

**모바일(1열) 채택 근거**: 실제로 390px 뷰포트에서 1열/2열을 스크린샷으로 비교했다. 1열은 썸네일이 크게 보이는 리스트형 UI로 자연스러웠고, 2열은 카드 폭이 좁아져 짧은 실제 제목("신맵 박스 위폭 모니터링용...")조차 이미 말줄임이 걸릴 정도로 좁았다. "휑해 보이면 2열 검토"라는 지시서 기준에 비춰봐도 1열이 휑하지 않고 오히려 자연스러워, **1열을 최종 채택**했다(2열 검토 후 기각).

**`renderGlobalTitleSearch()` 그리드 공유 버그 발견 및 수정**: 코드로 확인한 결과 `renderGlobalTitleSearch()`는 `#mapGrid`(정적 마크업상 `class="map-grid"`, 지도 선택 화면 전용 그리드)에 `.card` 목록을 직접 채워 넣고 있어서, 검색 결과 카드가 `.card-grid-inner`가 아니라 `.map-grid`의 `auto-fill minmax(280px,1fr)` 그리드 규칙을 그대로 상속받고 있었다(이번 작업 전부터 있던 기존 버그). 새 클래스를 만들지 않고, `renderGlobalTitleSearch()` 진입 시 `grid.className = 'card-grid-inner'`로 바꾸고 `renderMapGrid()` 진입 시 `grid.className = 'map-grid'`로 복원하는 방식으로 기존 두 클래스를 그대로 재사용했다. Codex 리뷰에서 `loadAll()`의 초기화 실패/데이터 로드 실패/요청 예외 3개 분기가 `innerHTML`만 바꾸고 `className`은 리셋하지 않아, 로딩 중 검색으로 클래스가 바뀐 상태에서 에러가 나면 에러 메시지가 `card-grid-inner` 클래스인 채로 남는 엣지 케이스를 지적받아, 세 곳 모두에 `grid.className = 'map-grid';`를 추가해 반영했다.

**PC 카드 폭 기준 글자수 재실측**: 같은 방법론(한글 반복 문자열, 말줄임 CSS가 실제로 측정을 가리지 않도록 임시로 무력화한 뒤 측정 — `.title`은 `white-space:nowrap`이 이미 적용돼 있어 그대로도 측정 가능했지만, `.note`는 이전 작업에서 이미 `-webkit-line-clamp:2`가 적용돼 있어 `offsetHeight`가 2줄에서 인위적으로 막혀 있었다. 측정 동안만 `display:block;-webkit-line-clamp:unset;overflow:visible`로 임시 해제한 뒤 측정하고 원래 상태로 복원했다)을 새 PC 카드 폭 기준으로 재실행했다. 고정 그리드 덕분에 PC 구간 전체(1409~2560px)에서 `.title` 요소의 `clientWidth`가 항상 230px로 일정해, 여러 뷰포트를 스캔할 필요 없이 이 값 하나로 측정했다. **제목**: 18자까지 `scrollWidth === clientWidth(230px)`이다가 19자에서 `scrollWidth 236px`로 처음 초과 → 여유 2자로 `maxlength=17`. **설명**: `line-height 17.25px` 기준 2줄(34.5px) 경계에서 42자까지 `offsetHeight 35px`이다가 43자에서 `52px`(3줄)로 처음 초과 → 여유 2자로 `maxlength=41`. 각각 17자/41자로 렌더링해 PC에서 말줄임 없이 정확히 들어맞는 것과, 601px(태블릿 하한)처럼 더 좁은 폭에서는 같은 17자 제목이 실제로 말줄임 처리되는 것(의도된 정상 동작)을 함께 확인했다. 이 시점 기준으로도 기존 DB에는 새 기준(17/41)을 초과하는 실사용 데이터가 없었다(SELECT 재확인).

**이유**: 그리드를 고정 폭으로 바꾼 이상, 더 이상 "가장 불리한 폭"을 찾을 필요가 없어졌다 — PC 구간은 항상 정확히 256px(제목 요소 230px)이므로 그 값 하나로 결정론적인 기준을 잡을 수 있다. 태블릿/모바일에서는 카드가 이보다 좁아질 수 있어 말줄임표가 뜰 수 있지만, 이는 `.card .title`/`.note`의 CSS 안전장치(1줄/2줄 말줄임)가 그대로 담당하므로 별도로 막지 않았다.

---

## 2단계: 라이트/다크 테마 토글

**전환 방식**: CSS 변수(`:root`) + `data-theme` 속성 + `localStorage` 3단 조합으로 구현했다. 다크 팔레트는 기존 `:root`에 그대로 두고, `:root[data-theme="light"]`에 라이트 팔레트를 오버라이드로만 추가했다(다크가 여전히 "속성 없음"이라는 기본 상태). `toggleTheme()`이 `document.documentElement`의 `data-theme` 속성을 붙였다 뗐다 하고 `localStorage`(키 `sa-theme`)에 저장하며, `<head>`의 `<meta charset>` 바로 다음(모든 CSS/DOM 렌더링보다 먼저)에 동기 인라인 스크립트를 두어 저장된 값이 `'light'`일 때만 속성을 미리 설정한다 — 값이 없거나 `'dark'`면 아무 것도 하지 않아 기본값(다크)이 자연스럽게 유지된다. 이 스크립트가 CSS 파싱/첫 페인트보다 먼저 실행되어야 다크→라이트 전환 깜빡임(FOUC)이 없는데, Playwright로 `page.reload({waitUntil:'commit'})` 시점(첫 페인트 직전)에 이미 `data-theme`이 반영돼 있는 것을 확인해 이 순서를 검증했다.

**포인트 컬러 고정 원칙**: `--red`/`--blue`/`--amber`/`--edit-accent`/`--green`/`--edit-accent-ink`는 라이트 테마 블록에서 오버라이드하지 않는다. RED/BLUE 배지, 즐겨찾기 별, 편집모드 강조색처럼 "브랜드 정체성"에 해당하는 색은 다크/라이트 어느 쪽에서 봐도 동일해야 사용자가 같은 서비스로 인지할 수 있다는 지시서 방향을 그대로 따랐다. 이 색들 위에 얹히는 `#fff` 텍스트(`.badge.vid/img/short`, `discord-btn:hover`, `teamBadge()`의 JS 인라인 색상)도 함께 고정해야 대비가 유지되므로 건드리지 않았다 — 이 값들은 "호버 반전 대상"이 아니라 "포인트 컬러 배경 위 텍스트"로 분류해 `var(--hover-invert)`로 바꾸지 않았다.

**`#FFFFFF`/`#fff` 전수 분류 결과**:
- 호버/포커스 반전(→ `var(--hover-invert)`로 교체): `.map-tile:hover`, `.detail-search:focus`, `.card:hover`, `.back-btn:hover`
- 로고(`.reticle`의 border/`::before`/`::after`): 지시서에 따라 건드리지 않음. 라이트 테마에서 실제로 `rgb(255,255,255)` 그대로 유지되는 것을 확인했고, 흰 배경 위 흰 로고가 잘 안 보이는 부작용도 실제로 나타남(스크린샷으로 확인) — 코드는 고치지 않고 이 결정만 기록한다. 로고를 라이트 테마에서 어떤 색으로 바꿀지는 별도 디자인 판단이 필요해 이번 범위 밖이다.
- 포인트 컬러 배경 위 텍스트(그대로 유지): `.badge.vid`/`.badge.img`(red/blue 배경)/`.badge.short`(보라 배경), `.discord-btn:hover`(red 배경), JS `teamBadge()`의 `'#fff'`(red/blue 배경)
- 미디어 오버레이(그대로 유지): `.playicon`/`.playicon::before`, `.overlay-playpause`, `.save-thumb-badge`

**하드코딩 어두운 배경/색상 전수 목록 및 처리**:
- **버그로 판단해 교체**: `.modal-body input[type=text|url]/textarea/select`, `.modal-body input[type=file]`, `.clip-range-track`, `.clip-btns button`이 `background:#0D1013`(고정)과 `color:var(--text)`(라이트에서 뒤집힘)를 같이 써서 라이트 테마에서 다크온다크(글자가 안 보임)가 되는 실제 버그였다. 전부 `var(--bg)`로 교체. 슬라이더 thumb의 `border:2px solid #0A0C0F`도 배경과 시각적으로 짝을 맞추기 위해 `var(--bg)`로 함께 교체. `header{background:linear-gradient(180deg,#0D1013,#0A0C0F)}`도 헤더 텍스트가 `var(--text)`를 상속해 같은 이유로 버그였는데, 원래 두 색의 차이가 3~4/255로 극히 미세해 그라디언트를 유지할 실익이 없어 `var(--bg)` 단색으로 단순화했다(다크 테마에서 시각적 차이가 없음을 스크린샷으로 확인).
- **미디어 영역이라 유지**: `.overlay-media`/`.save-thumb-16x9`/`.save-thumb-sq`/`.clip-player`의 `background:#000`, `.card-del`/`.card-edit`/`.tile-actions span`/`.overlay-playpause`/`.save-thumb-badge`의 `rgba(6,7,9,...)` 오버레이 배경, `.card-fav`의 `text-shadow:rgba(0,0,0,.6)`, `.thumb`/`.map-thumb`(6종)의 그라디언트 placeholder — 전부 실제 이미지/영상이 렌더링되거나 그 자리를 대신하는 미디어 영역이라 콘텐츠 가독성을 위해 다크로 남겼다.
- **대비 문제 없어 유지(판단 후 미변경)**: `.subbar .sep`/`.map-thumb .no-img`/썸네일 placeholder 텍스트의 `color:#3A4048`, `.site-footer`의 `color:#4A515B`, `.hint`의 `color:#5A626D`. 셋 다 라이트 배경 위에서도 대비가 충분해(계산상 7:1 이상) 읽는 데 문제가 없고, 미디어 placeholder 위 텍스트(`#3A4048` 두 곳)는 배경 자체가 유지 대상이라 자연히 그대로 둬야 한다. 톤의 "무게감"이 두 테마에서 살짝 달라 보일 수 있다는 점만 알려진 사소한 차이로 남긴다.
- **모달 스크림(`.modal{background:rgba(6,7,9,.9)}`)**: 미디어 영역은 아니지만, 모달 뒤 배경을 어둡게 딤 처리하는 것은 라이트/다크 관계없이 흔한 UI 패턴이라 유지했다. 모달 콘텐츠 자체(`.modal-box`)는 이미 `var(--panel)`로 테마에 맞게 반응한다.

**로그인/로그아웃 반복 시 토글 버튼 생존**: `#themeToggleBtn`을 `renderAuthArea()`가 통째로 갈아엎는 `#authArea`의 자식이 아니라 같은 `.status` 안의 형제 요소로 추가했다. `renderAuthArea(null)`을 5회 연속 호출해도 버튼이 사라지지 않고 아이콘·클릭 핸들러가 그대로 유지되는 것을 확인했다 — `authArea.contains(toggle) === false`라는 구조적 사실 자체가 이 안정성을 보장한다.

**이유**: 프레임워크 없는 단일 HTML 구조에서 별도 테마 상태 관리 라이브러리 없이 CSS 커스텀 프로퍼티만으로 전체 팔레트를 뒤집을 수 있어 최소 변경으로 구현할 수 있었다. `data-theme` 속성 + `localStorage` 조합은 이 프로젝트에 이미 있던 패턴(`editMode`처럼 전역 상태를 두고 필요한 곳에서만 참조)과 결이 같아 새로운 아키텍처를 들이지 않았다.

## 2단계: 테마 토글 후속 보완 — 로고 반전 + 스위치 UI

**로고 반전 결정**: 이전 테마 토글 작업에서는 `.reticle` 로고의 `#FFFFFF`를 "별도 디자인 판단 필요"로 남겼지만, 라이트 테마 실사용 확인 결과 흰 배경 위 흰 로고가 보이지 않는 문제가 명확했다. 그래서 `.reticle`의 `border`와 `::before`/`::after` 배경을 기존 `--hover-invert`로 교체했다. 다크 테마에서는 기존처럼 흰색, 라이트 테마에서는 `#0A0C0F`로 반전되어 새 변수를 추가하지 않고 문제를 해결한다.

**토글 UI 변경**: 기존 이모지 텍스트 토글(`☀️`/`🌙`)은 상태 표현이 텍스트 아이콘에 의존해 헤더 버튼들과 시각 밀도가 맞지 않았다. 같은 위치(`#authArea`의 형제 요소)는 유지하되 pill 형태의 `role="switch"` 버튼과 원형 손잡이로 바꿨다. 손잡이는 다크 테마에서 오른쪽, 라이트 테마에서 왼쪽으로 이동한다. `aria-checked="true"`는 `data-theme="light"`가 켜진 상태를 뜻하도록 정했다.

## 2단계: 카드 그리드 7열 후속 조정

**결정**: 넓은 PC 화면에서는 카드 그리드를 5열에서 **7열**로 바꿨다. 1920px 뷰포트에서 임시 렌더링한 결과 7개 카드가 한 줄에 들어가고, 카드 폭이 약 249px으로 유지되며 가로 잘림/비율 변형/제목 overflow가 없었다.

**구현 기준**: `.card-grid-inner`는 `grid-template-columns:repeat(7, 1fr)`와 `max-width:1840px`를 사용한다. `.view` 좌우 패딩 64px + gap 16px×6개(96px) + 카드 약 249px×7개 기준으로 총 1903px 안팎이 필요하므로, 1904px 이하에서는 기존처럼 3열로 전환한다. 600px 이하는 기존 모바일 결정대로 1열을 유지한다. 기존 `maxlength`는 230px PC 실측 기준으로 이미 249px 카드보다 보수적이라 재산정하지 않았다.

---

## 그룹 E 1단계: 유튜브 채널명 수집 + 저장

신규 영상 등록 시 API 키가 필요 없는 YouTube oEmbed의 `author_name`을 `items.channel_name`에 저장한다. YouTube Data API와 새 라이브러리는 도입하지 않는다.

oEmbed 조회 실패는 영상 저장을 막지 않고 `null`로 처리한다. 기존 항목 소급 수집과 채널명 검색 UI는 후속 단계로 남기며, 수정 모달은 `channel_name`을 갱신하지 않는다.

## 그룹 E 2~3단계: 채널명 표시 UI + 소급 수집 + 통합 검색

**추가 모달엔 채널명 칸을 넣지 않은 이유**: 채널명은 URL을 입력한 시점이 아니라 실제 `insert()` 시점에 `fetchYouTubeChannelName()`으로 조회된다(그룹 E 1단계). 추가 모달에 미리 칸을 두면 URL 입력 시점에 별도로 oEmbed를 한 번 더 호출하거나, 저장 전 임시 상태를 만들어 화면에 보여줘야 해서 왕복(호출)이 늘고 로직이 복잡해진다. "수정" 모달은 이미 DB에 저장된 `channel_name`을 그대로 읽어 보여주기만 하면 되므로 `openEditModal()`에만 `#editChannelWrap`(🔒 채널 + readonly input)을 추가했다. `showModalStep()`에서 `modalMode==='edit' && modalType==='vid'`일 때만 노출하도록 중앙에서 한 번에 제어해 이미지/맵 지명/추가 모달에는 나타나지 않는다. `channel_name`이 `null`이면 "채널명 없음"을 표시하고, `submitItem()`의 수정 payload에는 여전히 포함하지 않는다(그룹 E 1단계 결정 유지).

**소급 수집을 MCP + 임시 스크립트 조합으로 처리한 이유**: Supabase 접속 정보(anon key)를 임시로 작성한 로컬 Node 스크립트에 넣고 싶지 않았다. 그래서 조회·UPDATE는 모두 Claude Code가 Supabase MCP로 직접 실행하고, 임시 스크립트(`backfill-channel-names.js`, 작업 후 삭제)는 대상 `id`/`video_url` 목록을 하드코딩으로 받아 YouTube oEmbed만 순차 호출해 `{id, channel_name}` 목록을 만드는 역할만 맡았다. 요청 간 400ms 지연과 10초 타임아웃(`AbortController`)을 둬서 응답이 느리거나 삭제된 영상이 있어도 전체 작업이 멈추지 않게 했다. 이번 실행 대상은 2건(`6a9be733-...`, `e5d61592-...`)이었고 둘 다 조회 성공, 실패 0건. `channel_name IS NULL` 조건이 이미 재실행 시 완료된 행을 자동 제외하므로 별도 멱등성 처리는 추가하지 않았다.

**검색 통합 방식**: 상세 뷰(`renderCards()`)와 첫 화면 전체 검색(`renderGlobalTitleSearch()`) 양쪽의 검색 필터 조건에 `String(it.channel_name ?? '').toLowerCase().includes(query)`를 OR로 추가했다. 별도 검색창을 새로 만들지 않고 기존 제목 검색 입력을 그대로 재사용했다(placeholder를 "제목 또는 채널 검색" 계열로 변경). `channel_name`이 `null`인 항목은 빈 문자열로 처리돼 채널명 매칭에서 자연히 제외된다.

**이스케이프 처리**: `channel_name`은 YouTube oEmbed가 돌려주는 외부(비신뢰) 문자열이라, 카드 배지에 `innerHTML` 템플릿으로 꽂기 전에 새로 추가한 `escapeHtml()`로 이스케이프한다. 수정 모달의 채널명 칸은 `innerHTML`이 아니라 `<input readonly>`의 `.value`에 대입하는 방식을 택해 애초에 HTML 파싱 경로를 타지 않으므로 이스케이프가 필요 없다(더 안전한 API를 우선 선택). 참고로 기존 카드 템플릿의 `title`/`note`는 이번 작업 범위가 아니라 손대지 않았지만, 마찬가지로 이스케이프 없이 `innerHTML`에 꽂히고 있다는 점을 확인했다 — 다만 두 필드 모두 편집모드 관리자가 직접 입력하는 값(외부 유래 아님)이라 이번 작업의 위험도와는 다르다.

---

## 재생 볼륨 기억 + 클립 재생 중 구간 내 탭 시크 진행바

**폴링 방식을 택한 이유**: YouTube IFrame API는 `onVolumeChange` 같은 이벤트를 제공하지 않는다. 볼륨/음소거 변경을 감지할 유일한 방법은 `getVolume()`/`isMuted()`를 주기적으로 확인하는 것뿐이라, 기존 클립 반복 판정에 쓰던 250ms 타이머를 `overlayTimer`로 이름을 바꿔(클립 재생뿐 아니라 "전체 영상 보기"에서도 도는 범용 타이머가 됐으므로) 볼륨/음소거 폴링·클립 구간 반복 판정·시크바 값 갱신을 한 곳(`pollOverlayPlayer()`)에서 함께 처리한다. 값이 바뀐 경우에만 `localStorage`에 쓴다(매 tick 무조건 쓰기 금지).

**일반 영상(`<iframe>`)을 범위에서 제외한 이유**: 구간 미지정 일반 영상은 `<iframe src="...">`로 직접 임베드되어 YouTube IFrame API(`YT.Player`)의 제어 대상이 아니다. 여기에 볼륨 기억·시크바를 적용하려면 임베드 방식 자체를 `YT.Player`로 바꿔야 해서 이번 범위를 벗어난다고 판단했다. 클립 재생과 "전체 영상 보기"는 둘 다 이미 `YT.Player` 인스턴스라 폴링이 그대로 동작한다.

**볼륨/음소거를 분리 저장한 이유(`sa-volume`/`sa-muted`)**: `getVolume()`은 음소거 중에도 음소거 전의 실제 볼륨값을 그대로 반환한다. 하나의 키에 합쳐 저장하면 "음소거인데 마지막 볼륨이 몇이었는지"를 구분할 수 없어, 두 값을 별도 키로 저장하고 각각 독립적으로 폴링·검증한다. `sa-volume`은 저장된 값이 숫자가 아니거나 범위(0~100) 밖이면 50으로 폴백하되, 0은 "값 없음"으로 오인하지 않고 그대로 유지하도록 `Number.isFinite` + 명시적 범위 비교로 검증한다(진위 판정 대신 명시적 비교를 쓴 이유는 `if(!num)`처럼 falsy 체크를 하면 0이 걸러지는 실수를 막기 위함).

**커스텀 `div` 대신 네이티브 `<input type="range">`를 택한 이유**: 클릭·터치·키보드 조작을 모두 기본으로 처리해 별도의 클릭 좌표 계산이나 터치 이벤트 핸들러가 필요 없다. 시각 스타일은 완전히 새로 그리는 대신 이미 쓰고 있던 `--edit-accent` 변수를 `accent-color`로 재사용해 새 CSS 변수 추가 없이 톤을 맞췄다(편집모드 클립 지정 슬라이더처럼 pseudo-element로 완전히 커스텀 스킨하는 방식은 이번 범위에서 쓰지 않았다 — 시청자용 재생 위치 이동은 그 정도 커스터마이징이 필요 없다고 판단).

**테스트 중 발견한 버그와 수정**: 실제 브라우저(Playwright)로 검증하는 중, 음소거를 누른 직후 곧바로 볼륨 슬라이더를 조작하면 자동 해제가 실패하는 경우를 발견했다. `ytPlayer.mute()`/`isMuted()`는 postMessage 기반이라 호출 직후 짧은 순간은 값이 갱신되지 않는데, 볼륨 슬라이더의 자동 해제 로직이 그 순간의 `ytPlayer.isMuted()`를 직접 읽어 판단하고 있었기 때문이다. 원격 API를 그때그때 조회하는 대신, 우리가 직접 추적하는 로컬 상태(`lastPolledMuted`/`lastPolledVolume`)를 판단 기준으로 바꿔 해결했다 — 이 값은 음소거 토글·볼륨 조절 시 즉시(낙관적으로) 갱신되고, 250ms 폴링이 다른 경로(예: "전체 영상 보기"의 네이티브 컨트롤 조작)로 바뀐 값도 계속 따라잡아 준다.

---

## 로그인 세션 유지 정책: 30일 비활성 로그아웃 (client-side)

**결정**: Supabase의 서버 관리형 "Inactivity timeout"/"Time-box user sessions" 기능 대신, `index.html`의 `initAuth()`에서 `localStorage`(`sa-last-active`)에 마지막 방문 시각을 기록하고 30일(`INACTIVITY_LIMIT_MS`)이 지나면 `sb.auth.signOut()`을 호출하는 client-side 방식을 채택했다. 세션이 있는 상태로 사이트를 열 때마다 타임스탬프가 갱신돼(재방문 시 30일 연장) 활동 기반 정책 의도를 그대로 구현한다.

**이유**: Supabase 공식 문서(`docs/guides/auth/sessions`) 확인 결과 "Inactivity timeout"/"Time-box user sessions"는 Pro 플랜 이상에서만 제공되는데, 이 프로젝트가 속한 조직(`Hena`)은 Free 플랜이라 대시보드에서도 켤 수 없다. 유료 업그레이드는 비용이 발생하는 결정이라 사용자에게 먼저 확인했고, 사용자가 "정책 자체를 재검토"를 선택해 Free 플랜에서도 가능한 client-side 대안으로 합의했다.

**한계(사용자에게도 고지함)**: 이건 서버가 강제하는 진짜 세션 만료가 아니다. Supabase의 refresh token 자체는 Free 플랜에서 무기한 유효하므로, 브라우저에서 이 사이트를 거치지 않고 토큰을 직접 재사용하면 이 검사를 우회할 수 있다. 또한 "활동"의 기준이 실제 마우스/키보드 입력이 아니라 "사이트를 열어 `initAuth()`가 실행된 시점"이라, 탭을 켜둔 채 방치해도 `onAuthStateChange`의 백그라운드 토큰 갱신이 활동으로 간주될 수 있다. 관리자 소수만 Discord로 로그인하는 개인 프로젝트 규모에서는 실용적으로 충분하다고 판단해 이 단순한 구현을 택했다(디바이스 활동 감지 등 정교한 방식은 이번 범위에서 도입하지 않음).

---

## 그룹 D-2 1단계: Master 대시보드 셸(버튼 2상태 + 사이드바 + 통계 탭)

**진행 배경**: 그룹 D-2(관리자 대시보드)를 5단계로 나눠 진행하기로 했고, 이번은 1단계(버튼 + 페이지 셸 + 통계 탭만)다. 기존 편집모드(카드 호버 수정·삭제 아이콘)는 이번 단계에서 건드리지 않고, 항목 관리 탭(3단계) 완성 후 4단계에서 한 번에 이관하기로 했다(지시서 `master_dashboard_stage1_instructions.md`).

**Master 버튼 2상태**: 헤더 `.status` 안에 `#themeToggleBtn`과 `#authArea` 사이의 형제 요소로 `#masterBtn`을 정적 HTML로 두고 `style="display:none"`으로 시작했다. `renderAuthArea()`가 이미 계산하는 지역 변수 `isAdmin`을 함수 스코프로 끌어올려 재사용해서(중복 조회 없이) 전역 `isAdminUser`에 반영하고, 그 값으로 `#masterBtn`의 `display`를 토글한다. 기본 상태는 `background:#2A1420; color:var(--edit-accent)`, 활성 상태(Master 페이지 안)는 `background:var(--edit-accent); color:var(--edit-accent-ink); font-weight:700`으로, 새 CSS 변수 없이 기존 `--edit-accent`/`--edit-accent-ink`만 재사용했다. `#authArea`의 `innerHTML`을 통째로 갈아엎는 영역 밖에 뒀기 때문에 로그인/로그아웃 렌더와 독립적으로 갱신된다.

**화면 전환**: 기존 `showMapGrid()`/`openMap()`이 `#viewGrid`/`#viewDetail`의 `active` 클래스를 수동으로 토글하는 패턴을 그대로 따라 `openMaster()`를 추가했다. 다만 세 함수 모두 세 `.view`(`viewGrid`/`viewDetail`/`viewMaster`) 전체의 active를 정리하도록 고쳤다 — 안 그러면 Master 진입 후 "전체 맵" 클릭 시 `showMapGrid()`가 `viewMaster.active`를 안 지워서 두 뷰가 동시에 활성화되는 문제가 있었다(설계 리뷰에서 발견). 세션이 바뀌어 관리자 권한을 잃었는데 Master 화면에 있는 경우 `renderAuthArea()`가 자동으로 `showMapGrid()`를 호출해 빠져나오게 했다.

**사이드바 4탭 중 3개 비활성화**: `pointer-events:none` 대신 네이티브 `<button disabled>`를 썼다(설계 리뷰 제안 — 키보드 포커스·스크린리더 모두 자연스럽게 비활성으로 처리됨, 지시서의 "클릭해도 반응 없음" 조건과도 부합).

**통계 집계 방식(1단계 한정)**: 항목별 클릭수·즐겨찾기 집계를 위한 별도 RPC/뷰를 만들지 않고, `item_clicks`/`favorites`를 각각 `item_id`만 select해 전체 행을 내려받은 뒤 클라이언트에서 `Map`으로 집계했다(`items`는 이미 `loadAll()`이 전역 `items[]`에 로드해둔 것을 재사용, 추가 쿼리 없음). 코드에 `ponytail:` 주석으로 한계를 남겼다 — `item_clicks`는 계속 쌓이는 이벤트 로그라 항목 수·클릭 수가 크게 늘면 PostgREST 기본 행 제한에 걸리거나 페이로드가 커질 수 있으니, 그때는 서버 집계(RPC/뷰)로 전환할 것.

**favorites RLS 정책 추가(고위험, 사용자 확인 완료)**: 기존 `favorites` SELECT 정책은 `authenticated`의 본인 행만 허용해서, 관리자도 전체 즐겨찾기 수를 조회할 수 없었다. `item_clicks`에 이미 있던 "admins can select clicks" 패턴과 동일하게 `admins can select favorites` SELECT 정책(`exists(select 1 from admins where admins.user_id = (select auth.uid()))`)을 추가했다 — 기존 본인 행 SELECT 정책은 그대로 두고 OR로 합쳐진다. 실행 전 사용자에게 실시간으로 확인받았다(승인, 2026-07-27). 실행 SQL과 시점은 `docs/DATABASE.md`에도 반영.

---

## 그룹 D-2 2단계: Master "영상 추가" 탭 — 새 모달 없이 기존 항목 추가 모달 재사용

**결정**: Master 사이드바의 "영상 추가" 탭에 별도 모달을 새로 만들지 않고, 기존 `openAddModal(tag)`/`submitItem()`/`closeModal()` 흐름(붙여넣기 → 클립·진영 선택 → 제목/설명 → 저장)을 그대로 재사용했다(지시서 `master_dashboard_stage2_instructions.md`, B안). `openAddModal()`/`submitItem()` 내부는 전혀 수정하지 않았다.

**연결 방식**: 기존 `openAddModal(tag)`는 어떤 맵에 저장할지를 전역 `currentMap`/`currentMapName`이 이미 설정돼 있다는 전제로 동작한다(지금까지는 `openMap()`이 맵 상세 진입 시 항상 먼저 설정해줬기 때문에 이 전제가 성립했다). Master는 맵 상세 화면 밖에서 진입하므로, 새 `startMasterAdd()` 함수가 "등록 시작" 버튼 클릭 시 **유효성 검사(맵·태그 둘 다 선택됐는지)를 통과한 직후** 선택된 맵의 id/이름으로 `currentMap`/`currentMapName`을 설정한 뒤 `openAddModal(tag)`를 호출한다. 드롭다운 `onchange` 시점이 아니라 검증 통과 직후로 정한 이유는 설계 리뷰에서 나온 지적대로, 단순히 드롭다운을 선택·변경하는 것만으로 전역 내비게이션 상태(`currentMap`)가 바뀌는 것을 피하기 위해서다.

**탭 전환 구조**: 사이드바에 탭이 "통계" 하나만 있던 1단계와 달리 이번엔 2개(통계/영상 추가)가 활성화되므로 `switchMasterTab(tab)`을 새로 추가했다. 두 탭의 콘텐츠(`#masterPaneStats`/`#masterPaneAdd`)는 항상 DOM에 함께 존재하고 `.master-pane.active` 클래스로 표시만 전환한다 — `.master-content.innerHTML`을 통째로 갈아끼우는 방식은 쓰지 않았다. 이유(설계 리뷰에서 확인): 1단계에서 만든 `loadAll()`의 "`#viewMaster`가 active면 `loadMasterStats()` 재호출" 훅이 통계 탭 DOM 요소(`#statTotalClicks` 등)가 항상 존재한다고 가정하고 곧바로 접근하는데, innerHTML 교체 방식을 쓰면 영상 추가 탭이 보이는 동안 그 요소들이 DOM에서 사라져 저장 후 `loadAll()`이 null 참조 오류를 낼 수 있었다. 두 패널을 항상 유지하는 방식에서는 영상 추가 탭을 보고 있어도 통계가 백그라운드에서 계속 최신 상태로 갱신되므로 이후 통계 탭으로 돌아가도 문제가 없다.

**Master 재진입 시 기본 탭**: 지시서에 명시되지 않은 부분이라, 일반 화면에서 Master 버튼을 눌러 다시 들어올 때는 항상 "통계" 탭으로 초기화하도록 결정했다(1단계 때부터의 기존 진입 동작과 동일하게 유지, 가장 단순하고 예측 가능한 기본값). 반면 모달을 열었다 취소만 한 경우는 애초에 `#viewMaster`를 벗어난 적이 없어(모달은 `.view`와 완전히 독립된 오버레이) 보고 있던 탭·드롭다운 선택값이 그대로 유지된다 — 이 둘은 서로 다른 시나리오다.

**모달·안내 메시지**: 맵·태그 미선택 상태에서 "등록 시작"을 눌렀을 때 기존 `#modalMsg`를 재사용하지 않고 새 `#masterAddMsg` 요소를 추가했다(같은 `.msg-modal`/`.err` CSS 클래스만 재사용). 이유: `#modalMsg`는 닫혀 있는 `#addModal` 내부 요소라 모달을 열기 전 단계의 안내 메시지를 표시하는 데 쓸 수 없다(설계 리뷰에서 확인).

**Time-box user sessions는 다루지 않음**: 지시서에서도 활동 기반 연장 방식만 요청했고, 절대 만료 정책은 이번 결정 범위 밖이다.

---

## 그룹 D-2 3단계: Master "항목 관리" 탭 — 별도 쿼리 없이 기존 `items` 메모리 배열 재사용

**결정**: 사이드바 3번째 탭("항목 관리")에 새 Supabase 쿼리를 추가하지 않고, `loadAll()`이 이미 전역 `items[]`/`maps[]`에 로드해둔 데이터를 그대로 클라이언트 사이드에서 필터링·렌더링했다(지시서 `master_dashboard_stage3_instructions.md`). 맵/태그/진영 드롭다운과 제목 검색 입력 모두 `onchange`/`oninput`에서 즉시 `renderMasterItemsTable()`을 다시 호출하는 방식이라 서버 왕복이 없다.

**`renderCards()` 가드는 추가하지 않음(설계 리뷰에서 재확인)**: 지시서는 `deleteItem()`이 삭제 후 무조건 호출하는 `renderCards()`가 `#viewDetail`이 비활성 상태(Master 화면)에서 에러를 낼 수 있다고 우려했다. 실제 코드를 확인한 결과 `renderCards()`가 참조하는 `#titleSearch`/`#cardGrid`/`#detailCount`는 `.view`/`.view.active` CSS 패턴(`display:none`↔`block`)으로만 화면을 전환하므로 `#viewDetail`이 비활성이어도 DOM에서 제거되지 않고, `items.filter(i => i.map_id === currentMap)`도 `currentMap`이 `null`이거나 다른 맵이어도 예외 없이 빈 배열/다른 맵 항목만 반환한다 — 즉 JS 에러는 발생하지 않고 숨겨진 카드 그리드를 무의미하게 다시 그리는 낭비 작업으로 끝난다. Codex 설계 리뷰도 동일하게 확인했고, 추가로 같은 성격의 무조건 `renderCards()` 호출이 `submitItem()`(수정/추가 저장 성공 경로)에도 있어 `deleteItem()`에만 가드를 넣으면 두 함수 간 처리가 일관되지 않는다는 점, 지시서 자체도 "가드 적용 여부와 무관하게 최종적으로 에러가 안 나야 함"이라고 못 박아 가드를 필수 조건으로 요구하지 않는다는 점을 근거로 `deleteItem()`/`submitItem()` 내부는 전혀 수정하지 않기로 했다(최소 변경).

**항목 관리 탭 갱신은 `loadAll()`에서 처리**: 삭제(`deleteItem()`)와 저장(`submitItem()`) 모두 마지막에 `loadAll()`을 호출하므로, `loadAll()` 안의 "`#viewMaster`가 active일 때" 훅을 확장해 활성 탭이 `items`면 `renderMasterItemsTable()`을, `stats`면 기존처럼 `loadMasterStats()`를 호출하도록 분기했다(이전엔 `viewMaster`만 active면 탭 종류와 무관하게 항상 `loadMasterStats()`를 호출해 "영상 추가" 탭을 보고 있을 때도 불필요한 클릭/즐겨찾기 집계 쿼리가 실행되고 있었다 — 설계 리뷰에서 지적받아 이번에 함께 정리했다). 항목 관리 탭 자체는 `items[]` 로컬 배열만 다시 필터링하는 동기 함수라 추가 DB 쿼리가 없다.

**필터 UI는 기존 `.master-add-row`/`.master-select` 클래스 재사용**: 새 CSS 변수나 레이아웃 클래스를 만들지 않고 2단계("영상 추가" 탭)에서 쓰던 가로 배치 클래스를 그대로 재사용했다. 진영 필터 값은 화면 표기(RED/BLUE/공통)와 달리 실제 저장값(`'red'`/`'blue'`/`'none'`)을 그대로 옵션 값으로 써서 `it.team`과 직접 비교했다(설계 리뷰에서 지적 — 표기 그대로 비교하면 매칭이 안 됨). 제목 검색은 지시서 문구("제목 검색창")를 그대로 따라 `items.title`만 대상으로 했고, 기존 상세 화면 검색(`renderCards()`)처럼 `channel_name`까지 포함하지는 않았다.

**테이블 가로 스크롤**: 좁은 화면에서 7개 컬럼(미리보기/제목/맵/태그/진영/수정/삭제)이 찌그러지지 않도록 `.master-table-wrap{overflow-x:auto}` + 내부 테이블 `min-width:640px`을 추가했다(지시서의 "테이블이 넓으면 가로 스크롤 등 자연스러운 처리" 요구사항, 설계 리뷰에서도 동일하게 지적).

---

## 그룹 D-2 4단계: Master "맵 관리" 탭 추가 + 기존 편집모드 완전 제거 (5개 탭 체제 확정)

**결정**: 사이드바 5번째 탭으로 "맵 관리"를 추가하고(지시서 `master_dashboard_stage4_instructions.md`), 동시에 User 사이트의 기존 편집모드(관리자 뱃지·"편집모드" 버튼·맵 타일 호버 액션·카드 호버 아이콘·태그 섹션 "+추가" 타일)를 전역 `editMode` 변수와 함께 완전히 제거했다. 이제 맵/항목 CRUD는 전부 Master 안에서만 이뤄진다. 3단계("항목 관리" 탭)와 동일하게 새 Supabase 쿼리 없이 이미 메모리에 있는 `maps[]`/`items[]`를 재사용했고, 각 행의 이미지 변경(🖼)/이름 변경(✎)/삭제(✕) 버튼은 기존 `pickMapImage()`/`renameMap()`/`deleteMap()`을 그대로 호출한다(신규 함수 없음). 갱신 방식도 3단계와 동일한 패턴: `switchMasterTab()`에 `maps` 케이스를 추가하고, `loadAll()`의 Master 활성 탭 분기(`items`/`stats`)에 `maps`를 추가해 `renderMasterMapsTable()`이 최신 상태로 다시 그려지도록 했다.

**작업 0(실 DB 왕복 검증) 방식은 지시서 원안에서 조정**: 지시서는 "기존 항목 중 영향 적은 것"을 수정→삭제해도 된다고 했지만, Codex 설계 리뷰에서 `deleteItem()`이 실제 hard DELETE이고 `favorites`/`item_clicks`가 `items`에 `ON DELETE CASCADE`로 걸려 있어 기존 실 항목을 삭제하면 그 항목의 즐겨찾기·클릭 이력까지 함께 영구 삭제되어 "원래 값으로 복구"가 불가능하다는 점을 지적받았다. 이 저장소 `docs/DEVELOPMENT_GUIDE.md`의 "SQL 실행 규칙"도 DELETE는 사전에 사용자에게 명시하고 확인받은 후 실행하도록 요구한다. 사용자에게 확인한 결과 데이터 손실 위험이 없는 대안(Claude Code가 Supabase MCP로 새 테스트 항목을 INSERT하고, 사용자가 배포된 앱의 Master "항목 관리" 탭에서 그 항목을 직접 수정→삭제, 이후 Claude Code가 SELECT로 반영 여부 확인)으로 진행하기로 했다. 실제 검증 결과는 이 지시서의 보고서(작업 완료 후 최종 보고) 참고.

**`favoriteButton()`의 `withDelete` 파라미터 제거**: 기존에는 상세 카드에서 `favoriteButton(it, editMode)`로 호출해 편집모드일 때만 즐겨찾기 별을 삭제 아이콘(`.card-del`)과 안 겹치도록 `right:66px`로 밀어냈다(`.card-fav.with-delete`). 삭제 아이콘 자체가 카드에서 완전히 사라지므로 이 오프셋도 항상 죽은 코드가 된다 — 지시서가 "더 깔끔한 쪽으로 판단해도 된다"고 명시했으므로, 인자를 유지한 채 항상 `false`로 취급하는 대신 함수 시그니처에서 `withDelete` 파라미터와 `.card-fav.with-delete` CSS 규칙을 함께 삭제했다(Codex 설계 리뷰에서도 이 방향을 최소 변경으로 권고).

**미사용 CSS 함께 정리**: "완전 제거"를 문자 그대로 적용해 편집모드 전용이었던 `.admin-badge`, `.editmode-btn`(+`:hover`/`.on`), `.map-tile .tile-actions`, `.tile-actions span`, `.card .card-edit`, `.card .card-del`, `.add-tile`(맵 타일·태그 섹션 양쪽에서 쓰이던 것 모두 제거되어 완전히 미사용) 선택자를 전부 삭제했다. 표시용 맵 이름은 `escapeHtml(m.name)`, 인라인 `onclick` 인자는 기존 `renderMapGrid()`의 작은따옴표 이스케이프(`safe`) 패턴을 그대로 재사용해 "맵 관리" 탭 테이블에도 동일하게 적용했다.

**로컬 정적 서버 + Playwright로 시각 QA**: 실제 배포/커밋 전에 `python -m http.server`로 로컬 서빙 후 Playwright로 (1) 비로그인 일반 화면에 편집모드 흔적이 전혀 없는지, (2) `isAdminUser`를 콘솔에서 강제로 켜고 Master "맵 관리" 탭이 데스크톱/모바일(390px) 폭 모두에서 정상 렌더링되는지, (3) 카드 그리드의 즐겨찾기 별이 삭제 아이콘 없이도 정상 위치(우측 상단)에 있는지 확인했다. DB에 쓰기가 발생하는 액션(새 맵 추가/이름변경/삭제/이미지변경 버튼 클릭)은 실제로 누르지 않고 렌더링만 검증했다.

---

## Master 버튼을 `.status`에서 `.brand`로 이동

**결정**: `#masterBtn`을 헤더의 `.status`(오른쪽, 로그인 영역 근처) 밖으로 빼서 `.brand`(로고+타이틀) 안, `<h1>서든 <span>아카이브</span></h1>` 바로 뒤로 옮겼다(지시서 `master_button_reposition.md`). 원래 설계 의도(타이틀 옆 배치)에 맞춘 것이며, `.brand{display:flex;align-items:center;gap:12px}`가 이미 있어 별도 레이아웃 CSS 추가 없이 나란히 배치된다. 클릭 핸들러(`openMaster()`)와 `isAdminUser`에 따른 표시/숨김(`renderAuthArea()`), `open/close` 시 `.active` 토글(`openMaster()`/`showMapGrid()`/`openMap()`)은 모두 `document.getElementById('masterBtn')` id 기반 조회라 DOM 위치 변경과 무관하게 그대로 동작한다(설계 리뷰로 재확인, JS 수정 없음).

**색상 충돌 수정(설계 리뷰에서 발견)**: `.brand span{color:var(--red)}`가 `.brand` 안의 모든 `<span>`에 적용되는 규칙이라, 버튼을 그대로 옮기면 내부의 `.master-btn-icon`/`.master-btn-label` 텍스트도 이 빨간색을 상속받아 기본/활성 2가지 상태의 의도된 배색(`--edit-accent`/`--edit-accent-ink`)이 깨졌다. `.brand .master-btn span{color:inherit;}`를 추가해(클래스 2개 조합이라 `.brand span`보다 명시도가 높아 별도 순서 조정 없이 우선 적용됨) 버튼 내부 span이 부모 `.master-btn`/`.master-btn.active`의 색을 다시 상속받도록 고쳤다. 새 CSS 변수는 추가하지 않았다.

**`.status` 잔여 요소 간격은 그대로 유지**: Master 버튼이 빠져도 `.status{gap:18px}`는 flex 간격이라 자동으로 재배치되며 빈 공간이나 이중 간격이 남지 않는다(설계 리뷰로 확인). CLIPS/TIPS 카운터·테마 토글·`#authArea` 사이 간격을 조정할 필요는 없었다.

**모바일(390px) 검증 중 발견한 기존 버그는 이번 작업 범위 밖으로 분류**: 헤더에 `flex-wrap`이 없고 `.brand`/`.status`·타이틀·닉네임 텍스트에 `white-space:nowrap` 보호가 없어, 390px처럼 좁은 화면에서는 한글 타이틀·관리자 닉네임이 글자 단위로 세로 줄바꿈된다. 이동 전 커밋(`HEAD`)으로 동일 조건을 재현해 이 버튼 이동과 무관한 기존 문제임을 확인했다. 지시서는 버튼 위치 이동만 요청했고 헤더 반응형 전면 개편은 범위 밖이라 이번 작업에서는 고치지 않고 `docs/KNOWN_ISSUES.md`에 기록했다.

---

## `<meta name="viewport">` 추가 + Playwright 실제 디바이스 에뮬레이션으로 모바일 QA 방법론 교정

**결정**: `index.html` `<head>`에 `<meta name="viewport" content="width=device-width, initial-scale=1">`가 없던 것을 확인하고 추가했다. 이 태그가 없으면 모바일 브라우저가 기본적으로 약 980px 레이아웃 뷰포트를 가정해 페이지를 축소 표시하므로(글자는 작아 보이지만 레이아웃 자체는 깨지지 않음), 지금까지 이 저장소에서 해온 "Playwright `page.setViewportSize()`로 390px 리사이즈" 방식의 모바일 QA는 실제 모바일 기기가 렌더링하는 방식과 다를 수 있다는 것을 이번에 확인했다.

**검증 방법 교정(중요)**: `page.setViewportSize()` 단독 리사이즈는 `isMobile`/`hasTouch`/디바이스 UA를 함께 설정하지 않으므로 데스크톱 브라우저가 그냥 좁은 창을 그리는 것과 같다. 진짜 모바일 렌더링을 확인하려면 `browser.newContext({ viewport, isMobile:true, hasTouch:true, deviceScaleFactor, userAgent })`처럼 디바이스 에뮬레이션 컨텍스트를 새로 만들어야 한다. 이번에 이 방식으로 재검증한 결과, 기존 `docs/KNOWN_ISSUES.md`의 "헤더 텍스트 세로 줄바꿈" 항목이 viewport 태그 추가만으로는 해결되지 않고, 오히려 실제 기기 조건에서는 로그인 버튼이 화면 밖으로 잘리고(`document.body.scrollWidth`가 뷰포트보다 282px 더 큼) 가로 스크롤까지 발생한다는 더 심각한 사실을 새로 확인해 해당 항목의 위험도를 "낮음"에서 "중간"으로 올렸다. 같은 검증 과정에서 항목 추가/수정 모달(`#addModal`)도 390px에서 화면 밖으로 넘치는 것을 추가로 발견해 `docs/KNOWN_ISSUES.md`에 새 항목으로 기록했다.

**카드 그리드·Master 대시보드는 정상 확인됨(→ 이후 정정, 아래 "헤더·모달 모바일 오버플로우 수정" 절 참고)**: 같은 실제 디바이스 에뮬레이션으로 맵 상세 카드 그리드(`renderCards()`)와 Master 대시보드(맵 관리 탭 포함)를 열어봤을 때는 기존 `@media(max-width:600px)`/`@media(max-width:768px)` 규칙이 의도대로 동작해 한 열로 정상 전환되고 가로 오버플로우가 없었다 — 문제는 헤더와 모달 두 곳에 한정된다. **정정**: 이때는 `document.body.scrollWidth`를 명시적으로 측정하지 않고 스크린샷 육안 확인만 했다. 다음 작업(`mobile_header_modal_overflow_fix.md`)에서 `scrollWidth`를 직접 측정해보니 Master "맵 관리"/"항목 관리" 탭은 실제로는 672px로 오버플로우하고 있었다(당시 스크린샷의 원본 해상도가 이미 2016px였던 것이 그 증거였는데 놓쳤다). 카드 그리드는 재검증해도 정상이었다. 앞으로 실기기 QA에서는 스크린샷 육안 확인만으로 끝내지 말고 `scrollWidth` 수치를 함께 남길 것.

**이번 작업에서 고치지 않은 것**: 헤더 flex-wrap 정리와 모달 폭 제한은 viewport 태그 추가 확인이라는 이번 작업 범위 밖이라 손대지 않았다. 두 이슈 모두 `docs/KNOWN_ISSUES.md`에 남겨뒀다.

---

## 헤더·모달 모바일 오버플로우 수정 (`mobile_header_modal_overflow_fix.md`)

**결정**: `docs/KNOWN_ISSUES.md`에 기록돼 있던 헤더 390px 오버플로우와 모달 오버플로우 두 항목을 실제로 고쳤다. 기존 `@media(max-width:600px)` 블록(153번째 줄 부근)에 헤더·`#authArea` 규칙을 추가했다.

- `header{padding:14px 16px;flex-wrap:wrap;row-gap:10px;}`, `.brand{flex-wrap:wrap;}` — 좁은 화면에서 `.brand`/`.status`가 한 줄에 안 들어가면 자연스럽게 두 줄로 쌓이도록 허용(지시서가 명시적으로 허용한 방향)
- `.brand h1{font-size:18px;white-space:nowrap;}` — 타이틀을 글자 단위로 세로 줄바꿈시키는 대신 폰트 크기를 줄여 한 줄에 들어가게 함(26px→18px, "서든 아카이브" 6글자 기준 실측으로 여유 있게 들어가는 값을 확인)
- `.status span.mono:has(#clipCount),.status span.mono:has(#tipCount){display:none;}` — CLIPS/TIPS 카운터를 좁은 화면에서 숨김(지시서가 "덜 중요한 요소를 숨기거나 줄여서 로그인/Master 버튼을 항상 보이게" 허용). `:has()`를 쓴 이유: 카운터 span과 로그인 상태의 닉네임 span이 둘 다 `class="mono"`를 공유해서 클래스만으로는 구분이 안 되고, `:nth-child` 같은 구조 선택자는 로그인 여부에 따라 DOM 구성이 달라져 취약하다(Codex 설계 리뷰에서 지적) — `#clipCount`/`#tipCount`라는 안정된 id를 자식으로 갖는지로 구분하는 것이 가장 안전했다. 이 저장소가 이미 `navigator.clipboard.read()` 등 최신 브라우저 API에 의존하므로 `:has()`(모든 현역 브라우저 지원) 사용에 새 제약이 생기지 않는다
- `#authArea{max-width:100%;} #authArea>span.mono{max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}` — 관리자 닉네임이 아무리 길어도 로그아웃 버튼을 밀어내지 않도록 말줄임 처리(`#authArea`의 직계 자식만 선택해 `renderAuthArea()`가 `innerHTML`을 통째로 갈아끼워도 항상 적용됨, `docs/ARCHITECTURE.md`에 정리된 "`#authArea`는 요소 자체가 아니라 내부 `innerHTML`만 교체" 패턴과 맞물림)
- 새 CSS 변수는 추가하지 않았다(지시서 요구사항)

**모달은 별도의 새 `@media(max-width:600px)` 블록으로 분리(중요한 버그 수정)**: 처음에는 지시서 지시대로 위 헤더 규칙과 함께 153번째 줄 블록에 넣었지만, `.modal`/`.modal-box`의 기본(비반응형) 선언이 소스상 353번째 줄 부근으로 더 뒤에 있어 CSS 캐스케이드의 "동일 명시도면 소스 순서상 나중 것이 우선" 규칙에 따라 153번째 줄의 오버라이드가 무시되는 것을 실제 디바이스 에뮬레이션 측정으로 발견했다(모달 실제 폭이 계산상 기대값 366px가 아니라 330px로 나왔고, 역산해보니 기본 선언의 `padding:30px`/`width:min(560px,95vw)`가 그대로 적용된 상태에서 flexbox가 축소시킨 값과 정확히 일치했다). 그래서 모달 전용 오버라이드(`.modal{padding:12px;} .modal-box{width:min(560px, calc(100vw - 24px));}`)는 `.modal-box` 기본 선언 바로 뒤(353번째 줄 부근)에 새 `@media(max-width:600px)` 블록을 만들어 넣었다 — "기존 블록 재사용"이라는 지시서 취지는 지키되, 이 저장소에 이미 `.card-grid-inner` 전용 `@media(max-width:600px)` 블록이 컴포넌트 옆에 따로 있는 기존 패턴(214번째 줄)과도 일관된다. 모달 폭 계산은 Codex 설계 리뷰가 사전에 검산해 정확함을 확인했다(패딩 12px×2=24px, `calc(100vw - 24px)`).

**Master "항목 관리"/"맵 관리" 탭의 가로 오버플로우는 발견만 하고 고치지 않음**: 작업 3(다른 기능 실기기 재확인) 스팟체크 중 `document.body.scrollWidth`가 672px로 나오는 것을 발견했다. 진단해보니 `.master-table{min-width:640px}`가 `.master-shell`이 `flex-direction:column`으로 바뀌는 모바일 레이아웃에서 상위 조상(`.master-content`/`.master-pane`/`#masterItemsTableWrap`) 어디에도 폭 제한이 없어 그대로 body까지 전파되는 것이 원인이었다. 지시서가 "이번 지시서 범위(헤더·모달)와 무관한 것은 기록만 하고 고치지 마세요"라고 명시했으므로 `docs/KNOWN_ISSUES.md`에 진단 내용과 함께 기록만 하고 수정하지 않았다.

**검증 방법**: 모든 확인은 Playwright 실제 디바이스 에뮬레이션(`isMobile:true`, `hasTouch:true`, iPhone UA, `deviceScaleFactor:3`, 390px)으로 했고, 수정 전/후 `document.body.scrollWidth`를 비교했다(로그아웃 상태, 관리자+긴 닉네임 상태, 모달 열림 상태 각각 672→390 확인). 데스크톱(1920px/1440px)과 태블릿(768px)도 별도 컨텍스트로 열어 `scrollWidth`와 `header`의 `padding-left` 계산값(둘 다 32px 그대로)을 확인해 회귀가 없음을 검증했다 — 모든 새 규칙이 `max-width:600px` 안에만 있어 그 위 폭에는 영향을 주지 않기 때문이다.

---

## 전체 사이트 실기기 모바일 반응형 전수 점검 (`mobile_full_site_sweep.md`)

**결정**: `docs/KNOWN_ISSUES.md`에 남아 있던 Master "항목 관리"/"맵 관리" 탭 오버플로우를 실제로 고치고, 지시서가 나열한 8개 화면(맵 그리드·전체 검색, 카드 그리드·진영 전환, 항목 추가 모달 3단계, 항목 수정 모달, 영상 재생 오버레이, 라이트/다크 테마, Master 5탭, 로그인/즐겨찾기)을 Playwright 실제 디바이스 에뮬레이션(iPhone, `isMobile:true`, 390px와 320px 둘 다)으로 전수 점검했다. 단순 `page.setViewportSize()` 리사이즈는 지시서가 명시적으로 금지했다 — 헤더·모달 오버플로우를 처음 놓쳤던 원인이 그 방식이었기 때문(`docs/DECISIONS.md`의 "viewport meta 태그 추가" 절 참고).

**Master 테이블 수정**: `.master-content{flex:1;min-width:0}`는 데스크톱 가로 flex 레이아웃 전용 방어였고, `.master-shell`이 세로(column)로 바뀌는 `@media(max-width:768px)` 블록(기존에 이미 있던 블록, `.master-content`/`.master-table-wrap` 기본 선언보다 소스상 뒤에 위치 — 캐스케이드 순서 확인함)에 `.master-content{width:100%;} .master-table-wrap{max-width:100%;}` 두 줄만 추가했다. 이렇게 하면 표 자체는 여전히 `.master-table-wrap{overflow-x:auto}`로 가로 스크롤되지만(의도된 동작, 3단계 결정 유지), 그 스크롤이 표 컨테이너 안에서만 일어나고 페이지 전체(헤더·사이드바 포함)는 더 이상 밀려나지 않는다. "항목 관리"/"맵 관리" 탭 모두 같은 원인·같은 수정으로 해결됐다.

**스윕 중 새로 발견해 함께 고친 것: 320px 진영 토글 오버플로우**: 8개 화면을 390px로는 전부 통과했지만, 지시서가 요구한 대로 320px도 함께 확인하는 과정에서 카드 그리드/항목 추가 모달/영상 재생 오버레이가 공통으로 362px까지 밀리는 것을 발견했다. `document.documentElement.scrollWidth`뿐 아니라 각 요소의 `getBoundingClientRect()`도 함께 찍어 원인을 좁혔더니 `.team-toggle`(TOTAL/RED/BLUE/FAVORITE)의 오른쪽 끝이 361px(320px 초과)로 나와, 모달·오버레이가 자체적으로 넘친 게 아니라 그 뒤에 계속 열려 있는 카드 그리드 화면의 진영 토글이 원인임을 확인했다(모달·오버레이는 배경 위에 겹쳐 뜨는 오버레이라, 배경 화면이 넓으면 `document.documentElement.scrollWidth`도 그대로 넓게 잡힌다). 지시서 사전 설계 리뷰(Codex)에서도 이 지점을 넓은 패딩 때문에 빠듯할 것으로 미리 짚었던 부분이라, 예측이 실측으로 확인된 경우다. 390px에서는 문제가 없었으므로(팀 토글 오른쪽 끝 361px, 여유 있음) 390px 스타일은 그대로 두고 `@media(max-width:340px)`라는 더 좁은 새 브레이크포인트를 추가해 `.team-toggle button` 패딩만 `9px 22px`→`9px 12px`로 줄였다 — 이미 통과한 390px 화면은 건드리지 않는다는 지시서 원칙("이미 정상으로 확인된 화면은 굳이 건드리지 마세요")을 지키기 위해서다.

**CSS만으로 못 고칠 만한 구조적 문제는 발견되지 않음**: 설계 리뷰에서 오버레이 미디어(`width:min(880px,90vw)`+`padding:40px`)가 이론상 320px에서 좁을 수 있다고 지적했지만, 실측하면 `.overlay`가 `position:fixed;inset:0`인 뷰포트 전체 오버레이라 미디어가 패딩 영역으로 살짝 넘치더라도 화면 자체 밖으로는 나가지 않아(중앙 정렬, 351px 미디어가 뷰포트 390px 안에 자연스럽게 들어감) 실제 문제가 아니었다. Master 사이드바 탭 텍스트, 클립 슬라이더, 맵 그리드도 320px에서 실측·스크린샷으로 확인한 결과 전부 정상이었다(맵 그리드는 `minmax(280px,1fr)`가 이론상 256px 콘텐츠 폭보다 커 보였지만 실제로는 그리드가 안전하게 축소됨). "레이아웃을 새로 설계해야 하는 수준"의 문제는 이번 스윕에서 나오지 않아 `KNOWN_ISSUES.md`에 새로 추가한 항목은 없다.

**검증 방법**: 모든 확인을 Playwright 실제 디바이스 에뮬레이션(iPhone UA, `isMobile:true`, `hasTouch:true`, `deviceScaleFactor:3`)으로 진행했고, 390px·320px 각각에서 8개 화면 전부의 `document.documentElement.scrollWidth`를 측정했다(지시서가 지정한 정확히 이 프로퍼티 사용). 두 문제를 고친 뒤에는 같은 화면들을 재측정해 전/후 수치를 비교했고, 데스크톱(1920px/1440px)·태블릿(768px)에서도 홈/카드그리드/Master 항목관리 `scrollWidth`와 팀 토글 패딩 계산값(22px 그대로)을 확인해 회귀가 없음을 검증했다.

---

## 그룹 J: 댓글 기능 (오버레이 내 표시)

**표시 위치**: 재생 오버레이의 `.overlay-media`+`.overlay-meta` 아래, `.overlay-box` 안에 `.overlay-comments`로 배치했다. Codex 설계 리뷰가 "`.overlay-media`와 `.overlay-meta` 사이"보다 "`.overlay-meta` 아래"가 기존 제목·닫기 버튼 영역을 그대로 보존해 자연스럽다고 지적한 것을 그대로 채택했다. 댓글 목록에는 `max-height:240px;overflow-y:auto`를 둬서 세로로 짧은 `.overlay-media.tall`(9:16 클립)과 긴 댓글 목록이 함께 있어도 오버레이 전체가 화면 밖으로 밀리지 않게 했다.

**대상 범위**: `it.tag !== '맵 지명'`을 직접 조건으로 썼다. 기존 `favoriteButton()`은 `it.tag !== '위폭' && it.tag !== '팁'`라는 별개의 화이트리스트 패턴을 쓰지만(태그가 셋 외의 값이면 두 결과가 달라짐), 이번 지시서는 "맵 지명이 아닌 모든 항목"을 명시했으므로 그 화이트리스트를 재사용하지 않고 직접 부정 조건을 썼다(Codex 설계 리뷰에서 두 패턴이 동등하지 않음을 확인).

**관리자 판정**: 새 `admins` 쿼리를 만들지 않고, `renderAuthArea()`가 로그인 시마다 이미 계산해 두는 전역 `isAdminUser`를 그대로 재사용했다. 지시서가 "기존 판정 로직 재사용"을 명시했고, 삭제 아이콘 노출 여부(`currentSession.user.id === comment.user_id || isAdminUser`)에는 클라이언트 쿼리가 필요 없어 가장 단순한 방법이었다.

**삭제 권한**: 작성자 본인 또는 관리자. RLS DELETE 정책의 관리자 서브쿼리(`exists (select 1 from public.admins where admins.user_id = (select auth.uid()))`)는 `favorites`/`item_clicks`에 이미 쓰인 것과 동일한 패턴을 그대로 재사용했다(`docs/DATABASE.md`의 RLS 절 참고).

**수정 기능 없음**: 지시서가 "삭제 후 재작성"으로 명시했으므로 UPDATE 정책 자체를 만들지 않았고 클라이언트에도 수정 UI가 없다.

**`author_name` 비정규화 저장**: 댓글 작성 시점의 `currentSession.user.user_metadata.full_name || .name || '사용자'` 값을 그 댓글 행에 그대로 저장한다(매 조회 시 `auth.users`를 조인하지 않음). 지시서가 "나중에 닉네임이 바뀌어도 과거 댓글엔 그때 이름이 남는 것은 의도된 동작"이라고 명시했고, 이 방식이면 조인 없이 댓글 목록만 조회해도 표시 이름이 그대로 나온다는 이점도 있다.

**상대 시간 포맷**: 기존 코드에 유사 함수가 없어(Codex 설계 리뷰로 확인) `formatRelativeTime()`을 새로 작성했다. 방금 전/N분 전/N시간 전/N일 전(7일 미만)/절대 날짜(`YYYY.MM.DD`, 7일 이상) 기준이며, 렌더링 시점에 1회 계산하고 별도 자동 갱신 타이머는 두지 않았다(오버레이를 다시 열거나 목록을 새로 그릴 때 다시 계산되는 것으로 충분하다고 판단, 과설계 방지).

**빈 댓글 방지**: `comments.body`에는 빈 문자열을 막는 DB 제약이 없다(300자 상한 CHECK만 있음, 이미 승인된 SQL을 그대로 실행했으므로 스키마는 바꾸지 않았다). 대신 `submitComment()`에서 `input.value.trim()`이 빈 문자열이면 등록 자체를 막았다(Codex 설계 리뷰가 지적한 "공백만 있는 댓글" 허용 문제를 클라이언트 단에서 보완).

**검증 방법**: 클라이언트 로직(맵 지명 항목 숨김, XSS 이스케이프, 본인/관리자 삭제 아이콘 노출)은 Playwright `evaluate()`로 합성 데이터를 주입해 직접 확인했다. 실제 DB 왕복(INSERT/DELETE)은 Discord OAuth로 로그인한 실제 세션(관리자 계정, `user_id: c9642556-c6d5-427d-9e46-92ecfe507f2e`)의 Supabase 인증 토큰을 배포 도메인에서 발급받아 로컬 테스트 서버(origin이 달라 OAuth 콜백이 localhost로 오지 않으므로) `localStorage`로 옮겨 재현했다 — 실제로 댓글을 작성해 Supabase MCP `SELECT`로 저장을 확인하고, 삭제해 `SELECT`로 제거를 확인했으며, 테스트 데이터는 최종적으로 0건으로 남겼다. 이 프로젝트에 실제 로그인 계정이 이 관리자 계정 하나뿐이라, "관리자가 타인의 댓글을 삭제"하는 시나리오는 실제 REST 왕복으로는 검증하지 못했다 — 대신 RLS 정책의 관리자 서브쿼리가 이미 프로덕션에서 검증된 `favorites`/`item_clicks` 패턴과 동일함을 `pg_policies` 조회로 확인하고, 클라이언트 쪽 삭제 아이콘 노출 로직은 합성 데이터(타인 소유 댓글 + `isAdminUser=true`)로 확인하는 것으로 대체했다. 모바일(390px/320px, 실제 디바이스 에뮬레이션)과 데스크톱(1920/1440/768px)에서 `document.documentElement.scrollWidth` 회귀도 없음을 확인했다.

**커밋 전 Codex 리뷰에서 발견해 수정한 두 가지**:

1. **작성자 이름 위조 가능**(P1) — INSERT RLS 정책이 `user_id`만 검증하고 `author_name`은 검증하지 않아, 로그인한 사용자라면 누구든 Supabase REST를 직접 호출해 임의의 `author_name`(예: 관리자 사칭)을 보낼 수 있었다. 공개 댓글 기능이라 사칭 악용 가능성이 실질적이라고 판단해, 고치는 방법(`comments` 테이블에 `BEFORE INSERT` 트리거 추가)이 새 DB 객체 생성이라는 점을 사용자에게 명시하고 확인받은 뒤 진행했다. `comments_set_trusted_author_name()`(SECURITY DEFINER) 함수가 `NEW.author_name`을 `auth.users.raw_user_meta_data` 기준으로 무조건 덮어쓰도록 만들어, 클라이언트가 보낸 값은 완전히 무시된다. 스푸핑 INSERT를 실제로 실행해 저장된 값이 강제로 실제 계정 이름(`hena_`)으로 바뀌는 것을 확인했다. 스키마는 `docs/DATABASE.md` 참고
2. **로그인 상태 변경 시 댓글 UI 미갱신**(P2) — 오버레이가 열린 채로 로그인/로그아웃하면 `renderAuthArea()`가 `currentSession`/`isAdminUser`는 갱신하지만 댓글 입력창 비활성화·삭제 아이콘 노출 여부는 그대로 남아있었다. `refreshCommentAuthUI()`를 새로 만들어 `renderCommentsSection()`(오버레이를 열 때)과 `renderAuthArea()`(로그인 상태가 바뀔 때) 양쪽에서 호출하도록 통합했다. 합성 세션으로 로그인 전/후 입력창 활성화 상태가 즉시 바뀌는 것을 확인했다.

두 수정 모두 재리뷰(2회차)에서 추가 지적 없이 통과했다.

---

## 이미지 오버레이 확대/축소/이동 기능

**결정**: 이미지 타입(`type='img'`) 재생 오버레이에 마우스 휠 확대·축소(커서 중심), 확대 상태 드래그 이동, 모바일 핀치·한 손가락 드래그, 리셋 버튼/더블클릭·더블탭 복귀를 순수 CSS `transform` + 마우스/터치 이벤트로 구현했다. 외부 라이브러리는 추가하지 않았다(지시서 요구사항). 영상 타입(`type='vid'`)에는 전혀 적용되지 않는다.

**설계 리뷰에서 자동 수정한 사실 오류**: 지시서는 "`.overlay-media`에 `overflow:hidden`을 추가해야 한다"고 전제했지만, 실제 CSS(현재 [styles.css](../styles.css))에 이미 `overflow:hidden`이 있었다 — 새로 추가하지 않았다. 이미지 렌더링 코드도 실제 `openOverlay()`의 `it.type==='img'` 분기(현재 `app.js`)에 구현했다.

**좌표계·확대 기준**: `<img>` 요소 자체(width:100%/height:100%, `transform-origin:0 0`)를 확대·이동 대상으로 삼았다. `translateX`/`translateY`는 `#overlayMediaContent` 컨테이너 기준 화면 픽셀 좌표로 관리한다. 팬 범위 제한도 이미지의 실제 표시 픽셀(`object-fit:contain`으로 인한 레터박스 제외)이 아니라 `<img>` 요소 박스 전체를 기준으로 clamp했다 — Codex 설계 리뷰가 "정확한 픽셀 경계로 제한할지, 요소 박스로 제한할지" 애매하다고 지적한 지점인데, 지시서의 목표가 "과도하게 벗어나 보이지 않도록"이지 "레터박스까지 정밀 제거"가 아니라고 판단해 더 간단한 요소 박스 기준을 택했다(`naturalWidth`/`naturalHeight` 기반 정밀 계산은 구현 복잡도만 늘리고 체감 차이가 크지 않다고 판단).
- 휠 확대 중심 보정 공식: `ix = (mx-tx)/scale`(커서 아래 지점의 확대 전 좌표) → `newTx = mx - ix*newScale`로 역산, 이 지점이 확대 후에도 같은 화면 위치에 남는다(Playwright로 불변식 `(mx-tx)/scale` 값이 확대 전후 동일함을 직접 검증).
- 팬 clamp 공식: `scale<=1`이면 무조건 `(0,0)`(1배에서는 드래그해도 이동하지 않는다는 요구를 이 clamp 자체로 만족), `scale>1`이면 `tx ∈ [boxW*(1-scale), 0]`, `ty`도 동일 패턴.
- 배율 범위는 지시서 권장값 그대로 1~4배 채택(조정 근거 없음, 그대로 사용).
- 휠 감도: 한 단계당 ×1.15(배율 기반 증가, `deltaY` 부호로 확대/축소 방향만 판별) — 선형 증가 대신 배율 기반을 택해 이미 확대된 상태에서도 체감 확대/축소 속도가 일정하게 느껴지도록 했다.

**이벤트 리스너 구조**: `#overlayMediaContent`(오버레이가 열릴 때마다 `innerHTML`만 교체되고 요소 자체는 유지됨)에 `wheel`(`{passive:false}`)/`mousedown`/`dblclick`/`touchstart`/`touchmove`(`{passive:false}`)/`touchend`/`touchcancel` 리스너를 페이지 로드 시 한 번만(`initImageZoomPan()`) 등록했다 — 오버레이를 열고 닫을 때마다 리스너를 추가·제거하지 않고, 대신 각 핸들러 내부에서 `overlayImgZoomEnabled` 플래그로 이미지 타입이 아닐 때 즉시 return하는 방식을 택했다(기존 코드가 `oninput`/`onclick` 같은 정적 바인딩을 선호하는 패턴과 맞물림, 매 오버레이 오픈마다 리스너 중복 등록 위험도 없음). 단, 드래그 중 `mousemove`/`mouseup`은 `window`에 `mousedown` 시점에만 임시로 등록하고 `mouseup` 시점에 항상 해제되므로 리스너 누수가 없다(Codex 설계 리뷰가 지적했던 "전역 리스너 해제" 우려는 이 방식으로 해소됨).

**핀치 제스처**: 두 손가락 거리 변화 비율(`현재거리/제스처시작거리`)을 제스처 시작 시점 배율에 곱해 목표 배율을 구하고, 매 `touchmove`마다 현재 두 손가락 중점을 확대 중심으로 재계산한다(휠 확대와 동일한 `zoomImageAt()` 함수 재사용) — 핀치 도중 자연스럽게 팬도 함께 되는 흔한 방식이다. `touch-action:none`을 이미지 렌더링 시점에만 `#overlayMediaContent`에 적용하고 영상/빈 상태로 전환되면 해제해, 브라우저 기본 핀치줌·스크롤과 충돌하지 않으면서도 영상 타입의 기존 터치 동작에는 영향을 주지 않는다.

**리셋**: `.overlay-media` 내부(우상단, 볼륨 버튼 등과 같은 절대 위치 패턴)에 `↺` 버튼을 추가해 확대 상태(`scale>1`)일 때만 노출한다. 더블클릭(데스크톱, `dblclick` 이벤트)과 더블탭(모바일, `touchstart` 300ms 이내 재발생 판정)도 동일하게 리셋한다. 오버레이를 열 때(`openOverlay()` 시작부)와 닫을 때(`closeOverlay()`) 모두 `resetImageZoomState()`를 호출해 이전 이미지의 확대 상태가 다음 이미지에 남지 않는다.

**검증 방법**: DB 스키마 변경이 없는 순수 클라이언트 기능이라 실 세션 없이 Playwright로 전부 검증했다. 확대 중심 불변식(커서 아래 지점이 확대 전후 동일 화면 위치 유지), 배율 상한(4배)·하한(1배) clamp, 1배에서 드래그 무효, 실제 `wheel`/`mousedown`/`mousemove`/`mouseup`/`dblclick` DOM 이벤트 디스패치로 리스너 바인딩 자체도 확인했다. 모바일은 실제 디바이스 에뮬레이션(`isMobile:true`, `hasTouch:true`, 390px)에서 `Touch`/`TouchEvent` 생성자로 합성 핀치(거리 3배 벌림 → 3배 확대 확인)와 한 손가락 드래그, 더블탭 리셋을 검증했다. 영상 타입으로 전환 시 `overlayImgZoomEnabled`가 false로 바뀌고 확대 상태가 즉시 리셋됨을 확인했고, 확대된 상태에서도 닫기 버튼 클릭이 정상 동작함을 확인했다(닫기 버튼은 `.overlay-meta`에 있어 이벤트 리스너가 걸린 `#overlayMediaContent`와 DOM상 무관). 댓글 영역(`.overlay-comments`)도 `#overlayMediaContent` 밖의 별도 형제 요소라 이번 리스너의 영향을 받지 않는다. 데스크톱(1920/1440px)·태블릿(768px)에서 확대 상태로 오버레이를 열고 닫아도 `document.documentElement.scrollWidth` 회귀가 없음을 확인했다.

---

## "컨텐츠 추가" 개선: 라벨 변경 + 클립 슬라이더 확대 + 임시저장 기능

**라벨 변경**: Master 사이드바 탭·`.section-label`의 "영상 추가"를 "컨텐츠 추가"로 바꿨다(당시 단일 `index.html`에서 이 문구는 정확히 이 2곳에만 있었다). `masterAddMap`/`masterPaneAdd`/`startMasterAdd` 등 내부 식별자는 지시서 지침대로 그대로 뒀다 — 화면에 보이지 않는 부분까지 바꾸면 diff만 커지고 실익이 없다.

**클립 슬라이더 확대**: 트랙 4→8px, 손잡이(thumb) 16→24px(1.5배), 히트 영역(`.clip-range-slider`/`.clip-range-input`) 28→32px, webkit 손잡이 `margin-top` 6→4px(새 32px 히트 영역에서 24px 손잡이를 정중앙에 오도록 재계산: `(32-24)/2`). **설계 리뷰에서 발견한 연쇄 수정 지점**: `updateClipRangeFill()`이 손잡이 반지름을 `8px`/`16px`로 하드코딩해 채움 바(fill) 위치를 계산하고 있었는데, 손잡이만 키우고 이 값을 그대로 두면 채움 바가 새 손잡이 위치와 어긋난다 — `12px`/`24px`로 함께 바꿨다. Playwright로 `calc(12px + (100% - 24px) * 비율)` 계산이 실제 손잡이 위치와 정확히 맞아떨어지는지 수치로 확인했다.

**겹치는 두 슬라이더의 클릭 우선순위 보완(두 번 시행착오 끝에 clip-path 방식으로 확정)**: `clipStartRange`/`clipEndRange`는 같은 위치에 겹쳐진 별개의 `<input type=range>`이며, 손잡이가 16→24px로 커지면서 겹치는 영역도 넓어져 원치 않는 쪽이 클릭될 가능성이 커진다는 점을 설계 리뷰가 지적했다.
1. **1차 시도(z-index, pointerdown 시점)**: 실제로 조작을 시작한 input의 `z-index`를 그 시점에 올리는 방식을 먼저 적용했으나, 커밋 전 Codex 리뷰가 "네이티브 히트테스트는 pointerdown이 발생한 시점에 이미 끝나 있어 그 안에서 z-index를 바꿔도 **이번** 클릭에는 소급 적용되지 않는다"고 정확히 지적했다 — 다음 클릭부터만 효과가 있는 반쪽짜리 수정이었다.
2. **2차 시도(pointermove로 사전 배치)**: 커서가 슬라이더 위를 움직일 때마다(`pointermove`) 포인터 위치에 대응하는 슬라이더 값을 역산해 더 가까운 쪽의 `z-index`를 미리 올려두는 방식으로 바꿨으나, 커밋 전 재리뷰에서 "터치의 첫 탭에는 그 전에 hover(`pointermove`)가 없으므로 여전히 안 된다"는 재지적을 받았다 — 데스크톱 마우스에서는 해결됐지만 모바일 터치에서는 근본적으로 같은 문제가 남아 있었다.
3. **최종(clip-path로 히트 영역 자체를 분리)**: z-index 조정을 전부 포기하고, 두 값의 중간점을 기준으로 각 input의 클릭 가능 영역(`clip-path: inset()`)을 절반씩 나누는 방식으로 교체했다 — `updateClipThumbClipPaths()`가 값이 바뀔 때마다(`syncClipSliders`/`applyClipDuration`/`onClipStartInput`/`onClipEndInput`) 중간점을 다시 계산해 두 input의 `clip-path`를 갱신한다. 이 방식은 hover 이력이나 이벤트 순서와 무관하게 **렌더링된 CSS 자체가** 겹치는 영역을 없애므로, 마우스든 터치든 항상 값이 더 가까운 손잡이가 히트테스트를 통과한다.

검증은 실제 `document.elementFromPoint()`로 겹치는 좌표에서 어떤 요소가 실제로 히트되는지 직접 확인했고(hover 없이 곧장 그 좌표를 조회해도 항상 올바른 input을 가리킴), Playwright `touchscreen.tap()`으로 발생시킨 진짜 `TouchEvent`로도 동일하게 확인했다 — 이전 두 시도 모두 이 "hover 없는 첫 접촉" 시나리오에서 실패했던 지점이다.

**임시저장 기능**: `localStorage`(`sa-content-drafts`, 배열)에 id 기반으로 upsert하는 구조로 구현했다(신규 작성은 새 id로 push, 이어서 작성 중이던 draft는 기존 id를 `resumingDraftId` 전역 변수로 기억했다가 같은 id로 교체). DB 스키마 변경 없이 빠르게 적용할 수 있고, "다른 기기·브라우저에서는 안 보이는" 지시서의 의도된 제한과도 맞는다.
- **입력 있음 판정**: `hasModalUnsavedInput()`은 `modalMode==='add'`이고 `paste` 단계를 벗어난 상태에서, 영상은 URL, 이미지는 `cropper` 존재 여부 또는 제목/설명 중 하나라도 있으면 "입력 있음"으로 본다. Master 탭에서 이미 선택되어 넘어온 맵·태그는 판정에서 제외했다(설계 리뷰 지적 — 맵·태그만으로 "입력 있음"을 판정하면 빈 모달을 열자마자 닫아도 매번 확인창이 뜨게 된다).
- **빈 draft 방지(임시저장 버튼 자체를 paste 단계에서 숨김)**: 처음에는 "임시저장" 버튼을 add 모드에서 항상 노출했는데, 커밋 전 Codex 리뷰가 "`paste` 단계에서도 버튼이 보여서 누르면 사실상 빈 draft(맵·태그만 있고 복원할 내용이 없는)가 저장된다"고 지적했다(`hasModalUnsavedInput()`은 `paste` 단계를 이미 "입력 없음"으로 보는데, 버튼 노출 조건이 그 판정과 맞지 않았던 불일치). `showModalStep()`의 버튼 표시 조건에 `step !== 'paste'`를 추가해, 저장할 내용이 있을 수 있는 단계(media/details)에서만 버튼이 보이도록 맞췄다.
- **닫기 경로별 처리**: 실제 존재하는 닫기 경로는 `✕` 아이콘과 "취소" 버튼 둘뿐임을 코드로 확인했다(바깥 클릭·ESC 핸들러는 애초에 없음 — 지시서의 "기존 모든 경로" 표현과 실제 코드가 달랐던 지점, 새로 만들지 않고 이 두 곳에만 적용). `requestCloseModal()`을 새로 만들어 이 두 곳에 연결했고, `hasModalUnsavedInput()`이 `modalMode==='add'`를 전제로 하므로 수정(edit) 모드 닫기는 자동으로 확인 없이 닫힌다. "임시저장" 버튼(신규, `modalDraftBtn`, add 모드에서만 노출)과 등록 성공 시 닫기는 각각 `saveDraftAndClose()`/`closeModal()`을 직접 호출해 이중 확인이 없다.
- **저장 실패 방어**: `localStorage.setItem`이 실패(저장 공간 초과 등)하면 `saveDraftAndClose()`가 모달을 닫지 않고 에러 메시지를 보여준다(설계 리뷰 지적 — 실패했는데 닫아버리면 입력 내용이 그대로 유실된다).
- **이어서 작성(복원)**: 영상 draft는 `openEditModal()`이 이미 쓰던 "`loadClipPlayer(onDurationReady)` 콜백 안에서 `clipStart`/`clipEnd` 복원" 패턴을 그대로 재사용했다 — duration이 확정되기 전에는 슬라이더 `max`가 아직 정해지지 않아 값을 넣어도 무의미하기 때문이다. 콜백 안에서 `resumingDraftId !== draft.id`면 즉시 return해 그 사이 모달이 닫히거나 다른 draft를 열었을 때 잘못된 상태가 반영되는 것을 막는다(같은 파일의 기존 방어 패턴과 동일). 이미지 draft는 원본 파일을 저장하지 않으므로(아래 참고) `paste` 단계에 머무르며 제목/설명/진영만 미리 채워둔다.
- **이미지 임시저장의 의도된 제한**: 지시서가 명시한 대로, 크롭된 이미지(blob) 자체는 저장하지 않고 텍스트 정보(제목/설명/진영/태그/맵)만 저장한다. 이어서 작성 시 이미지는 다시 업로드해야 한다. **"맵 지명" 태그는 이 제한의 영향이 특히 크다** — 설계 리뷰가 지적한 대로, 맵 지명 항목은 애초에 제목·설명·진영 입력란이 없어(고정 제목, 진영 없음) 저장할 수 있는 텍스트 정보가 사실상 맵·태그뿐이다. 즉 맵 지명 이미지를 고르고 닫으면 "거의 빈" draft가 만들어진다 — 지시서가 이미 승인한 제한이므로 범위를 바꾸지 않았고, 이 사실만 보고서에 명시한다.
- **맵 이름 스냅샷**: `draft.mapId`가 기준이며 목록 표시 시 항상 `maps.find(m => m.id === draft.mapId)`로 현재 이름을 우선 조회한다. `draft.mapName`은 그 맵이 삭제된 경우에만 쓰는 폴백 스냅샷이다(설계 리뷰 지적 — 맵 이름이 저장 이후 바뀌면 스냅샷은 낡은 값이 되므로 표시용 기준으로 삼지 않는다).
- **draft 삭제 시점**: 등록 성공 시 `submitItem()`의 `setModalMsg('추가 완료!', 'ok')` 직후, `setTimeout`으로 지연되는 `closeModal()` 호출보다 먼저 `removeDraftById(resumingDraftId)`를 동기적으로 실행한다(설계 리뷰 지적 — 500ms 지연 동안 전역 상태가 바뀔 여지를 없애기 위해 성공이 확정된 시점에 즉시 처리).
- **목록 UI**: Master "컨텐츠 추가" 탭 안(`renderMasterAddTab()`이 `renderContentDraftsList()`도 함께 호출)에 저장 시각 역순으로 표시한다. 제목이 없으면 URL 앞부분 또는 "제목 없음"으로 표시하고, 각 항목에 삭제(🗑) 아이콘을 둔다.

**검증 방법**: 실제 Discord 관리자 세션(만료된 이전 세션의 `refresh_token`으로 자동 갱신됨)으로 전 과정을 왕복 검증했다. 클립 구간(40~60초)을 포함한 영상 draft를 실제로 임시저장 → 목록에 노출 확인 → 클릭해 이어서 작성(클립 슬라이더 값이 정확히 복원됨) → 같은 draft를 다시 임시저장(같은 id로 배열 원소가 교체되고 개수가 늘지 않음을 확인) → 진영 선택 후 실제 등록 완료 → `items` 테이블에 `clip_start=40, clip_end=60`으로 정확히 저장됐음을 Supabase MCP `SELECT`로 확인 → 등록 성공과 동시에 draft가 목록에서 사라짐을 확인 → 테스트로 생성한 항목은 Master "항목 관리" 탭의 기존 삭제 기능으로 정리했다. 이미지 draft(제목/설명/진영만)도 별도로 저장·복원해 `paste` 단계로 돌아가고 텍스트만 채워짐을 확인했다. 빈 상태(paste 단계, 아무 입력 없음)에서 닫으면 확인창 없이 바로 닫히는 것과, 실제 입력이 있을 때 `✕` 클릭 시 "임시저장 하시겠습니까?" 확인창이 뜨는 것을 실제 DOM 클릭 + `confirm` 다이얼로그 처리로 확인했다. 서로 다른 태그(위폭/팁)로 draft 3개를 동시에 만들어 각각 독립적으로 저장·삭제됨을 확인했다. 모바일(390px/320px, 실제 디바이스 에뮬레이션)과 데스크톱(1920/1440px)·태블릿(768px) 모두에서 draft 목록·클립 슬라이더가 뷰포트를 벗어나지 않음을 `document.documentElement.scrollWidth`로 확인했다(최초 측정에서 홈 화면과 Master 화면의 세로 스크롤바 유무 차이로 오해할 뻔한 수치 차이가 있었으나, Master 화면 진입 직후 대비 draft 추가 후 값을 다시 비교해 실제로는 회귀가 전혀 없음을 확인했다).

---

## 그룹 D-2 5단계: Master 댓글 모아보기 탭

**결정**: Master 사이드바에 비활성 상태로 있던 "💬 댓글" 탭을 활성화해, 관리자가 전체 댓글을 한 화면에서 최신순으로 보고 항목으로 이동하거나 삭제할 수 있게 했다. 기존 `switchMasterTab()`/`.master-pane` 패턴, `master-table`/`master-add-row`/`master-select` CSS를 그대로 재사용했고 새 CSS 변수는 추가하지 않았다.

**`items[]`/`maps[]`를 별도 조인 없이 재사용한 이유**: `comments` 조회는 `id, item_id, user_id, author_name, body, created_at`만 가져오고, 항목 제목·맵 이름은 이미 `loadAll()`이 로드해둔 전역 `items[]`/`maps[]`에서 `item_id`/`map_id`로 찾는다. 댓글 수·항목 수 모두 현재 규모에서 별도 쿼리를 정당화할 만큼 크지 않고(다른 Master 탭도 동일하게 전역 배열을 재사용하는 기존 패턴), 매칭되는 `items[]` 원소가 없으면(정상 FK/`ON DELETE CASCADE`에서는 드문 경로) "삭제된 항목"으로만 표시하고 별도 복구 로직은 두지 않았다(지시서 지침).

**전체 조회 + 클라이언트 필터를 선택한 이유와 전환 기준**: `loadMasterComments()`가 `comments` 전체를 `created_at DESC`로 한 번에 가져오고, 맵 필터·검색(본문/작성자/항목 제목, 대소문자 무시)은 `renderMasterCommentsTable()`이 메모리 배열에서만 처리한다(입력할 때마다 재조회하지 않음). 현재 데이터 규모에서는 충분하다고 판단했고, `loadMasterComments()` 안에 `ponytail:` 주석으로 전환 기준(댓글 수가 커져 PostgREST 기본 행 제한이나 렌더 성능 문제가 실제로 발생하면 서버 페이지네이션으로 전환)을 남겨뒀다.

**기존 댓글 삭제 흐름과 Master 목록 갱신 연결 방식**: 기존 `deleteComment(commentId)`는 오버레이 전용 `overlayComments` 배열만 갱신했다. Codex 설계 리뷰에서도 확인된 대로, 이 함수를 그대로 Master에서 호출하면 DB에서는 삭제되지만 Master 목록은 갱신되지 않는다. 별도 Master 전용 삭제 함수(같은 DELETE를 다시 호출)를 새로 만드는 대신, `deleteComment()` 자체가 성공 여부(`boolean`)를 반환하도록 최소 수정했다 — confirm·DELETE 호출·오류 처리를 중복시키지 않는 더 작은 변경이었다. `masterDeleteComment(commentId)`는 이 반환값만 보고 성공 시 `masterComments`에서 해당 댓글을 제거하고 Master 테이블만 다시 그린다.

**`loadAll()`의 comments 탭 처리**: 지시서는 "렌더 또는 재조회" 중 선택하도록 열어뒀는데, 항목·맵 삭제 시 `ON DELETE CASCADE`로 댓글도 함께 삭제될 수 있어 기존 `masterComments` 배열만 재렌더하면 이미 삭제된 댓글이 남아 있을 수 있다는 점을 설계 리뷰에서 확인했다. 그래서 `loadAll()`이 comments 탭이 활성일 때는 `loadMasterComments()`로 재조회하도록 했다(다른 세 탭과 동일하게 `loadAll()`의 활성 탭 분기에 한 줄 추가).

**검증 방법**: 실제 Discord 관리자 세션으로 왕복 검증했다. 일반 화면에서 `<script>alert(1)</script>` 등 특수문자를 포함한 테스트 댓글을 작성 → Master 댓글 탭에서 escapeHtml 처리되어 텍스트로만 표시되고 스크립트가 실행되지 않음을 확인 → 맵 필터(다른 맵 선택 시 0건)·검색(일치어/불일치어 각각 0·1건)이 정상 동작 → "항목 보기"로 실제 오버레이가 열리고 해당 항목의 댓글이 표시됨을 확인 → 오버레이를 닫아도 Master 댓글 탭과 필터 상태가 유지됨을 확인 → Master에서 삭제 버튼 클릭 시 기존 문구("이 댓글을 삭제할까요?") confirm이 뜨고, 수락 시 새로고침 없이 목록이 "0 / 0개"로 즉시 갱신됨을 확인 → 페이지를 완전히 새로고침해 새 네트워크 조회로도 0건임을 재확인해 실제 DB 삭제를 검증했다(테스트 댓글은 이 삭제 자체로 정리 완료, 별도 정리 불필요). Master 재진입 시 기본 탭이 통계로 유지되는 것과 모바일(390px) 폭에서 필터·빈 상태 레이아웃이 깨지지 않는 것도 확인했다.

---

## 그룹 F: 홈 대시보드와 사용자 컨텐츠 승인 흐름

**홈 우선 진입**: 로그인 여부와 관계없이 홈을 첫 화면으로 사용하고, 비로그인 사용자의 주 행동은 크게 노출한 `전체 맵 보기`로 정했다. 즐겨찾기·컨텐츠 추가는 홈에 위치시키되 비로그인 상태에서는 Discord 로그인 필요 안내를 표시한다.

**공개 상태 분리**: `items.status`를 `pending/published/rejected/trashed`로 관리한다. 공개 화면은 클라이언트의 `publicItems()`와 RLS 양쪽에서 `published`만 허용한다. 일반 사용자는 본인 `pending` 등록과 승인 전 수정·숨김만 가능하며, 승인 후에는 관리자만 수정·삭제한다. 관리자가 등록한 항목은 즉시 `published`다.

**작성자 스냅샷**: 소유권은 비공개 `created_by=auth.uid()`로 판단하고, 표시용 이름·아바타 URL은 INSERT 트리거가 Discord 메타데이터에서 덮어쓴다. 클라이언트 입력 위조를 신뢰하지 않으며, 아바타 파일을 복제하지 않고 Discord URL을 직접 사용한다.

**갱신 주기**: DB 반영은 즉시이며 열린 클라이언트는 홈/전체 맵 재진입 시 오래된 데이터 재조회, 탭 복귀, 5분 주기로 갱신한다. 실시간 구독은 현재 규모에서 불필요해 추가하지 않았다.

---

## 한글 타이포그래피 역할 정리

**본문·UI는 Pretendard**: 기존 `Inter`와 사용되지 않던 `Gothic A1`을 제거하고 본문, 입력 요소, 셀렉트 등 기본 UI를 Pretendard로 통일했다. 기존 Paperlogy 제목과 Rajdhani/JetBrains Mono의 영문·숫자 역할은 유지하되, 해당 요소에 한글이 섞이면 Pretendard가 선택되도록 두 번째 fallback으로 지정했다.

**댓글은 조선굴림체**: 오버레이 댓글의 개수, 목록, 빈 상태, 입력창, 버튼을 `ChosunGu`로 묶었다. 댓글 외 UI에는 적용하지 않는다.

**검증**: Chrome의 실제 platform font 정보를 확인해 본문은 Pretendard, 댓글은 조선굴림체, 대형 제목은 기존 Paperlogy로 렌더링되고 `GulimChe` fallback이 사라졌음을 확인했다. 폰트 CDN 요청은 모두 200, 콘솔 오류·경고는 0건이었다.

---

## HTML/CSS/JavaScript 정적 파일 분리

**결정**: 기존 `index.html`의 `<style>` 전체를 `styles.css`, 본문 끝의 메인 `<script>` 전체를 `app.js`로 내용과 선언 순서를 바꾸지 않고 이동했다. `index.html`은 마크업과 외부 자원 연결을 담당한다. Vercel은 프로젝트 루트의 세 정적 파일을 한 번의 배포로 함께 제공하므로 별도 프로젝트·빌드 설정은 추가하지 않았다.

**모듈화하지 않은 이유**: 메인 스크립트에는 전역 상태와 함수가 많고 `index.html`의 인라인 `onclick`이 이 전역 함수를 직접 참조한다. 파일 분리와 동시에 `type="module"`, 기능별 파일, 전역 상태 재설계까지 진행하면 실행 순서와 공개 범위가 바뀌어 회귀 범위가 커진다. 이번 단계는 편집성·브라우저 캐시·코드 그래프 분석 개선에 필요한 최소 분리만 수행했다.

**HTML에 남긴 스크립트**: `<head>`의 `sa-theme` 선적용 IIFE는 CSS 렌더 전에 `data-theme`을 설정해 초기 화면이 잘못된 테마로 번쩍이는 현상을 막는다. 이 짧은 스크립트는 메인 `app.js`와 실행 목적이 달라 의도적으로 인라인 상태를 유지했다.

**후속 작업 기준**: 향후 실제 변경 충돌이나 기능 단위 테스트 필요가 커질 때만 기능별 모듈화를 별도로 설계한다. 그전까지 `app.js`는 classic script, 기존 전역 상태와 함수 순서를 유지한다. LLM 위키는 분리된 파일을 기준으로 code-review-graph를 갱신한 뒤 생성한다.

---

## LLM 위키: 자동 그래프와 추적 문서의 역할 분리

**결정**: code-review-graph의 자동 위키는 `.code-review-graph/wiki/`에 생성하되 캐시 산출물로 유지하고, 저장소에 커밋되는 기준 위키는 `docs/LLM_WIKI.md`로 둔다.

**이유**: 현재 그래프는 176노드와 1,557엣지로 `app.js`의 함수 검색·영향 분석에는 유용하지만, 커뮤니티 기반 자동 위키는 하나의 전역 파일인 `app.js`를 기능별 커뮤니티로 분리하지 못하고 테스트 3개만 문서화했다. 이 자동 결과를 Claude Code의 기준 문서로 쓰면 앱 본체가 없는 것처럼 오해할 수 있다. `LLM_WIKI.md`는 실제 함수명을 기준으로 기능→코드→세부 문서를 연결하고, 자동 위키는 최신 그래프를 직접 조회할 때만 보조 자료로 사용한다.

**갱신 원칙**: 함수명·주요 흐름·파일 역할이 바뀌면 `LLM_WIKI.md`의 작업별 코드 지도를 함께 수정한다. 단순 구현 이력은 이 문서에 복제하지 않고 기존 `CHANGELOG.md`와 `DECISIONS.md`로 연결한다.

---

## 클립 편집 중앙 조작부와 맵 지명 이미지 전용 카드

**클립 조작부**: 디스코드 클립 편집기처럼 `현재 시간 · −10 · 재생/일시정지 · +10 · 전체 길이`를 플레이어 아래 중앙에 모았다. 10초 이동은 선택 구간이 아니라 원본 영상의 `0~clipDuration` 범위에서 이동하고 즉시 일시정지해 새 시작·끝 지점을 찾을 수 있게 했다. 재생 시 현재 위치가 선택 구간 밖이면 `clipStart`(미지정이면 0)로 이동한 뒤 기존 반복 재생을 시작한다.

**기존 타이머 재사용**: 시간 표시용 타이머를 따로 만들지 않고 `syncClipPreviewTimer()`가 현재 시간 표시와 선택 구간 감시를 함께 담당한다. 구간이 아직 없더라도 시간 표시는 갱신하고, `clipStart`/`clipEnd`가 모두 있을 때만 범위 이탈을 시작점으로 되돌린다. 모달 종료 시 기존 `stopClipPreviewTimer()` 하나로 모두 정리된다.

**맵 지명 카드**: 맵 지명은 제목·설명·작성자보다 지도 이미지 자체가 정보이므로 맵 상세, 홈 즐겨찾기·최근 목록, 전체 검색의 세 렌더 경로에서 동일하게 `map-label-card`를 적용하고 메타 영역을 만들지 않는다. 카드 비율은 다른 위폭·팁 카드와 구분되는 4:5 세로형이다.

**`contain`을 사용한 이유**: 최초 브라우저 검증에서 기존 `object-fit: cover`가 실제 지도 이미지 양옆의 지명을 잘라내는 것을 확인했다. 맵 지명은 일부 크롭보다 전체 정보 보존이 우선이므로 해당 타입의 이미지만 `object-fit: contain`으로 덮어쓴다.

---

## 그룹 F-6: 맵 지명 등록 권한과 관리자 휴지통

**맵 지명은 관리자 전용**: 현재 홈의 태그 선택이 별도 드롭다운이 아니라 `prompt()`이므로 새 선택 컴포넌트를 만들지 않고 기존 흐름에서 관리자만 `tagOrder` 전체를, 일반 사용자는 `위폭`/`팁`만 보게 했다. 화면 숨김만으로 끝내지 않고 `openAddModal()`·`submitItem()`·`resumeContentDraft()`에 같은 경계 검사를 두며, 최종 신뢰 경계인 Supabase 일반 사용자 INSERT/UPDATE 정책도 결과 태그를 `위폭`/`팁`으로 제한했다. `items_tag_check`는 세 유효 태그 외 오타·임의 태그 저장도 막는다.

**기존 `trashed` 상태 재사용**: 별도 휴지통 테이블이나 상태 값을 추가하지 않고 기존 `status='trashed'`와 `deleted_at`을 그대로 사용한다. 다만 `pending`/`published`/`rejected` 중 어디로 복구할지 잃지 않도록 nullable `trashed_from_status` 컬럼 하나만 추가했다.

**이전 상태는 DB가 기록**: 일반 사용자가 휴지통 전환 payload에 `trashed_from_status='published'`를 넣고 관리자 복구를 유도할 수 있으므로 클라이언트 값을 신뢰하지 않는다. BEFORE UPDATE 트리거가 실제 OLD.status로 덮어쓰고, 복구도 그 값과 동일한 상태로만 허용한다. 일반 사용자 UPDATE 정책은 기존 행이 `pending`/`rejected`일 때만 적용돼 휴지통에 들어간 뒤 스스로 복구할 수 없다.

**영구 삭제 제외**: Master의 기존 하드 삭제 버튼은 휴지통 이동으로 교체하고 영구 삭제 UI는 만들지 않았다. DB 행과 Storage 이미지를 모두 유지해야 복구가 가능하며, 실제 보관량이 운영 문제가 될 때 Storage 정리까지 포함한 영구 삭제를 별도로 설계한다. 맵 삭제의 기존 CASCADE 영구 삭제는 이번 범위 밖이라 유지한다.

**검증**: 실제 비관리자 Auth 사용자로 `맵 지명` INSERT와 기존 `팁→맵 지명` UPDATE가 모두 RLS `42501`로 거부되고 `팁` INSERT는 허용됨을 트랜잭션 롤백으로 확인했다. 관리자 `맵 지명` INSERT와 `published→trashed→published` 복구, 비관리자의 `trashed_from_status` 위조 덮어쓰기도 실제 DB에서 검증했다. Chromium에서는 권한별 태그 문구, 강제 모달 차단, 활성/휴지통 표와 빈 상태, 합성 복구 행, 390px 가로 넘침 없음을 확인했다.

---

## 그룹 F-4: 승인 대기 맵·태그 필터

**클라이언트 필터 재사용**: 승인 대기 데이터는 관리자 `loadAll()`이 이미 전부 조회하므로 별도 Supabase 쿼리나 상태 계층을 추가하지 않고 `renderMasterApprovals()`에서 `status='pending'`을 고른 뒤 맵·태그 조건을 함께 적용한다. 기존 Master 항목 관리의 `.master-add-row`와 `.master-select`를 재사용해 화면과 모바일 동작을 맞췄다.

**처리 판단 정보 보완**: 필터 결과 수를 `현재 / 전체`로 표시하고 표에 태그 열을 추가했다. 전체 대기 목록이 비었을 때와 필터 결과만 없을 때의 안내를 구분해, 필터가 적용된 상태를 빈 대기열로 오해하지 않게 했다.

**검증**: Node 정적 회귀 테스트로 맵·태그 조건과 결과 집계를 확인하고, Chromium에서 조합 필터 조작과 390px 필터 세로 배치·가로 넘침 없음을 확인했다. DB 스키마와 RLS 변경은 없다.

---

## 구 Admin 완전 폐기

**결정**: 안내 페이지나 리다이렉트를 남기지 않고 Vercel 프로젝트·배포, GitHub 저장소, 로컬 복제본을 모두 삭제했다. Master가 구 Admin의 CRUD·이미지 크롭·클립 구간 지정 기능을 대체했고 F-5에서 기능 격차가 없음을 재확인했기 때문이다.

**검증**: 삭제 후 `github.com/K-Hena/sudden-archive-admin`과 `sudden-archive-admin.vercel.app`이 모두 404를 반환하는지 확인했다. Supabase 데이터와 현재 User 사이트는 삭제 대상에 포함하지 않았다.

---

## 검색 고도화 1단계: `note`/`contributor_name`만 확장, 다른 필드는 제외

**결정**: 전체 검색(`renderGlobalTitleSearch`)과 맵·팀 내 검색(`renderCards`) 모두 기존 `title`/`channel_name` OR 부분일치에 `note`(설명), `contributor_name`(작성자명) 두 필드만 같은 방식으로 추가했다. `tag`, 맵 이름(`maps.name`), `video_url` 등은 이번 범위에서 뺐다.

**이유**: 지시서(`지시서-검색고도화-1단계-필드확장.md`)가 명시적으로 `note`/`contributor_name` 확장만 1단계 범위로 정했다. `tag`는 `'맵 지명'`/`'위폭'`/`'팁'` 셋뿐인 분류값이라 자유 텍스트 검색과 성격이 다르고, 맵 이름은 이미 맵 선택 UI로 탐색되며, `video_url`은 사용자에게 의미 있는 검색어가 아니다.

**null 안전성**: `note`는 `'맵 지명'` 태그 항목에서 항상 `null`로 저장되고(`app.js`의 `note: note || null`), `contributor_name`은 로그인 이전에 등록된 레거시 항목에서 `null`일 수 있다. 두 경우 모두 기존 `channel_name`과 동일하게 `String(value ?? '').toLowerCase().includes(query)` 패턴으로 방어해 에러 없이 매칭에서 자연히 제외된다.

---

## 검색 고도화 2단계: 순수 초성 검색만 지원, 혼합 매칭은 제외

**결정**: 검색어가 `ㄱ`~`ㅎ`(U+3131~U+314E) 자음 문자로만 구성된 "순수 초성"일 때만 초성 매칭(`toChosung()`으로 변환한 필드와 비교)을 시도한다. 완성형 글자나 숫자·영문이 하나라도 섞이면(예: `ㅎ익맵`) 초성 매칭을 시도하지 않고 기존 부분일치만 동작한다.

**이유**: 이 결정은 지시서(`지시서-검색고도화-2단계-초성검색.md`) 상단에 사용자가 이미 확정한 사항으로 명시되어 재논의 대상이 아니었다. 혼합 매칭(예: 검색어의 초성 부분과 완성형 부분을 각각 다르게 처리)까지 지원하면 대상 필드를 초성·원문 두 형태로 동시에 비교해야 해 로직이 복잡해지고, 사용자가 어떤 매칭 규칙이 적용됐는지 예측하기 어려워진다.

**구현**: `renderGlobalTitleSearch`, `renderCards`에 각각 중복돼 있던 `title`/`channel_name`/`note`/`contributor_name` OR 부분일치 로직을 공용 함수 `matchesSearch(fields, query)`로 통합했다(1단계까지는 두 함수에 동일 로직이 인라인으로 중복돼 있었음). 대소문자 정규화는 기존과 동일하게 호출부에서 `query`를 미리 `toLowerCase()`한 뒤 넘기는 방식을 유지해 비초성 분기의 기존 동작을 그대로 보존했다.

**null 안전성**: `toChosung(f ?? '')`로 1단계와 동일하게 방어한다.

---

## 검색 고도화 3단계: 드롭다운 항목 클릭 시 openOverlay로 상세 바로 열기

**결정**: 자동완성 드롭다운 항목을 클릭/탭하면 검색어를 채워 전체 결과 목록에서 다시 필터링하는 대신, `openOverlay(id)`로 해당 항목의 상세 오버레이를 즉시 연다.

**이유**: 지시서(`지시서-검색고도화-3단계-자동완성.md`)는 "기존 검색 실행 동작과 동일하게 처리(필터링/스크롤)"를 가정으로 제시했지만, 실제 코드에는 "검색 실행(제출)"이라는 별도 동작이 없다(검색은 `oninput`으로 이미 즉시 실행됨) — 이 앱에서 항목 클릭 시 유일하게 존재하는 동작은 카드 클릭과 동일한 `openOverlay(id)`뿐이고, 카드별 DOM id도 없어 "필터링/스크롤"에 해당하는 기존 패턴 자체가 없었다. 지시서 상단 "설계 결정 사항"이 "가정이 강하게 어긋나면 진행 전 사용자 확인"이라고 명시했으므로, 이 지점에서 사용자에게 직접 확인해 `openOverlay(id)` 방식으로 확정했다.

**6개 제한과 200ms 디바운스**: 지시서가 명시한 값을 그대로 따랐다(`SEARCH_DROPDOWN_LIMIT = 6`, `SEARCH_DROPDOWN_DEBOUNCE_MS = 200`). 과도한 재계산을 막으면서도 입력 반응이 굼뜨지 않게 하는 균형점으로, 별도 실험 없이 지시서 값을 채택했다.

**빈 상태 추천 제외**: 검색어 입력 전 인기/최근 검색 추천은 지시서가 명시적으로 3단계 범위에서 제외했다("범위 확정" 문구). `docs/TODO.md`에 4단계 후보 아이디어로 별도 기록했다.

**후보 목록 재사용**: 맵·팀 내 검색 드롭다운은 `renderCards()`가 쓰던 map_id+team(+즐겨찾기) 필터 로직을 `currentTeamItems()`로 추출해 그대로 재사용한다. 지시서에 명시된 작업은 아니었지만, 드롭다운과 메인 목록이 같은 후보 범위를 공유해야 결과가 어긋나지 않으므로 필요한 최소 보완으로 판단해 반영했다(Codex 설계 리뷰에서도 적절한 범위로 확인).

---

## 브라우저 히스토리: URL 불변 + 상태 객체만 push, 딥링크는 범위 밖

**결정**: `history.pushState(state, '', location.href)`로 히스토리 항목만 쌓고 주소창 URL은 항상 동일하게 유지한다. 특정 화면을 URL로 바로 여는 딥링크는 이번 범위에 포함하지 않는다.

**이유**: 지시서(`지시서-브라우저뒤로가기-히스토리지원.md`)의 "범위 확정"이 명시적으로 URL 불변·딥링크 제외를 정했다. 이 앱은 라우팅 라이브러리나 서버 사이드 URL 매칭이 없는 순수 정적 사이트라, URL까지 실제 화면과 맞물리게 하려면 `location.href`를 화면마다 다르게 만들고 새로고침 시 그 URL을 해석해 올바른 화면으로 복원하는 별도 로직이 필요해진다. "뒤로가기가 사이트 밖으로 나가는 문제"를 고치는 이번 목표에는 상태 객체만으로 충분하다.

## 브라우저 히스토리: 모달/Master 탭 전환은 히스토리 항목에서 제외

**결정**: 추가/수정 모달은 히스토리에 전혀 기록하지 않는다. Master 대시보드 내부 탭 전환(통계/항목 관리/맵 관리/댓글/승인 대기)도 별도 히스토리 항목으로 취급하지 않는다 — Master는 진입/이탈 한 단계만 기록한다.

**이유**: 지시서의 "범위 확정"이 두 가지를 명시적으로 정했다. 모달까지 히스토리에 넣으면 "뒤로가기 한 번 = 화면 한 단계"라는 단순한 모델이 "뒤로가기 한 번 = 모달 또는 화면 중 하나"로 갈라져 popstate 핸들러가 두 종류의 상태를 구분해야 하는 복잡도가 생긴다. Master 탭 전환도 마찬가지로, 탭 5개 x Master 진입 경로(홈/전체 맵/맵 상세 어디서든 가능)까지 조합하면 상태 종류가 급격히 늘어나는데, 지시서가 "Master 진입/이탈만 한 단계로 취급"하도록 이미 범위를 좁혀놓았다.

**모달이 열린 채로 뒤로가기를 누른 경우의 실제 동작**: 모달은 히스토리 항목이 없으므로, 모달이 열려 있는 동안 뒤로가기를 누르면 popstate가 뜨는 시점엔 이미 "모달 없이 그 아래 화면 기준으로 이동"이 확정된 상태다(모달용 항목이 없으니 그 항목만 소비하는 선택지 자체가 없다). 그래서 popstate 핸들러는 `#addModal`이 실제로 열려 있을 때만 `requestCloseModal()`로 정리(작성 중 입력이 있으면 기존과 동일하게 임시저장 여부를 확인)한 뒤, 팝된 상태에 맞는 화면으로 이동한다. 실제로 Playwright로 "맵 상세에서 모달을 열고 제목을 입력한 뒤 뒤로가기"를 재현해, 모달이 정리되고 배경 화면이 grid로 정확히 이동하는 것을 확인했다.

**모달이 닫혀 있을 때는 requestCloseModal()을 호출하지 않는 이유**: 처음엔 popstate마다 무조건 `requestCloseModal()`을 호출했는데, Codex 커밋 전 리뷰에서 `hasModalUnsavedInput()`이 모달의 `active` 상태 자체는 보지 않고 `modalMode`/`modalType`/입력 필드 값만 본다는 점을 지적받았다. `closeModal()`은 이 필드들을 비우지 않고 `modalMode`도 `'add'`로 남겨두므로, 모달을 이미 정상적으로 닫았거나 등록을 완료한 뒤에도 남아 있는 이전 입력값 때문에, 전혀 무관한 화면 전환(뒤로가기)마다 "임시저장 하시겠습니까?" 프롬프트가 뜨고 확인 시 유령 임시저장이 생길 수 있었다. `document.getElementById('addModal').classList.contains('active')`로 실제 열림 여부를 먼저 확인하도록 고쳐 이 문제를 막았다.

## 브라우저 히스토리: "뒤로가기류" 버튼을 `history.back()`으로 재배선

**결정**: 오버레이 "닫기 ✕", 맵 상세 "← 전체 맵으로", Master 각 탭의 "← 이전 화면으로"(기존 "← 일반 화면으로"/"← 홈으로")는 대상 화면 함수를 직접 호출하는 대신 `history.back()`을 호출하도록 바꿨다. 헤더 로고("홈으로 이동")는 바꾸지 않고 `showHome()` 직접 호출을 유지했다.

**이유**: 지시서에 명시된 작업은 아니었지만, 각 화면 진입 함수에 무조건 `pushState`를 추가하면서 실제로 재현해본 결과 이 재배선 없이는 기능이 깨졌다 — 예를 들어 "닫기 ✕"가 여전히 `closeOverlay()`를 직접 호출하면, 버튼 클릭으로 오버레이를 닫은 뒤 브라우저 뒤로가기를 누르면 오버레이가 다시 열려버렸다(버튼 클릭이 히스토리 항목을 소비하지 않고 그대로 남겨뒀기 때문). Playwright로 "닫기 클릭 → 뒤로가기"와 "Master를 맵 상세에서 진입 → '← 이전 화면으로' 클릭 → 뒤로가기"를 모두 재현해, 재배선 전에는 스택이 꼬이고 재배선 후에는 각각 한 단계씩 정확히 진행되는 것을 직접 확인한 뒤 반영했다. 헤더 로고는 이 "뒤로가기류" 버튼들과 달리 원래부터 "어디서든 홈으로 바로 이동"하는 고정 목적지 유틸리티라 성격이 달라 재배선하지 않았다.

**Master 버튼 라벨 변경**: `history.back()`으로 재배선하면 Master는 진입한 위치(홈/전체 맵/맵 상세 어디든)로 돌아가므로, 항상 "일반 화면"이나 "홈"으로 고정 이동한다고 약속하는 기존 라벨이 실제 동작과 어긋난다. 다섯 버튼 모두 "← 이전 화면으로"로 통일해 라벨이 실제 동작(진입 전 화면 복원)과 일치하게 했다.

---

## 홈 "컨텐츠 추가" 맵 자유 텍스트 입력 → 드롭다운 + 태그 타일 (F-3 후속)

**결정**: `openHomeAdd()`가 `prompt()` 두 번(맵 이름, 태그)으로 받던 자유 텍스트 입력을 제거하고, 모달을 붙여넣기 단계로 바로 연 뒤(`openAddModal(null)`) 붙여넣기 완료 직후 새 `target` 단계(맵 드롭다운 + 태그 타일)를 추가했다(지시서 `지시서-홈컨텐츠추가-맵드롭다운.md`).

**"기존 +위폭/+팁 타일 재사용" 전제는 사실과 다름**: 지시서는 맵 상세뷰의 기존 "+위폭"/"+팁" 타일 버튼을 재사용하라고 했지만, 실제로는 그런 타일이 존재하지 않았다 — 관리자 편집모드 시절 `.add-tile`이 맵 타일·태그 섹션 양쪽에 있었지만 편집모드 전체 제거(그룹 D-2 4단계)로 이미 완전히 삭제된 상태였다. Codex 설계 리뷰로 이를 재확인한 뒤, 재사용할 기존 컴포넌트가 없으므로 같은 모달 안에서 이미 쓰이던 `.paste-box`/`.paste-choices`(붙여넣기 단계의 아이콘+라벨 타일 버튼) 스타일을 태그 타일에 그대로 재사용했다 — 새 CSS를 추가하지 않고도 지시서가 원한 "타일형 버튼" 느낌을 달성하는 가장 작은 변경이었다.

**`openAddModal()`에 대한 최소 변경을 사용자에게 확인 후 허용**: 지시서의 "범위 확정"은 `openAddModal()`/`submitItem()` 내부를 수정하지 말라고 했지만, 목표 흐름("붙여넣기 먼저, 맵·태그는 그 다음")과 구조적으로 충돌했다 — `openAddModal(tag)`는 호출 시 `tag`를 필수로 받고, 호출되자마자 이미 붙여넣은 영상 URL/이미지/클립 상태를 전부 초기화해버리기 때문에 "먼저 붙여넣고 나중에 태그를 정한다"는 순서 자체를 그대로 두고는 만들 수 없었다. Codex 설계 리뷰도 동일하게 지적했고, AskUserQuestion으로 확인한 결과 `openAddModal()`에 한해 최소 변경을 허용하기로 했다(`submitItem()`은 손대지 않음). 실제로 바꾼 부분은 모달 제목 한 줄뿐이다: `tag`가 없으면(`null`) "컨텐츠 추가"로, 있으면 기존처럼 `tag + '에 추가'`로 표시한다. `isMapLabel`/`modalType` 기본값/"맵 지명은 관리자만" 가드는 `tag`가 falsy일 때 자연히 스킵되므로 추가 변경이 필요 없었다.

**태그 확정 시점과 F-6a 재사용**: `currentMap`/`currentMapName`/`modalTag`는 태그 타일 클릭(`confirmAddTarget()`)이 맵 선택 검증을 통과한 직후에만 설정한다 — 맵 드롭다운 `onchange`에서는 설정하지 않는다. Master 2단계에서 같은 이유로 이미 내린 결정(드롭다운 선택/변경만으로 전역 내비게이션 상태가 바뀌는 것을 피함)을 그대로 따랐다. 태그 노출 권한은 `openHomeAdd()`가 쓰던 `isAdminUser ? tagOrder : tagOrder.filter(t => t !== '맵 지명')`(F-6a) 로직을 `enterAddTargetStep()`에 그대로 옮겨왔다.

**영상 + "맵 지명" 조합 방어를 paste 시점에서 타일 시점으로 이동**: 기존 `startVideoFlow()`는 `modalTag === '맵 지명'`이면 영상 붙여넣기 자체를 막았는데, 새 흐름에서는 붙여넣기 시점에 태그가 아직 없어(`modalTag`가 `null`) 이 가드가 항상 무의미해진다(죽은 코드이므로 제거). 대신 `enterAddTargetStep()`이 영상을 붙여넣은 경우(`modalType === 'vid'`) "맵 지명" 타일 자체를 목록에서 제외하고, `confirmAddTarget()`에도 방어적으로 동일 조건의 에러 메시지를 남겨 이중으로 막는다.

**Cropper.js/유튜브 플레이어 생성 시점을 media 단계로 지연**: 기존에는 `startVideoFlow()`/`startImageFlow()`가 붙여넣기 직후 곧바로 `loadClipPlayer()`/`loadImageIntoCropper()`를 호출했다. 새 흐름에서는 그 사이에 `target` 단계가 끼어들며 `#videoWrap`/`#imageWrap`이 `display:none` 상태이므로, 이 시점에 그대로 생성하면 Cropper.js가 숨겨진 컨테이너의 크기를 잘못 읽어 크롭 영역이 깨진다. 그래서 이미지 파일은 `pendingImageFile` 전역에 잠시 보관하고, 실제 `loadImageIntoCropper()`/`loadClipPlayer()` 호출은 `confirmAddTarget()`이 `showModalStep('media')`로 전환해 해당 wrap이 보이는 시점으로 옮겼다.

**임시저장(draft) — 맵·태그 미선택 상태의 draft 지원**: `hasModalUnsavedInput()`은 `modalStep === 'paste'`일 때만 "입력 없음"으로 보므로, 붙여넣기 완료 후 `target` 단계에서 모달을 닫아도(맵·태그 미선택) 이미 채워진 영상/이미지 값 때문에 정상적으로 "입력 있음"으로 판정되어 코드 변경이 필요 없었다. 다만 이 상태로 저장된 draft는 `mapId`/`tag`가 모두 `null`이므로, `resumeContentDraft()`가 이를 이어서 열 때 `draft.tag`가 있으면 기존처럼 바로 `media` 단계(+클립 구간 복원)로, 없으면 `pendingDraftClipRange`에 클립 구간만 잠시 보관해두고 `target` 단계로 복원한 뒤 사용자가 태그를 다시 확정(`confirmAddTarget()`)하면 그 시점에 클립 구간을 이어서 복원하도록 분기를 추가했다. 이미지 draft는(맵·태그 유무와 무관하게) 원본 파일을 저장하지 않는 기존 정책 그대로 `paste` 단계에 머무르며 재업로드를 요구한다 — 이번 변경 전과 동일.

**뒤로가기 전이 규칙**: `target`→`paste`, `media`→`target`, `details`→`media` 3단계로 확장했다(기존은 `media`→`paste`, `details`→`media` 2단계). 수정 모드(`modalMode==='edit'`)는 애초에 `target`/`paste`를 거치지 않으므로 영향 없음.

**popstate 복원 시 조회 기록 중복 방지**: 오버레이 상태 복원은 `openOverlay(itemId, false)`로 호출한다. `trackView` 인자를 생략하면 뒤로가기로 같은 항목을 다시 볼 때마다 조회수·최근 본 컨텐츠가 다시 기록되기 때문이다.

---

## UI 개선: 배지 위계 / 빈 상태 / 아이콘 시스템 통일

지시서(`지시서-UI개선-배지빈상태아이콘.md`)는 Claude(Chat)가 만든 확정 시안 3종(배지, 빈 상태, 아이콘)을 코드에 반영하는 작업이었다. 설계 리뷰(Codex)에서 지시서의 전제와 실제 코드가 다른 지점 여러 곳을 발견해 아래처럼 조정했다.

**배지 적용 대상 — 실제로 존재하는 배지만 재스타일링**: 지시서는 "상세 카드 그리드·전체 제목 검색 결과·자동완성 드롭다운 미리보기 — 배지가 나오는 모든 카드"라고 했지만, 실제로는 진영/공동 배지(`teamBadge()`)가 `renderCards()`(상세 카드 그리드) 한 곳에서만 쓰이고 있었다. 전체 제목 검색(`renderGlobalTitleSearch()`)은 진영 정보를 배지가 아니라 `.note` 텍스트로만 보여주고, 자동완성 드롭다운(`searchDropdownItemHtml()`)은 유형·진영 배지가 아예 없다. 존재하지 않는 배지를 새로 만들어 넣기보다 "기존 배지 위계 변경"이라는 지시서의 원래 취지를 살려, 유형 배지(`.badge.vid`/`.badge.img`, CSS 클래스 공유라 홈·전체검색·상세 3곳에 자동 반영됨)만 핑크로 재색상하고, 진영 배지 재배치는 실제 호출처인 `renderCards()`에만 적용했다. 자동완성 드롭다운은 이번 배지 작업 대상에서 제외했다.

**우상단 배지 충돌 — 즐겨찾기 버튼까지 고려한 3단 배치**: 지시서는 "진영/공동 배지를 우상단으로 이동"이라고만 했지만, 우상단에는 이미 즐겨찾기 별 버튼(`.card-fav`, `top:6px;right:6px;32×32px`)이 있고, "쇼츠" 배지(`.badge.short`)도 우상단(`right:8px`)을 쓰고 있어 그대로 옮기면 셋이 겹친다. Codex 설계 리뷰 권장대로 역할별로 재배치했다: 콘텐츠 유형 정보(영상/이미지 유형 배지 + 쇼츠 배지)는 좌측에 세로로 묶어 쌓고(`top:8px`/`top:28px`), 즐겨찾기는 기존 우상단 자리를 유지하며, 진영 배지만 그 아래(`top:40px`) 우측에 아웃라인 스타일로 배치해 세 요소가 겹치지 않게 했다.

**유형 배지 색상 통일**: `.badge.vid`(기존 `--red`)와 `.badge.img`(기존 `--blue`)를 구분 없이 `--edit-accent`(브랜드 핑크) 배경 + `--edit-accent-ink` 텍스트로 통일했다(`.btn-primary`/`.master-btn.active`가 이미 쓰던 배색 페어링 재사용). 진영 배지는 배경을 투명하게, 테두리·텍스트를 기존 진영색(RED=`--red`, BLUE=`--blue`, 공통=`--muted`) 그대로 써서 아웃라인 스타일로 바꿨다 — 색상 "의미"는 그대로 두고 채움→아웃라인으로 표현 방식만 바꿨다.

**즐겨찾기 별 아이콘 활성색은 기존 `--amber` 유지 (지시서 문구 정정)**: 지시서 3번 항목은 "즐겨찾기 활성은 브랜드 핑크 유지"라고 적었지만, 실제 기존 CSS(`.card-fav.on{color:var(--amber)}`)는 처음부터 amber(호박색)였지 핑크였던 적이 없다. 같은 항목의 상위 원칙("색상은 기존 배색 규칙을 그대로 유지한다 — 아이콘 모양만 교체, 색상 의미는 안 바꿈")을 예시 문구보다 우선해, 별 아이콘은 활성/비활성 모두 같은 `ti-star`(아웃라인) 모양을 쓰고 기존 amber 활성색 CSS는 건드리지 않았다.

**아이콘 교체 범위 — 매핑표 밖까지 같은 원칙으로 확장**: 지시서 본문에 "매핑표 밖도 같은 원칙으로 확장"과 "매핑표에 있는 것만 교체"처럼 서로 다르게 읽히는 문장이 섞여 있어 Codex에게 재확인했다. "먼저 할 일 1번"의 명시적 확장 지시를 우선해 다음도 함께 교체했다: Master 사이드바 탭 아이콘(📊→`ti-chart-bar`, 🗂→`ti-folder`, 🗺→`ti-map-2`, 💬→`ti-message-circle`, ✅→`ti-checklist`), 승인 대기 "항목 보기"(🔍→`ti-eye`), "컨텐츠 추가" 헤딩의 전각 플러스(＋→`ti-plus`), 홈 컨텐츠 추가 target 단계 태그 타일 아이콘(🗺→`ti-map-pin`, 🎯→`ti-target`, 💡→`ti-bulb`, "맵 관리" 탭의 `ti-map-2`와 구분되도록 "맵 지명"은 지점을 가리키는 `ti-map-pin` 사용), 오버레이 "원래 크기로"(↺→`ti-zoom-cancel`), 읽기전용 채널 라벨(🔒→`ti-lock`). `textContent`로 텍스트 전체를 갈아끼우던 동적 토글 아이콘(오버레이 재생/일시정지, 음소거, 클립 재생 아이콘)도 `innerHTML`로 `<i class="ti ...">` 태그를 갈아끼우는 방식으로 통일했다 — Codex 권장대로, 고정된 `<i>` 요소를 만들어두고 클래스만 바꾸는 대신 그 요소를 통째로 교체하는 기존 코드 패턴(`textContent` 대입)을 최소 변경으로 유지하면서 텍스트 이모지 대신 아이콘 마크업을 넣는 쪽을 택했다(별도 리팩터링 없이 diff 최소화).

**아이콘 교체 제외 — 명시적 예외**: 뒤로가기 화살표(`←`)는 지시서가 원래도 범위 밖으로 뒀다. 클립 재생 조작의 `−10`/`+10`은 기호가 아니라 실제 조작값을 나타내는 텍스트 라벨이라 제외했다. `.playicon`은 CSS `border`로 그린 순수 도형이라 애초에 텍스트/이모지가 아니다. `deleteMap()`의 `confirm()` 경고 문구에 쓰인 `⚠️`는 네이티브 `confirm()` 다이얼로그가 HTML을 렌더링하지 못해 `<i>` 태그로 바꿀 수 없으므로 그대로 뒀다(Codex 리뷰에서도 이 지점을 명시적 예외로 두라고 확인).

**Tabler Icons 버전 고정 + jsdelivr CDN**: `@tabler/icons-webfont@3.31.0`을 jsdelivr로 고정 버전 로드했다(이미 `cropperjs`도 같은 jsdelivr CDN 패턴을 쓰고 있어 외부 리소스 로딩 방식이 일관됨). 웹폰트 방식(`<link>` + `<i class="ti ti-이름">`)을 선택해 SVG 스프라이트나 별도 빌드 스텝 없이 기존의 인라인 `onclick` 마크업 구조를 그대로 유지할 수 있었다.

**빈 상태(empty state) 통일 — 지시서 명시 6곳만**: Codex가 코드를 직접 훑어 지시서에 없는 추가 후보(Master 맵 관리/댓글/통계/항목 관리 빈 값, 오버레이 댓글 없음)까지 찾아냈지만, 사용자에게 확인한 결과 지시서가 명시한 6곳(홈의 즐겨찾기 없음/최근 본 컨텐츠 없음/내가 추가한 컨텐츠 없음, 전체 검색 결과 없음, 상세뷰 검색·진영 결과 없음, Master 승인 대기 없음)으로 범위를 한정했다. 공용 함수 `emptyStateHtml(icon, headline, desc, buttonLabel, buttonOnclick)`을 새로 만들어 6곳 모두 재사용한다. 버튼 목적지는 지시서 규칙 그대로: 즐겨찾기·최근 본 컨텐츠 없음 → "전체 맵 둘러보기"(`showMapGrid()`), 검색 결과·승인 대기 없음 → 버튼 없음. "내가 추가한 컨텐츠 없음"의 버튼 목적지는 지시서에 명시가 없었는데, "컨텐츠가 없다 → 추가하면 된다"는 문맥이 명확해 "컨텐츠 추가하기"(`openHomeAdd()`)로 자동 결정했다. 기존 `.home-empty` CSS 클래스는 이 6곳 전용이었고 대체 후 사용처가 없어져 삭제했다.
