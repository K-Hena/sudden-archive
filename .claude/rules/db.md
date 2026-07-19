# DB Rules

Supabase(DB) 관련 파일이나 SQL을 다룰 때 지키는 규칙.

## 규칙
- 테이블 생성, 컬럼 변경, RLS 정책 변경은 SQL 작성만 한다. 절대 직접 실행(supabase CLI, psql 등)하지 않는다.
- SQL은 Claude(Chat)가 설계하고, 사용자가 Supabase SQL Editor에서 직접 실행한다.
- SQL 블록에 제목을 붙일 때는 Supabase SQL Editor 기존 쿼리 목록과 같은 네이밍(소문자, 하이픈 연결, 설명형)을 따른다. 예: `admin-rls-and-storage`
- DB 구조 변경이 필요하다고 판단되면 먼저 사용자에게 확인한다.
