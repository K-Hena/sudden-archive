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

이 프로젝트는 현재 규모상 문서를 잘게 쪼개지 않고,
프로젝트 구조 / 진행 상황 / 설계 결정을 AI_CONTEXT.md 한 문서에 통합해서 관리한다.
별도의 PROJECT_STRUCTURE.md, DATABASE.md, CHANGELOG.md, TODO.md, DECISIONS.md, TROUBLESHOOTING.md는 두지 않는다.

| 문서 | 역할 |
|------|------|
| AI_CONTEXT.md | 프로젝트의 기준 문서 (구조, 서비스 구성, 진행 상황, 완료/남은 작업, 확정된 설계 결정 포함) |
| README_AI.md | AI 시작 문서 |
| CODING_RULES.md | 개발 규칙 |
| CLAUDE_CODE_RULES.md | Claude Code 행동 규칙 |
| PROMPTS.md | 표준 작업 절차 |
| MAINTENANCE.md | 문서 유지보수 규칙 (이 문서) |

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

- SQL은 Claude Chat과 설계한 뒤 사용자가 Supabase SQL Editor에서 직접 실행 (Claude Code가 직접 실행하지 않음)
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