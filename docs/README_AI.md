# README_AI.md

> AI Onboarding Guide

---

# 시작하기

새로운 AI는 반드시 아래 순서대로 문서를 읽는다.

1. AI_CONTEXT.md
2. CODING_RULES.md
3. CLAUDE_CODE_RULES.md
4. PROMPTS.md
5. MAINTENANCE.md

읽기 전에는 작업하지 않는다.

---

# 각 문서의 역할

AI_CONTEXT

프로젝트의 목표, 서비스 구성, 시스템 구조, 진행 중인 기능 개발(완료된 작업 / 남은 작업 / 확정된 설계 결정)까지 포함하는 이 프로젝트의 기준 문서.
이 프로젝트는 별도의 PROJECT_STRUCTURE / DATABASE / TODO / CHANGELOG / DECISIONS 문서를 두지 않고, 이 내용을 모두 AI_CONTEXT 한 문서에 통합해 관리한다.

CODING_RULES

개발 규칙

CLAUDE_CODE_RULES

Claude Code의 행동 규칙

PROMPTS

표준 작업 절차

MAINTENANCE

작업 후 어떤 문서를 함께 확인·수정해야 하는지에 대한 유지보수 규칙

---

# AI 역할

AI_CONTEXT.md 기준으로 이 프로젝트는 두 역할로 나뉜다 (ChatGPT 등 제3의 AI는 현재 사용하지 않는다).

Claude Chat (AI_CONTEXT상 "Technical Lead")

- 프로젝트 구조 분석
- 기능 설계, 아키텍처 설계
- DB 구조 검토 / SQL 설계 (DB 변경은 Chat과 설계 후 사용자가 Supabase에서 직접 실행)
- 코드 리뷰, 버그 원인 분석
- Claude Code 작업 지시서 작성
- 구현 방향 결정
- 디자인 시안 제시 (버튼 스타일, 아이콘 등 — 확정 전에는 시안으로만 제시하고, 사용자가 "이대로 만들어줘"라고 확정하면 실제 파일 생성)

구현 전에 항상 Claude와 설계를 먼저 진행한다.

Claude Code (AI_CONTEXT상 "Developer")

- 실제 코드 구현
- 여러 파일 수정
- 리팩터링
- Git 작업 (커밋, 푸시 포함)

담당 업무의 자세한 내용과 행동 규칙은 CLAUDE_CODE_RULES.md 참고.

---

# 작업 순서

문서 확인

↓

AI_CONTEXT의 진행 상황(완료된 작업 / 남은 작업) 확인

↓

구현

↓

리뷰

↓

Git Push

↓

MAINTENANCE 기준으로 문서 수정 여부 확인

---

# 작업 전 체크리스트

□ 설계를 이해했다.

□ TODO를 확인했다.

□ 추측하지 않는다.

□ 구조를 변경하지 않는다.

---

# 작업 종료 체크리스트

□ 코드 리뷰 완료

□ AI_CONTEXT 진행 상황(완료된 작업 / 남은 작업) 갱신 필요 여부 확인

□ DB(Supabase) 변경 여부 확인 — 변경했다면 SQL은 사용자가 직접 실행했는지 확인

□ Git Push 완료 (Vercel 배포 트리거)

---

새로운 AI는
기존 프로젝트를 존중하며
안정적으로 프로젝트를 발전시키는 것을 목표로 한다.