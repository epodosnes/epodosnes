param(
  [Parameter(Position = 0)]
  [string]$Command = "help",

  [Parameter(Position = 1)]
  [string]$Arg1 = "",

  [Parameter(Position = 2)]
  [string]$Arg2 = "",

  [Parameter(Position = 3)]
  [string]$Arg3 = ""
)

$ErrorActionPreference = "Stop"
$RootDir = Split-Path -Parent $PSScriptRoot
$BundledNode = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

function Get-NodePath {
  if (Test-Path -LiteralPath $BundledNode) {
    return $BundledNode
  }

  $node = Get-Command node -ErrorAction SilentlyContinue
  if ($node) {
    return $node.Source
  }

  throw "Node.js was not found. Install Node.js or run inside the Codex workspace runtime."
}

function Invoke-NodeScript {
  param(
    [string]$Script,
    [string[]]$ScriptArgs = @()
  )

  $nodePath = Get-NodePath
  Push-Location $RootDir
  try {
    & $nodePath $Script @ScriptArgs
    if ($LASTEXITCODE -ne 0) {
      exit $LASTEXITCODE
    }
  } finally {
    Pop-Location
  }
}

function Show-Help {
  Write-Host "Race Day Board runner"
  Write-Host ""
  Write-Host "Commands:"
  Write-Host "  status [YYYY-MM]                 Show update status"
  Write-Host "  update YYYY MM                   Fetch/update all five categories"
  Write-Host "  retry YYYY MM category           Retry one category"
  Write-Host "  coverage-month YYYY-MM           Show month coverage"
  Write-Host "  coverage-date YYYY-MM-DD         Show date counts by category"
  Write-Host "  day YYYY-MM-DD                   Write day report and text export"
  Write-Host "  backups [keep]                   Preview backup maintenance"
  Write-Host "  release-check                    Run release readiness checks"
  Write-Host "  release                          Build release folder and zip"
  Write-Host "  web-release                      Build static web folder and zip"
  Write-Host "  check                            Run data and UI checks"
  Write-Host "  rebuild                          Rebuild generated app data"
  Write-Host "  open                             Open index.html"
  Write-Host ""
  Write-Host "Categories: jra, local-keiba, boat, auto, keirin"
}

function Require-Value {
  param(
    [string]$Value,
    [string]$Name
  )
  if ([string]::IsNullOrWhiteSpace($Value)) {
    throw "Missing $Name."
  }
}

switch ($Command.ToLowerInvariant()) {
  "status" {
    if ([string]::IsNullOrWhiteSpace($Arg1)) {
      Invoke-NodeScript "scripts\report-update-status.js"
    } else {
      Invoke-NodeScript "scripts\report-update-status.js" @("--month", $Arg1)
    }
  }
  "update" {
    Require-Value $Arg1 "year"
    Require-Value $Arg2 "month"
    Invoke-NodeScript "scripts\import-month.js" @("--year", $Arg1, "--month", $Arg2, "--allow-missing")
  }
  "retry" {
    Require-Value $Arg1 "year"
    Require-Value $Arg2 "month"
    Require-Value $Arg3 "category"
    Invoke-NodeScript "scripts\import-month.js" @("--year", $Arg1, "--month", $Arg2, "--only", $Arg3, "--allow-missing")
  }
  "coverage-month" {
    Require-Value $Arg1 "month"
    Invoke-NodeScript "scripts\report-coverage.js" @("--month", $Arg1)
  }
  "coverage-date" {
    Require-Value $Arg1 "date"
    Invoke-NodeScript "scripts\report-coverage.js" @("--date", $Arg1)
  }
  "day" {
    Require-Value $Arg1 "date"
    Invoke-NodeScript "scripts\report-day.js" @("--date", $Arg1, "--export-text")
  }
  "backups" {
    if ([string]::IsNullOrWhiteSpace($Arg1)) {
      Invoke-NodeScript "scripts\report-backup-maintenance.js"
    } else {
      Invoke-NodeScript "scripts\report-backup-maintenance.js" @("--keep", $Arg1)
    }
  }
  "release-check" {
    Invoke-NodeScript "scripts\check-data.js"
    Invoke-NodeScript "scripts\check-ui.js"
    Invoke-NodeScript "scripts\check-release.js"
  }
  "release" {
    Invoke-NodeScript "scripts\check-data.js"
    Invoke-NodeScript "scripts\check-ui.js"
    Invoke-NodeScript "scripts\check-release.js"
    Invoke-NodeScript "scripts\package-release.js"
  }
  "web-release" {
    Invoke-NodeScript "scripts\check-data.js"
    Invoke-NodeScript "scripts\check-ui.js"
    Invoke-NodeScript "scripts\check-release.js"
    Invoke-NodeScript "scripts\package-web-release.js"
  }
  "check" {
    Invoke-NodeScript "scripts\check-data.js"
    Invoke-NodeScript "scripts\check-ui.js"
  }
  "rebuild" {
    Invoke-NodeScript "scripts\update-data.js"
  }
  "open" {
    Start-Process (Join-Path $RootDir "index.html")
  }
  default {
    Show-Help
  }
}
