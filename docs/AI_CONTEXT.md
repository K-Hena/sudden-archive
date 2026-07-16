# AI_CONTEXT.md

> Project: Sudden Archive
> Version: 1.0
> Last Updated: 2026-07-17

---

# 프로젝트 소개

Sudden Archive는 서든어택 관련 데이터를 보관하고 검색할 수 있는 웹 서비스이다.

서비스는 사용자 사이트(User)와 관리자 사이트(Admin)로 구성되어 있으며,
관리자는 데이터를 등록 및 수정하고,
사용자는 최신 데이터를 조회하는 구조이다.

---

# 서비스 구성

## User

목적

일반 사용자가 기록을 검색하고 조회하는 서비스

배포

https://sudden-archive.vercel.app/

주요 기능

- 기록 조회
- 검색
- 상세 정보 확인
- 공개 데이터 이용

---

## Admin

목적

관리자가 서비스를 운영하는 관리 시스템

배포

https://sudden-archive-admin.vercel.app/

주요 기능

- 데이터 등록
- 데이터 수정
- 데이터 삭제
- 서비스 운영

---

# 시스템 구조

Admin

↓

Supabase

↓

User

관리자에서 등록하거나 수정한 데이터는 Supabase를 통해 사용자 사이트에 즉시 반영된다.

---

# 현재 기술 스택

Frontend

- HTML
- JavaScript
- CSS

Backend

- Supabase

Infrastructure

- GitHub
- Vercel

※ 추후 프로젝트 분석 후 업데이트 예정

---

# AI 협업 방식

## ChatGPT

역할

Technical Lead

담당

- 프로젝트 구조 분석
- 기능 설계
- 아키텍처 설계
- DB 구조 검토
- 코드 리뷰
- 버그 원인 분석
- Claude 프롬프트 작성
- 구현 방향 결정

구현 전에 항상 ChatGPT와 설계를 먼저 진행한다.

---

## Claude

역할

Developer

담당

- 실제 코드 구현
- 여러 파일 수정
- 리팩터링
- Git 작업

Claude는 구현을 담당하며,
설계 변경은 ChatGPT와 협의 후 진행한다.

---

# 개발 원칙

프로젝트의 안정성과 유지보수성을 최우선으로 한다.

새로운 기능은

설계

↓

구현

↓

리뷰

순서로 진행한다.

불필요한 리팩터링은 하지 않는다.

기존 프로젝트 구조를 최대한 유지한다.

필요한 파일만 수정한다.

---

# 개발 프로세스

기능 요청

↓

ChatGPT와 설계

↓

Claude 구현

↓

ChatGPT 코드 리뷰

↓

GitHub Push

↓

Vercel 자동 배포

---

# 현재 프로젝트 상태

현재 완료

- User 사이트 운영
- Admin 사이트 운영
- GitHub 연동
- Vercel 자동 배포
- Supabase 연동

진행 예정

- 프로젝트 전체 구조 분석
- Supabase SQL 분석
- DB 문서 작성
- 아키텍처 문서 작성

---

# 향후 개발 예정

예정 기능

- 관리자 기능 확장
- 검색 기능 고도화
- UI 개선
- 데이터 관리 기능 강화

※ 기능 추가 시 계속 업데이트

---

# AI 운영 원칙

AI는 프로젝트 전체 구조를 우선 이해한 후 작업한다.

기존 기능을 임의로 변경하지 않는다.

불확실한 부분은 추측하지 말고 확인 후 구현한다.

필요 이상으로 프로젝트 구조를 변경하지 않는다.

새로운 라이브러리는 반드시 검토 후 추가한다.

DB 구조는 임의로 변경하지 않는다.

---

# 참고

이 문서는 프로젝트의 기준 문서이다.

프로젝트 변경 사항이 발생하면 항상 최신 상태로 유지한다.
