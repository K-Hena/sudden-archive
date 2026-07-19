# database-flow.md

> `DATABASE.md`가 테이블/컬럼을 다룬다면, 이 문서는 **데이터가 실제로 어떻게 오가는지**(쓰기 → 반영 → 조회)를 코드 기준으로 정리한다.

---

# 전체 그림

```
[레거시 Admin 사이트]         [User 사이트 (일반 사용자 + 편집모드)]
        \                              /
         \                            /
          →      Supabase (공유)     ←
          - 동일 SUPABASE_URL / anon key
          - maps, items, admins, favorites 테이블
          - media Storage 버킷
          - Auth (Discord OAuth / 이메일·비밀번호 공존)
```

두 프론트엔드가 **완전히 같은 Supabase 프로젝트**를 공유한다 (URL/anon key가 코드에 동일하게 하드코딩돼 있음). 별도 백엔드 서버는 없고, 쓰기 권한 통제는 오직 Supabase RLS로만 이뤄진다.

---

# 조회(SELECT)

- `maps`, `items`는 로그인 여부와 무관하게 조회 가능 — User 사이트는 비로그인 상태에서도 `loadAll()`이 정상 동작한다.
- 조회 시점: 페이지 로드 시(`loadAll()`), 그리고 편집모드에서 데이터를 변경할 때마다(`await loadAll()`)마다 **전체 목록을 다시 조회**한다.
- 부분 조회(방금 바뀐 행만 다시 가져오기)나 실시간 구독(Supabase Realtime)은 코드 어디에도 없다 — 확인됨 (`sb.channel`, `.on('postgres_changes', ...)` 같은 코드가 두 파일 어디에도 없음).

---

# 쓰기(INSERT/UPDATE/DELETE)

- `maps`/`items`는 전부 `admins` 테이블 등록 여부에 의존하는 RLS로 막혀 있다 (User/레거시 Admin 구분 없이 동일한 정책 적용). 예외: `favorites`는 관리자 여부와 무관하게 로그인 사용자 본인 행(`user_id = auth.uid()`)만 SELECT/INSERT/DELETE할 수 있는 별도 RLS를 쓴다 (`docs/DATABASE.md` 참고).
- `maps`/`items` 쓰기 흐름은 항상 **"Supabase에 직접 쓰기 → 성공하면 `loadAll()`로 전체 재조회"** 패턴이다. 낙관적 업데이트(Optimistic UI, 로컬 배열을 먼저 바꾸는 방식)는 쓰지 않는다. 예외: `favorites` 쓰기(`toggleFavorite()`)는 DB 성공 후 `loadAll()`을 다시 부르지 않고, 로컬 `favorites` 배열만 직접 갱신한 뒤 현재 화면을 다시 렌더링한다.
- 예: `renameMap()` → `sb.from('maps').update(...)` → 성공 시 `await loadAll()` → `maps`/`items` 전체 재조회 → `renderMapGrid()`

---

# 실시간 반영 범위에 대한 주의 (코드 확인 결과)

- 같은 브라우저 탭 안에서는 변경 직후 `loadAll()`이 실행되므로 바로 반영된다.
- **다른 사용자의 브라우저**에는 실시간으로 반영되지 않는다 — Realtime 구독이 없으므로, 다른 사람이 보고 있는 화면은 새로고침(또는 재방문) 전까지 이전 데이터를 계속 보여준다.
- 이 프로젝트 특성(정적 조회 위주 아카이브)상 지금까지는 문제가 되지 않았을 수 있지만, 즐겨찾기처럼 사용자 상호작용이 늘어나는 기능을 추가할 때는 이 한계를 감안해야 한다.

---

# Storage 쓰기 흐름

```
파일 선택/붙여넣기
  → Cropper.js로 자르기 → jpg blob 생성 (레거시 Admin, User 사이트 편집모드 `loadImageIntoCropper()`/`submitItem()` 모두 사용)
  → sb.storage.from('media').upload(path, file/blob)
  → sb.storage.from('media').getPublicUrl(path)
  → 반환된 공개 URL을 maps.img 또는 items.img_url 컬럼에 저장
```

Storage에 올라간 파일 자체는 별도 권한 체크 없이 공개 URL로 누구나 접근 가능하다는 전제 하에 동작한다 (버킷이 public read여야 프론트가 정상 표시됨 — 정확한 버킷 정책은 Supabase 대시보드 확인 필요).
