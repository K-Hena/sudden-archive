# TODO.md

> 실제 `index.html` 코드 상태와 `docs/AI_CONTEXT.md`를 대조해서 작성했다.
> **주의**: AI_CONTEXT.md의 "진행 중인 기능 개발" 체크리스트는 2026-07-18 오전 시점 기준이고, 이후 편집모드 관련 커밋이 여러 건 추가로 반영됐다. 이 문서는 그보다 더 최신인 실제 코드 상태를 기준으로 한다. AI_CONTEXT.md 자체는 이 작업에서 수정하지 않았으므로, 다음에 AI_CONTEXT.md를 갱신할 때 이 TODO 내용을 반영하는 것을 권장한다.

---

# 완료

- 맵 그리드 조회, 맵 상세(RED/BLUE 팀 토글), 태그별(맵 지명/위폭/팁) 카드 그리드
- 유튜브 영상/이미지 재생 오버레이, 클립 구간(`clip_start`/`clip_end`) 지정 시 구간 반복 재생
- 파비콘/앱 아이콘 적용 (조준경 로고)
- User 사이트 디스코드(Discord) OAuth 로그인/로그아웃 (정식 코드, 임시 테스트 코드 제거 완료)
- `admins` 테이블 조회로 관리자 판별 + "관리자" 배지 + "편집모드" 토글 버튼
- 편집모드: 맵 타일 호버 액션(이미지 변경 / 이름 변경 / 삭제), "맵 추가" 타일
- 편집모드: 태그 섹션별 "+추가" 타일, 항목 추가 모달(뼈대) — 영상 링크 저장까지 동작
- 항목이 0개인 태그도 편집모드에서 섹션과 "+추가" 타일이 보이도록 그룹핑 로직 수정
- **"맵 지명" 태그 이미지 업로드** — 파일 선택 또는 Ctrl+V 붙여넣기로 이미지를 Storage `items/{timestamp}.jpg`에 업로드. "맵 지명" 추가 모달에서 유튜브 링크 입력이 함께 노출되던 버그도 함께 수정
- **편집모드 항목(카드) 개별 삭제** — 레거시 Admin의 `deleteItem()` 이식, 카드 호버 시 ✕ 아이콘으로 confirm 후 삭제
- **"위폭"/"팁" 태그 이미지 유형 추가** — 항목 추가 모달에 영상/이미지 유형 토글(`typeToggle`)을 다시 노출, `submitItem()`을 `modalType` 기준으로 일반화. "맵 지명"은 기존처럼 토글 없이 이미지 고정 유지
- **이미지 업로드 크롭 기능** — Cropper.js(`cropperjs@1.6.1`, 레거시 Admin과 동일 CDN) 도입, 맵 지명/위폭/팁 이미지 업로드 모두 크롭 후 jpg로 업로드하도록 교체 (원본 그대로 업로드하던 이전 로직은 제거)
- **영상 클립 구간(`clip_start`/`clip_end`) 마킹** — 레거시 Admin의 `loadClipPlayer()`/`markClipStart()`/`markClipEnd()`/`clearClip()`을 이식(버튼 방식), 여기에 더해 `<input type="range">` 두 개로 구간을 드래그로 지정하는 슬라이더 UI를 추가 도입. 버튼과 슬라이더는 같은 `clipStart`/`clipEnd` 전역 변수를 공유해 항상 동기화된다. `submitItem()`이 이제 실제 `clipStart`/`clipEnd` 값을 저장한다(이전엔 항상 `null`)

# 예정 (AI_CONTEXT.md 기준)

- 즐겨찾기 기능: `favorites` 테이블 생성(user_id, item_id, created_at), 위폭/팁 카드에 별 아이콘, 즐겨찾기 우선 정렬
- 관리자용 클립보드 자동인식 붙여넣기 (이미지/영상 URL 자동 판별) — 방향만 확정, 세부 설계 전
- 구 Admin 사이트(`sudden-archive-admin.vercel.app`) 정리 — 편집모드가 CRUD 전체를 대체한 뒤 진행

# 아이디어 (AI_CONTEXT.md "향후 개발 예정", 구체화 전)

- 관리자 기능 확장
- 검색 기능 고도화 — **주의**: 현재 코드에는 검색 기능 자체가 없다. `docs/architecture/search-flow.md` 참고
- UI 개선
- 데이터 관리 기능 강화
