# DATABASE.md

> 코드와 Supabase MCP로 확인한 실제 스키마를 기준으로 정리한다.

---

# Supabase 프로젝트

URL: `https://mvyepqqstaipxqfesalv.supabase.co` (User/Admin 두 사이트가 동일한 URL과 anon key를 그대로 사용)

---

# 테이블

## maps

맵(지역) 목록.

| 컬럼 | 코드에서 확인된 사용 | 비고 |
|---|---|---|
| id | `m.id`, `map_id` FK로 참조됨 | PK로 추정 |
| name | 맵 이름, 중복 체크(`addMap`)에 사용 | |
| img | 맵 썸네일 이미지 URL, null 가능 (`m.img ? ... : '이미지 없음'`) | Storage 공개 URL |
| sort_order | 목록 정렬 기준 (`order('sort_order', {ascending:true})`), `addMap()`에서 `max(sort_order)+1`로 자동 증가 | |
| created_at | timestamptz, 기본값 `now()` | 코드에서 직접 참조하지 않음 |

## items

각 맵에 등록된 영상/이미지 항목.

| 컬럼 | 코드에서 확인된 사용 | 비고 |
|---|---|---|
| id | uuid PK, `gen_random_uuid()` 기본값 | 즐겨찾기 `item_id`가 참조 |
| map_id | `maps.id`를 참조하는 FK로 추정 (`items.filter(i => i.map_id === m.id)`) | |
| team | `'red'` \| `'blue'` \| `'none'` | RED/BLUE는 팀 필터 기준. `'none'`은 "진영 없음(공통)" 항목 — TOTAL/FAVORITE 뷰에서만 보이고 RED/BLUE 필터에서는 제외됨(NOT NULL, CHECK `items_team_check`로 세 값만 허용) |
| type | `'vid'` \| `'img'` | 영상/이미지 구분 |
| tag | 문자열. 실제 코드에서 쓰는 값: `'맵 지명'`, `'위폭'`, `'팁'` (`tagOrder` 배열 기준) | 이 외의 값도 저장 가능하지만 정렬 순서 밖으로 밀림 |
| title | 항목 제목. `tag==='맵 지명'`이면 항상 `'맵 전체 지명'`로 고정 저장 | 컬럼 타입은 `text`로 DB 레벨 길이 제한 없음. 항목 추가 모달의 `<input id="mTitle" maxlength="14">`는 **클라이언트 입력 단계에서만** 걸리는 제한이라 DB에는 강제되지 않음(SQL이나 다른 클라이언트로는 더 긴 값도 저장 가능) — 표시 단계에서 `.card .title`의 `text-overflow:ellipsis`(1줄)로 함께 방어. 실측 근거는 `docs/DECISIONS.md` 참고 |
| note | 설명, null 가능 | 컬럼 타입은 `text`로 DB 레벨 길이 제한 없음. `<textarea id="mNote" maxlength="35">`도 title과 동일하게 클라이언트 입력 단계 전용 제한이며, 표시 단계에서 `.card .note`의 `-webkit-line-clamp:2`(2줄)로 함께 방어. 기존에 이 기준보다 긴 값이 저장돼 있어도 수정 모달 로드 시 잘리지 않고 그대로 보인다(자동 절단 없음) |
| video_url | 유튜브 URL (`type==='vid'`일 때) | 전체 영상 또는 `/shorts/` 모두 지원 |
| channel_name | 유튜브 채널명, null 가능 | 신규 영상 등록 시 YouTube oEmbed의 `author_name`을 저장. 기존 항목과 조회 실패 항목은 `null` |
| img_url | 이미지 URL (`type==='img'`일 때) | Storage 공개 URL |
| clip_start / clip_end | 유튜브 클립 재생 구간(초), null이면 전체 재생 | User 사이트 항목 추가 모달에서 버튼(`markClipStart`/`markClipEnd`) 또는 슬라이더로 지정한 값을 저장. 지정하지 않으면 둘 다 `null` (전체 재생) |
| created_at | timestamptz, 기본값 `now()` | 코드에서 직접 참조하지 않음 |

### `items.channel_name` 추가 SQL

```sql
alter table public.items add column channel_name text;
```

nullable 컬럼을 기존 `items` 테이블에 추가하므로 기존 행과 RLS 정책은 변경하지 않는다.

### `items.team` CHECK 변경 SQL

