# Skills System Upgrade (Protocol Zero) - 2026-02-09

## Summary

Goal: make agentic skills activate and operate with minimal manual steps, with strong guardrails (no secrets, no destructive git, keep `api-minimarket` `verify_jwt=false`).

## New/Upgraded Skills (19 total under `.agent/skills/`)

- Core: `CodeCraft`, `TestMaster`, `DocuGuard`, `DeployOps`, `MigrationOps`, `DebugHound`, `RealityCheck`, `PerformanceWatch`, `SecurityAudit`, `APISync`
- Ops/Planning: `BaselineOps`, `MegaPlanner`, `DependabotOps`, `EnvAuditOps`
- Extraction: `ExtractionOps`
- Session: `SessionOps`
- Integrations: `SendGridOps`, `SecretRotationOps`, `SentryOps`

All skills now include explicit Guardrails and are wired via `.agent/skills/project_config.yaml` (trigger patterns + skill graph).

## Automation Scripts

- Unified CLI wrapper: `.agent/scripts/p0.sh`
- Bootstrap (idempotent): `.agent/scripts/bootstrap.sh`
- Sync repo skills into Codex (symlink): `.agent/scripts/sync_codex_skills.py`
- Install recommended OpenAI curated skills (idempotent): `.agent/scripts/install_curated_skills.py`
- Skill router (text -> skill + chain): `.agent/scripts/skill_orchestrator.py`
- Kickoff (session-start + extract + mega-plan template): `.agent/scripts/kickoff.sh`
- Baseline capture (safe, names-only): `.agent/scripts/baseline_capture.sh`
- Extraction reports: `.agent/scripts/extract_reports.py`
- Mega plan template generator: `.agent/scripts/mega_plan_template.py`
- Quality gates (all/backend/frontend) + log: `.agent/scripts/quality_gates.sh`
- Env audit (names-only): `.agent/scripts/env_audit.py`
- Dependabot 1-PR autopilot: `.agent/scripts/dependabot_autopilot.sh`
- Session start/end automation: `.agent/scripts/session_start.sh`, `.agent/scripts/session_end.sh`
- Skill UI metadata generator: `.agent/scripts/generate_agents_yaml.py`
- Lint skills/config consistency: `.agent/scripts/lint_skills.py`
- Go-live workflow: `.agent/workflows/production-hardening.md`

## Codex Skills Sync

Repo skills are symlinked into `~/.codex/skills/<SkillName>` to make them available as Codex skills.

Also installed OpenAI curated skills into `~/.codex/skills/`:
- `doc`, `gh-fix-ci`, `gh-address-comments`, `playwright`, `sentry`, `security-best-practices`, `security-threat-model`
- Optional extras installed (tier full): `openai-docs`, `vercel-deploy`, `render-deploy`, `netlify-deploy`, `cloudflare-deploy`

Restart Codex to pick up newly installed/synced skills.

## Quick Commands

```bash
cd /home/eevan/ProyectosIA/aidrive_genspark
.agent/scripts/p0.sh bootstrap
.agent/scripts/p0.sh route "<pedido del usuario>"
.agent/scripts/p0.sh extract --with-gates --with-supabase
.agent/scripts/p0.sh kickoff "<objetivo>" --with-gates --with-supabase
.agent/scripts/p0.sh baseline
.agent/scripts/p0.sh mega-plan --objective "<objetivo>"
.agent/scripts/p0.sh gates all
```

## Guardrails

- Never print secrets/JWTs (only secret NAMES).
- Never use destructive git commands (`git reset --hard`, `git checkout -- <file>`, force-push).
- If redeploying `api-minimarket`, always use `--no-verify-jwt` and keep `verify_jwt=false`.
