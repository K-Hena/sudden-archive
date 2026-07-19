# MAINTENANCE.md

> AI Documentation Maintenance Guide

---

# 목적

이 문서는 프로젝트 문서를 지속적으로 최신 상태로 유지하기 위한 운영 규칙이다.

새로운 기능을 구현하거나 기존 기능을 변경한 경우,
AI는 반드시 이 문서를 확인하여 필요한 문서를 함께 수정해야 한다.

---

# 기본 원칙

모든 문서는 각자의 책임을 가진다.

하나의 변경 사항이 여러 문서에 영향을 줄 수 있다.

문서를 최신 상태로 유지하는 것은 코드 작성만큼 중요하다.

---

# 문서 책임

AI_CONTEXT.md를 프로젝트의 기준 문서(Single Source of Truth)로 두고, 그 아래에 주제별 세부 문서를 분리해서 관리한다. AI_CONTEXT.md는 각 주제의 핵심 요약과 "어디를 보면 되는지"만 유지하고, 세부 내용은 아래 문서로 옮겨 참조 링크로 연결한다 (2026-07-18 리팩터링).

| 문서 | 역할 |
|------|------|
| AI_CONTEXT.md | 프로젝트의 기준 문서 (프로젝트 소개, 서비스 구성, 시스템 구조 요약, 진행 상황 요약, AI 협업 방식, 문서 지도) |
| README_AI.md | AI 시작 문서 |
| CODING_RULES.md | 개발 규칙 |
| CLAUDE_CODE_RULES.md | Claude Code 행동 규칙 |
| PROMPTS.md | 표준 작업 절차 |
| MAINTENANCE.md | 문서 유지보수 규칙 (이 문서) |
| PROJECT_STRUCTURE.md | 실제 폴더/파일 구조, index.html 내부 CSS/HTML/JS 구성 |
| DATABASE.md | Supabase 테이블/컬럼/RLS/Storage 버킷 구조 |
| CHANGELOG.md | 커밋 단위 변경 이력 |
| TODO.md | 완료/진행중/예정/아이디어 최신 목록 |
| DECISIONS.md | 확정된 설계 결정과 그 이유(세부) |
| TROUBLESHOOTING.md | 실제로 해결했던 문제와 원인/해결/예방 |
| architecture/auth-flow.md | 로그인(Discord OAuth / 이메일·비밀번호) 흐름, 관리자 판별 세부 |
| architecture/search-flow.md | 검색이 아닌 실제 탐색(맵→팀→태그) 흐름 |
| architecture/admin-flow.md | 편집모드 이식 완료/미완료, 레거시 Admin과의 기능 격차 |
| architecture/database-flow.md | 데이터 조회/쓰기/Storage 흐름, Realtime 미사용 등 |

---

# 변경 유형별 확인

## 새 기능 추가

확인

- AI_CONTEXT의 "진행 중인 기능 개발" 섹션 — 완료된 작업 체크, 남은 작업 갱신

필요시

- AI_CONTEXT의 확정된 설계 결정 섹션

---

## 기존 기능 수정

확인

- 특별히 없음 (커밋 메시지로 변경 이력을 남기는 것으로 충분)

필요시

- 진행 중인 작업의 일부라면 AI_CONTEXT 진행 상황 갱신

---

## 버그 수정

확인

- 특별히 없음 (커밋 메시지에 원인을 남긴다)

필요시

- 같은 문제가 반복될 가능성이 있다면 AI_CONTEXT에 참고 기록 추가

---

## DB(Supabase) 변경

반드시

- SQL은 Claude Chat과 먼저 설계한다. 실행은 위험도에 따라 다르다: SELECT/INSERT/UPDATE는 Supabase MCP로 Claude Code가 바로 실행 가능, DELETE/DROP/ALTER TABLE/RLS 정책 변경은 사용자에게 명시하고 확인받은 후에만 실행 (docs/CLAUDE_CODE_RULES.md의 "SQL 실행 규칙" 참고)
- AI_CONTEXT의 관련 섹션(시스템 구조 / 설계 결정) 갱신

---

## 프로젝트 구조 변경 (서비스 구성, 시스템 구조)

반드시

- AI_CONTEXT의 서비스 구성 / 시스템 구조 섹션

---

## 설계 변경

반드시

- AI_CONTEXT의 확정된 설계 결정 섹션

---

## 편집모드 / 관리자 기능 이식 작업

확인

- AI_CONTEXT의 "진행 중인 기능 개발" 섹션에서 완료된 작업에 체크, 남은 작업 갱신
- sudden-archive-admin의 로직을 이식한 경우, 이식 범위(이번 단계에 포함/제외한 것)를 남은 작업에 명확히 남긴다

---

## AI 작업 방식 변경

확인

- README_AI
- CODING_RULES
- CLAUDE_CODE_RULES
- PROMPTS

---

# Commit 전 체크리스트

□ AI_CONTEXT 진행 상황(완료된 작업 / 남은 작업) 갱신 필요 여부 확인

□ DB(Supabase) 변경 시 SQL을 사용자가 직접 실행했는지 확인 (Claude Code가 직접 실행하지 않았는지)

□ Git Push 완료 확인 (Vercel 자동 배포 트리거)

문서 수정이 필요 없다면 수정하지 않는다.

---

# 문서 수정 원칙

- 불필요한 수정은 하지 않는다.
- 책임이 다른 문서의 내용을 복사하지 않는다.
- 중복이 필요한 경우에는 유지한다.
- AI_CONTEXT는 프로젝트의 기준 문서로 유지한다.
- 변경 사항이 발생하면 관련 문서를 함께 검토한다.

---

## 문서 자동 동기화 규칙 (모든 작업 종료 시 필수 실행)

사용자가 "AI_CONTEXT.md만 읽고 진행해줘"처럼 특정 문서만 언급했더라도,
작업 종료 직전 아래 체크리스트를 항상 스스로 점검한다.
사용자에게 "어떤 문서를 고쳐야 할지" 판단을 요구하지 않는다 — 그 판단은 항상 이쪽에서 한다.

- 새 기능을 추가/구현했다 → TODO.md에서 해당 항목을 완료로 옮기고, CHANGELOG.md에 한 줄 추가
- 버그를 수정했다 → TROUBLESHOOTING.md에 원인/해결 기록 (재발 방지 가치가 있는 경우만)
- 설계/방식을 새로 결정했다(예: 라이브러리 선택, 구조 변경) → DECISIONS.md에 결정과 이유 기록
- DB 스키마/RLS 관련 SQL을 새로 제시했다 → DATABASE.md 갱신 필요 여부 확인
- 인증/검색/관리자 흐름 관련 코드를 바꿨다 → architecture/ 하위 관련 문서(auth-flow.md, search-flow.md, admin-flow.md, database-flow.md) 갱신 필요 여부 확인
- 폴더/파일 구조가 바뀌었다 → PROJECT_STRUCTURE.md 갱신 필요 여부 확인
- 위 어디에도 해당 안 되는 단순 작업(질문 답변, 사소한 수정 등)이었다 → 문서를 건드리지 않고, 보고서에 "해당 없음"이라고 명시

작업 보고 마지막에 항상 아래 항목을 포함한다:
"이번 작업으로 자동 갱신한 문서: (목록 또는 없음)"