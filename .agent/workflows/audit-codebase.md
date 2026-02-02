---
description: Auditoría profunda de UX y consistencia documental usando RealityCheck y DocuGuard.
---

1. **Initialize Skills**
   - Read `.agent/skills/RealityCheck/SKILL.md` to understand the audit protocol.
   - Read `.agent/skills/DocuGuard/SKILL.md` to understand documentation rules.

2. **Execute RealityCheck (UX Audit)**
   - Run the dynamic discovery step first (`ls src/pages/`).
   - Execute the "Simulación de Usuario Real" for the critical flows identified.
   - **Goal:** Create/Update `docs/REALITY_CHECK_UX.md`.

3. **Execute DocuGuard (Consistency Audit)**
   - Run the "Code Pattern Scan" to find forbidden patterns (console.log, secrets).
   - Check if `docs/ESTADO_ACTUAL.md` aligns with your findings from RealityCheck.
   - **Goal:** Report any discrepancies.

4. **Final Report**
   - Summarize the top 3 Blockers (if any) and top 3 Quick Wins.
   - Ask the user for permission to fix the "Quick Wins" immediately.