그룹 A에서 적용한 제약 교체 SQL과 복구 SQL이다. 이번 후속 작업에서는 실행하지 않았다.

```sql
alter table public.items drop constraint items_team_check;
alter table public.items
  add constraint items_team_check check (team = any (array['red'::text, 'blue'::text, 'none'::text]));
```

복구 시에는 아래처럼 기존 두 값만 허용한다. 실행 전 `team = 'none'` 행이 없는지 먼저 확인해야 한다.

```sql
alter table public.items drop constraint items_team_check;
alter table public.items
  add constraint items_team_check check (team = any (array['red'::text, 'blue'::text]));
```

2026-07-20 Supabase에서 RED/BLUE/공통(`red`/`blue`/`none`) 값의 실제 INSERT/SELECT 왕복 검증을 완료했다. 세 값 모두 왜곡 없이 저장되고 `items_team_check`를 통과했으며, 사용자 승인 후 테스트 행 3건을 삭제해 `items` 0건으로 복구했다.

## admins

관리자 판별용 테이블.

| 컬럼 | 코드에서 확인된 사용 | 비고 |
|---|---|---|
| user_id | `sb.from('admins').select('user_id').eq('user_id', session.user.id).maybeSingle()`로 로그인한 사용자가 관리자인지 조회 | Supabase Auth의 `auth.users.id`(uuid)와 매칭되는 것으로 추정 |
| created_at | timestamptz, 기본값 `now()` | 코드에서 직접 참조하지 않음 |

현재 등록된 대표 계정 `user_id`: `c9642556-c6d5-427d-9e46-92ecfe507f2e` (AI_CONTEXT.md 기준, 코드에서 직접 확인되지는 않음)

## favorites

Discord 로그인 사용자의 즐겨찾기. Supabase migration `create_user_favorites`로 생성했다.

| 컬럼 | 자료형/제약 |
|---|---|
| user_id | uuid NOT NULL, `auth.users(id)` FK, ON DELETE CASCADE |
| item_id | uuid NOT NULL, `public.items(id)` FK, ON DELETE CASCADE |
| created_at | timestamptz NOT NULL DEFAULT `now()` |

- 복합 PK: `(user_id, item_id)` — 중복 즐겨찾기 방지
- 인덱스: `(user_id, created_at DESC)`, `(item_id)`

## item_clicks

항목(카드) 클릭·재생 횟수를 쌓는 이벤트 로그. 맵 입장이 아니라 카드를 열 때마다 한 행씩 쌓인다. Supabase migration `create_item_clicks_table`로 생성했다. 그룹 D 1단계 범위 — 대시보드 UI는 아직 없다.

| 컬럼 | 자료형/제약 |
|---|---|
| id | uuid PK, `gen_random_uuid()` 기본값 |
| item_id | uuid NOT NULL, `public.items(id)` FK, ON DELETE CASCADE |
| user_id | uuid NULL, `auth.users(id)` FK, ON DELETE SET NULL — 로그인 사용자만 채워지고 비로그인 클릭은 `null` |
| created_at | timestamptz NOT NULL DEFAULT `now()` |

- PK: `id` (favorites와 달리 복합 PK가 아니라 이벤트 로그라 클릭마다 새 행이 쌓인다)
- 인덱스: `(item_id)`, `(user_id)`
- DELETE 정책은 없음 — 클라이언트에서는 삭제 불가, 정리가 필요하면 관리자 권한 SQL로만 가능

---

# RLS (Row Level Security)

코드 동작과 Supabase MCP 확인 기준:

