#!/usr/bin/env pwsh
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-PythonCommand {
  $py = Get-Command python -ErrorAction SilentlyContinue
  if ($py) { return $py.Source }
  $py = Get-Command py -ErrorAction SilentlyContinue
  if ($py) { return "$($py.Source) -3" }
  throw "Python no encontrado. Instala Python 3 y vuelve a intentar."
}

function Get-BashCommand {
  $bash = Get-Command bash -ErrorAction SilentlyContinue
  if ($bash) { return $bash.Source }

  $candidates = @(
    "C:\Program Files\Git\bin\bash.exe",
    "C:\Program Files\Git\usr\bin\bash.exe"
  )
  foreach ($candidate in $candidates) {
    if (Test-Path $candidate) { return $candidate }
  }

  throw "Bash no encontrado. Instala Git for Windows (Git Bash) o usa WSL."
}

function Invoke-PythonScript {
  param(
    [Parameter(Mandatory = $true)][string]$ScriptPath,
    [string[]]$ScriptArgs = @(),
    [bool]$IgnoreFailure = $false
  )

  $python = Get-PythonCommand
  $cmd = "$python `"$ScriptPath`" $($ScriptArgs -join ' ')"
  Write-Host "[p0.ps1] $cmd"
  Invoke-Expression $cmd
  if (-not $IgnoreFailure -and $LASTEXITCODE -ne 0) {
    throw "Falló: $cmd"
  }
}

function Invoke-BashP0 {
  param(
    [Parameter(Mandatory = $true)][string[]]$P0Args
  )

  $bash = Get-BashCommand
  $escaped = @()
  foreach ($arg in $P0Args) {
    $escaped += "'" + ($arg -replace "'", "'\"'\"'") + "'"
  }

  $command = ".agent/scripts/p0.sh $($escaped -join ' ')"
  Write-Host "[p0.ps1] bash -lc $command"
  & $bash -lc $command
  if ($LASTEXITCODE -ne 0) {
    throw "Falló: bash -lc $command"
  }
}

function Bootstrap-Compat {
  Write-Host "[bootstrap] syncing repo skills into Codex..."
  Invoke-PythonScript ".agent/scripts/sync_codex_skills.py" @("--mode", "copy")

  Write-Host "[bootstrap] installing curated skills (idempotent)..."
  Invoke-PythonScript ".agent/scripts/install_curated_skills.py" @() $true

  Write-Host "[bootstrap] generating skill UI metadata (agents/openai.yaml)..."
  Invoke-PythonScript ".agent/scripts/generate_agents_yaml.py" @() $true

  Write-Host "[bootstrap] linting skills + config..."
  Invoke-PythonScript ".agent/scripts/lint_skills.py"

  Write-Host "[bootstrap] OK"
}

function Show-Usage {
@"
Protocol Zero CLI (PowerShell)

Commands:
  bootstrap                 Sync skills + install curated + lint + UI metadata
  route <text>              Select skill + chain for a request
  baseline                  Capture safe baseline into docs/closure
  extract [args]            Generate TECHNICAL_ANALYSIS + INVENTORY reports
  mega-plan [args]          Generate MEGA_PLAN template
  kickoff <objective>       session-start + extract + mega-plan
  gates [all|backend|frontend] Run quality gates
  env-audit [args]          Env audit (names only)
  session-start <objective> Start session with evidence
  session-end               End session and archive
  dependabot [args]         Dependabot autopilot
  help                      Show this help

Notes:
  - Algunos comandos delegan a Bash automáticamente (Git Bash/WSL).
"@
}

$rootDir = Resolve-Path (Join-Path $PSScriptRoot "../..")
Set-Location $rootDir

if (-not $args -or $args.Count -eq 0) {
  Show-Usage
  exit 0
}

$cmd = $args[0]
$rest = @()
if ($args.Count -gt 1) { $rest = $args[1..($args.Count - 1)] }

switch ($cmd) {
  "bootstrap" { Bootstrap-Compat; break }
  "route" { Invoke-PythonScript ".agent/scripts/skill_orchestrator.py" $rest; break }
  "baseline" { Invoke-BashP0 @("baseline"); break }
  "extract" { Bootstrap-Compat; Invoke-PythonScript ".agent/scripts/extract_reports.py" $rest; break }
  "mega-plan" { Bootstrap-Compat; Invoke-PythonScript ".agent/scripts/mega_plan_template.py" $rest; break }
  "kickoff" { Invoke-BashP0 (@("kickoff") + $rest); break }
  "gates" { Invoke-BashP0 (@("gates") + $rest); break }
  "env-audit" { Bootstrap-Compat; Invoke-PythonScript ".agent/scripts/env_audit.py" $rest; break }
  "session-start" { Invoke-BashP0 (@("session-start") + $rest); break }
  "session-end" { Invoke-BashP0 @("session-end"); break }
  "dependabot" { Invoke-BashP0 (@("dependabot") + $rest); break }
  "help" { Show-Usage; break }
  default {
    Write-Host "Comando no soportado en PowerShell: $cmd"
    Show-Usage
    exit 2
  }
}
