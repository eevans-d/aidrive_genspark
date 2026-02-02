---
description: Implementación estandarizada de features (Backend + Frontend) siguiendo el protocolo CodeCraft.
---

1. **Initialize Skills**
   - Read `.agent/skills/CodeCraft/SKILL.md` to load the implementation protocol.
   - Read `.agent/skills/project_config.yaml` to verify paths.

2. **Phase A: Planning & Architecture**
   - Ask the user for the "Feature Name" and "Requirements" if not provided.
   - **Crucial:** Create a file `docs/specs/<feature_name>.md` (or similar) summarizing the plan BEFORE coding.

3. **Phase B: Implementation (CodeCraft)**
   - Follow the `CodeCraft` steps:
     1. Create Backend scaffolding & Tests (`Test First`).
     2. Implement Backend logic.
     3. Create Frontend Hooks & UI.

4. **Phase C: Validation**
   - Execute `.agent/skills/TestMaster/SKILL.md` instructions.
   - Run `unit` tests for the feature.
   - **Stop** if tests fail.

5. **Phase D: Documentation**
   - Execute `.agent/skills/DocuGuard/SKILL.md`.
   - Update `API_README.md` if endpoints changed.
   - Register the new feature in `ESTADO_ACTUAL.md`.

6. **Final Handoff**
   - Show the user the list of created files.
   - Ask for approval to merge/commit.