- `maps`, `items`: **SELECT는 로그인 여부와 무관하게 누구나 가능** (User 사이트는 로그인 없이도 목록을 조회함)
- `maps`, `items`: **INSERT/UPDATE/DELETE는 `admins` 테이블에 등록된 `user_id`만 허용** — User 사이트 편집모드가 이 권한에 의존해서 관리자만 CRUD 버튼이 동작하도록 설계됨
- `admins`: RLS 활성화, `pg_policies`로 직접 조회해 확인함 — `admins_select_own`, `본인 확인 가능` 두 개의 SELECT 정책이 있으며 둘 다 조건은 동일하게 `auth.uid() = user_id`(본인 행만 조회 가능, `roles: public`). INSERT/UPDATE/DELETE 정책은 없음 — `admins` 테이블 자체는 클라이언트에서 쓰기 불가하고, 관리자 등록은 Supabase 대시보드/MCP로만 이뤄진다.
- `favorites`: RLS 활성화. `authenticated`에 SELECT/INSERT/DELETE만 부여하고 각 정책이 `(select auth.uid()) = user_id`로 본인 행만 허용한다. `anon` 권한과 UPDATE 정책은 없다.
- `item_clicks`: RLS 활성화. INSERT는 `anon`/`authenticated` 모두 허용하되 `user_id is null or user_id = (select auth.uid())`로 본인 것이거나 `null`만 허용(타인 user_id로의 스푸핑은 차단). SELECT는 `authenticated` 중 `admins`에 등록된 사용자만 가능(`exists (select 1 from admins where admins.user_id = (select auth.uid()))`). UPDATE/DELETE 정책은 없음. 실제 anon 세션으로 REST API를 직접 호출해 검증함 — `user_id: null` INSERT 성공(201), 타인 `user_id` 스푸핑 INSERT 실패(401/`42501`), anon SELECT는 빈 배열 반환(정책이 없어 RLS가 조용히 필터링). **알려진 한계**: 로그인 사용자가 고의로 `user_id: null`을 보내 본인 클릭을 익명 처리하는 것은 이 정책으로 막지 못한다(세션 검증까지는 이번 범위 밖, `docs/DECISIONS.md` 참고). 또한 `.insert().select()`처럼 `Prefer: return=representation`을 쓰면 anon은 SELECT 정책이 없어 INSERT 자체가 롤백된다 — 앱 코드(`trackClick`)는 `.select()`를 체이닝하지 않아 영향 없음.

정책 SQL은 Supabase MCP(`pg_policies` 조회) 또는 대시보드의 Authentication/Database > Policies에서 확인할 수 있다.

---

# Storage

버킷: `media`

| 경로 패턴 | 용도 | 코드 위치 |
|---|---|---|
| `maps/{mapId}-{timestamp}.{ext}` | 맵 썸네일 이미지 | User 사이트 `pickMapImage`/`mapImgInput` change 핸들러 |
| `items/{timestamp}.jpg` | 항목 이미지 (Cropper.js로 크롭 후 jpg로 저장) | 레거시 Admin 사이트 `submitItem`, User 사이트 `submitItem`(맵 지명/위폭/팁 태그 모두 동일하게 적용 — `docs/DECISIONS.md` 참고) |

업로드 후 `getPublicUrl()`로 공개 URL을 받아 그대로 `maps.img` / `items.img_url`에 저장한다. 즉 버킷은 공개 읽기가 가능해야 현재 서비스가 동작한다.

---

# Auth

- **User 사이트**: Supabase Auth의 **Discord OAuth Provider** (`sb.auth.signInWithOAuth({ provider: 'discord' })`). 닉네임은 `session.user.user_metadata.full_name` 또는 `.name`을 사용.
- **레거시 Admin 사이트** (`sudden-archive-admin`): Supabase Auth의 **이메일/비밀번호 로그인** (`sb.auth.signInWithPassword`). User 사이트의 편집모드와는 별개의 인증 방식이며, AI_CONTEXT.md 기준 이 사이트 자체가 정리(폐기) 예정이다.

두 인증 방식이 당분간 공존한다는 점에 주의 — 자세한 흐름은 `docs/architecture/auth-flow.md` 참고.

## 세션 유지 정책

- Supabase 프로젝트 Authentication > Sessions의 "Inactivity timeout"/"Time-box user sessions"는 **Pro 플랜 이상 전용 기능**이며, 이 프로젝트가 속한 조직(`Hena`, organization id `ygkyinzqhvyytddgfjos`)은 2026-07-24 확인 기준 **Free 플랜**이라 대시보드에서도 켤 수 없는 상태(둘 다 미설정/사용 불가)
- 대신 `index.html`의 `initAuth()`에 client-side 30일 비활성 로그아웃을 구현(`INACTIVITY_LIMIT_MS`, `localStorage`의 `sa-last-active` 키). 상세 배경과 한계는 `docs/DECISIONS.md`의 "로그인 세션 유지 정책: 30일 비활성 로그아웃 (client-side)" 참고
- Free → Pro로 업그레이드하면 이 문서를 갱신하고 Supabase 관리형 기능으로 전환을 재검토할 것
