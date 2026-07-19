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
6. PROJECT_STRUCTURE.md
7. DATABASE.md
8. TODO.md

CHANGELOG.md / DECISIONS.md / TROUBLESHOOTING.md / architecture/*.md 는 필요할 때 참고 문서로 열람한다 (매번 전체를 읽을 필요는 없음).

읽기 전에는 작업하지 않는다.

---

# 각 문서의 역할

AI_CONTEXT

프로젝트의 기준 문서(Single Source of Truth). 프로젝트 소개, 서비스 구성, 시스템 구조 요약, 진행 상황 요약, AI 협업 방식, 그리고 아래 세부 문서로 가는 "문서 지도"를 담고 있다.
세부 내용(구조/DB/이력/할일/결정 등)은 각 주제별 문서로 분리되어 있다 (2026-07-18 리팩터링). 전체 문서 목록과 역할은 docs/MAINTENANCE.md의 "문서 책임" 표 참고.

PROJECT_STRUCTURE

실제 폴더/파일 구조, index.html 내부 CSS/HTML/JS 구성

DATABASE

Supabase 테이블/컬럼/RLS/Storage 버킷 구조

CHANGELOG

커밋 단위 변경 이력

TODO

완료/진행중/예정/아이디어 최신 목록

DECISIONS

확정된 설계 결정과 그 이유(세부)

TROUBLESHOOTING

실제로 해결했던 문제와 원인/해결/예방

CODING_RULES

개발 규칙

CLAUDE_CODE_RULES

Claude Code의 행동 규칙

PROMPTS

표준 작업 절차

MAINTENANCE

작업 후 어떤 문서를 함께 확인·수정해야 하는지에 대한 유지보수 규칙

---

# AI 역할 & 워크플로우 모드

이 프로젝트는 상황에 따라 두 가지 모드로 작업한다. Mode 전환은 사용자가 명시적으로 지시하며,
Claude Code가 스스로 "토큰/사용량이 부족하다"고 판단해 임의로 Mode를 바꾸지 않는다.

## Mode A — 기본 워크플로우 (기본값)

1. **Claude (Chat)** — 설계 (AI_CONTEXT상 "Technical Lead")

   - 프로젝트 구조 분석
   - 기능 설계, 아키텍처 설계
   - DB 구조 검토 / SQL 설계 (DB 변경은 Chat과 설계 후 사용자가 Supabase에서 직접 실행)
   - 코드 리뷰, 버그 원인 분석
   - Claude Code 작업 지시서 작성
   - 구현 방향 결정
   - 디자인 시안 제시 (버튼 스타일, 아이콘 등 — 확정 전에는 시안으로만 제시하고, 사용자가 "이대로 만들어줘"라고 확정하면 실제 파일 생성)

   구현 전에 항상 Claude와 설계를 먼저 진행한다.

2. **Claude Code** — 구현 (AI_CONTEXT상 "Developer")

   - 실제 코드 구현
   - 여러 파일 수정
   - 리팩터링
   - Git 작업 (커밋, 푸시 포함)

   담당 업무의 자세한 내용과 행동 규칙은 CLAUDE_CODE_RULES.md 참고.

3. **Codex** — 리뷰어
   - 설계 단계가 아니라 **Claude Code가 코드를 수정한 직후, 턴이 끝나기 전에** 자동으로 검토한다 (`stop-review-gate`, 플러그인 내장 기능)
   - git diff(실제 변경된 코드)를 기준으로 검토하며, 별도 명령이나 창 없이 Claude Code 안에서 자동 실행된다
   - 문제가 발견되면 턴을 멈추고 사용자에게 보고한다
   - 사용자가 `/codex:setup --enable-review-gate`를 한 번 실행해둬야 동작한다 (Claude Code가 대신 실행하지 않음)

## Mode B — 대체 워크플로우 (Claude Code 사용량/토큰 소진 시)

1. **GPT (ChatGPT)** — 설계 (Claude Chat 대체)
   - Mode A의 Claude(Chat) 담당 업무를 동일하게 수행한다
   - 사용자가 ChatGPT와 별도로 설계를 진행하고, 그 결과(지시서)를 Codex에게 전달한다

2. **Codex** — 구현 + 리뷰 (Claude Code 대체)
   - GPT가 작성한 지시서를 바탕으로 코드를 직접 구현한다 (Codex CLI, 또는 Claude Code 안에서는 `codex-rescue` 서브에이전트로 위임 가능)
   - 구현 후에는 Mode A와 동일하게 `stop-review-gate`가 자동으로 리뷰한다
   - Git 작업(커밋/푸시)도 동일한 규칙(CODING_RULES.md, MAINTENANCE.md)을 따른다

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