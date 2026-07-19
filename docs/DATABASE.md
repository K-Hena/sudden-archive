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
| title | 항목 제목. `tag==='맵 지명'`이면 항상 `'맵 전체 지명'`로 고정 저장 | |
| note | 설명, null 가능 | |
| video_url | 유튜브 URL (`type==='vid'`일 때) | 전체 영상 또는 `/shorts/` 모두 지원 |
| img_url | 이미지 URL (`type==='img'`일 때) | Storage 공개 URL |
| clip_start / clip_end | 유튜브 클립 재생 구간(초), null이면 전체 재생 | User 사이트 항목 추가 모달에서 버튼(`markClipStart`/`markClipEnd`) 또는 슬라이더로 지정한 값을 저장. 지정하지 않으면 둘 다 `null` (전체 재생) |
| created_at | timestamptz, 기본값 `now()` | 코드에서 직접 참조하지 않음 |

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

2026-07-20 Supabase SELECT 재확인 결과 실제 `items_team_check`는 `red`, `blue`, `none`만 허용하며, `items` 데이터는 0건이었다. RED/BLUE/공통 실제 INSERT는 수행하지 않았으므로 그룹 A 저장 검증은 브라우저 UI와 `submitItem()` insert payload 확인 범위다.

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

---

# RLS (Row Level Security)

코드 동작과 Supabase MCP 확인 기준:

- `maps`, `items`: **SELECT는 로그인 여부와 무관하게 누구나 가능** (User 사이트는 로그인 없이도 목록을 조회함)
- `maps`, `items`: **INSERT/UPDATE/DELETE는 `admins` 테이블에 등록된 `user_id`만 허용** — User 사이트 편집모드가 이 권한에 의존해서 관리자만 CRUD 버튼이 동작하도록 설계됨
- `admins`: RLS 활성화, `pg_policies`로 직접 조회해 확인함 — `admins_select_own`, `본인 확인 가능` 두 개의 SELECT 정책이 있으며 둘 다 조건은 동일하게 `auth.uid() = user_id`(본인 행만 조회 가능, `roles: public`). INSERT/UPDATE/DELETE 정책은 없음 — `admins` 테이블 자체는 클라이언트에서 쓰기 불가하고, 관리자 등록은 Supabase 대시보드/MCP로만 이뤄진다.
- `favorites`: RLS 활성화. `authenticated`에 SELECT/INSERT/DELETE만 부여하고 각 정책이 `(select auth.uid()) = user_id`로 본인 행만 허용한다. `anon` 권한과 UPDATE 정책은 없다.

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
