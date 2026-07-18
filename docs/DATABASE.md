# DATABASE.md

> Supabase 대시보드를 직접 열람해서 작성한 문서가 아니라, `index.html`(User)과 `sudden-archive-admin/index.html`(레거시 Admin)의 실제 쿼리 코드에서 사용하는 테이블/컬럼만 근거로 정리한 문서다.
> RLS 정책의 정확한 SQL 조건은 AI_CONTEXT.md에 요약된 내용 외에는 코드만으로 확인할 수 없으므로, 확실하지 않은 부분은 그렇다고 명시했다. 정확한 정책 SQL은 Supabase 대시보드에서 직접 확인해야 한다.

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

## items

각 맵에 등록된 영상/이미지 항목.

| 컬럼 | 코드에서 확인된 사용 | 비고 |
|---|---|---|
| id | `it.id`, 삭제/오버레이에서 참조 | PK로 추정 |
| map_id | `maps.id`를 참조하는 FK로 추정 (`items.filter(i => i.map_id === m.id)`) | |
| team | `'red'` \| `'blue'` | RED/BLUE 팀 필터 기준 |
| type | `'vid'` \| `'img'` | 영상/이미지 구분 |
| tag | 문자열. 실제 코드에서 쓰는 값: `'맵 지명'`, `'위폭'`, `'팁'` (`tagOrder` 배열 기준) | 이 외의 값도 저장 가능하지만 정렬 순서 밖으로 밀림 |
| title | 항목 제목. `tag==='맵 지명'`이면 항상 `'맵 전체 지명'`로 고정 저장 | |
| note | 설명, null 가능 | |
| video_url | 유튜브 URL (`type==='vid'`일 때) | 전체 영상 또는 `/shorts/` 모두 지원 |
| img_url | 이미지 URL (`type==='img'`일 때) | Storage 공개 URL |
| clip_start / clip_end | 유튜브 클립 재생 구간(초), null이면 전체 재생 | User 사이트의 항목 추가 모달(뼈대)은 현재 항상 `null`로 저장 — 실제 마킹 UI는 admin 레거시 사이트에만 있고 아직 이식되지 않음 |

## admins

관리자 판별용 테이블.

| 컬럼 | 코드에서 확인된 사용 | 비고 |
|---|---|---|
| user_id | `sb.from('admins').select('user_id').eq('user_id', session.user.id).maybeSingle()`로 로그인한 사용자가 관리자인지 조회 | Supabase Auth의 `auth.users.id`(uuid)와 매칭되는 것으로 추정 |

현재 등록된 대표 계정 `user_id`: `c9642556-c6d5-427d-9e46-92ecfe507f2e` (AI_CONTEXT.md 기준, 코드에서 직접 확인되지는 않음)

---

# RLS (Row Level Security)

코드 동작과 AI_CONTEXT.md 기술 내용으로 미루어 볼 때:

- `maps`, `items`: **SELECT는 로그인 여부와 무관하게 누구나 가능** (User 사이트는 로그인 없이도 목록을 조회함)
- `maps`, `items`: **INSERT/UPDATE/DELETE는 `admins` 테이블에 등록된 `user_id`만 허용** — User 사이트 편집모드가 이 권한에 의존해서 관리자만 CRUD 버튼이 동작하도록 설계됨
- `admins`: 정확한 RLS 정책은 코드로 확인 불가. 최소한 로그인한 본인이 자신의 `user_id`가 등록돼 있는지 SELECT할 수 있어야 현재 코드(`renderAuthArea`)가 동작한다.

정확한 정책 SQL은 Supabase 대시보드의 Authentication/Database > Policies에서 직접 확인 필요.

---

# Storage

버킷: `media`

| 경로 패턴 | 용도 | 코드 위치 |
|---|---|---|
| `maps/{mapId}-{timestamp}.{ext}` | 맵 썸네일 이미지 | User 사이트 `pickMapImage`/`mapImgInput` change 핸들러 |
| `items/{timestamp}.jpg` | 항목 이미지 | 레거시 Admin 사이트 `submitItem`(Cropper.js로 크롭 후 jpg 저장), User 사이트 `submitItem`("맵 지명" 태그 전용, 크롭 없이 원본 그대로 저장 — `docs/DECISIONS.md` 참고) |

업로드 후 `getPublicUrl()`로 공개 URL을 받아 그대로 `maps.img` / `items.img_url`에 저장한다. 즉 버킷은 공개 읽기가 가능해야 현재 서비스가 동작한다.

---

# Auth

- **User 사이트**: Supabase Auth의 **Discord OAuth Provider** (`sb.auth.signInWithOAuth({ provider: 'discord' })`). 닉네임은 `session.user.user_metadata.full_name` 또는 `.name`을 사용.
- **레거시 Admin 사이트** (`sudden-archive-admin`): Supabase Auth의 **이메일/비밀번호 로그인** (`sb.auth.signInWithPassword`). User 사이트의 편집모드와는 별개의 인증 방식이며, AI_CONTEXT.md 기준 이 사이트 자체가 정리(폐기) 예정이다.

두 인증 방식이 당분간 공존한다는 점에 주의 — 자세한 흐름은 `docs/architecture/auth-flow.md` 참고.
