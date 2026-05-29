# Data Update Operations

This is the operating rule for keeping Race Day Board data current without using API keys or secrets.

## Monthly Rhythm

- Around the 25th: fetch next month with `--allow-missing`.
- After the 1st: retry any missing category for the current month.
- Before a day trip or holiday check: verify the exact date with `report-coverage.js --date YYYY-MM-DD`.
- After a successful import: keep the generated backup. Do not automatically delete backups yet.
- To inspect backup growth: run `.\race-day.cmd backups`. This is preview-only.
- If a date shows 0 events: check coverage first, then judge whether it is truly no races.

## Normal Next-Month Update

```powershell
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\import-month.js --year 2026 --month 7 --allow-missing
```

This fetches all five categories, promotes available sources, merges CSV files, backs up current data, and rebuilds the app data.

## Retry Missing Categories

```powershell
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\import-month.js --year 2026 --month 7 --only local-keiba --allow-missing
```

Use this when one source was not published during the first update.

## Verification Commands

Short commands:

```powershell
.\race-day.cmd status
.\race-day.cmd status 2026-07
.\race-day.cmd coverage-date 2026-07-01
.\race-day.cmd day 2026-07-01
.\race-day.cmd backups
.\race-day.cmd release-check
.\race-day.cmd check
```

Direct Node commands:

```powershell
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\report-update-status.js
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\report-coverage.js --month 2026-07
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\report-coverage.js --date 2026-07-01
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\check-data.js
```

## Judgement

- `complete`: all five categories are imported for the month.
- `partially imported`: the month exists but at least one category is missing.
- `not imported`: no exact-date official data exists for that month in the app data.

## Reports To Check

- `docs/update-status.md`: current and next month status with suggested commands.
- `docs/import-month-report.md`: latest monthly import result.
- `docs/coverage-report.md`: imported months and category coverage.
- `docs/backup-maintenance.md`: preview-only backup maintenance candidates.
- `docs/release.md`: release packaging and smoke test steps.
- `docs/dashboard.md`: data age, next seven days, reports, and backups.
