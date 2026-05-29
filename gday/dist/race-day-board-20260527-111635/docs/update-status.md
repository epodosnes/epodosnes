# Update Status

- Generated at: 2026-05-27T02:09:31.744Z
- Data generated at: 2026-05-27T02:09:30.721Z
- Events: 1554
- Imported months: 2026-05, 2026-06

## Target Months

### 2026-05

- Status: complete
- Missing: -
- Last import: -

Commands:

```powershell
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\report-coverage.js --month 2026-05
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\import-month.js --year 2026 --month 5 --skip-fetch --skip-update
```

### 2026-06

- Status: partially imported
- Missing: 地方競馬
- Last import: 2026-05-27T00:42:53.540Z / succeeded 中央競馬, ボートレース, オートレース, 競輪 / skipped 地方競馬

Commands:

```powershell
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\report-coverage.js --month 2026-06
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\import-month.js --year 2026 --month 6 --only local-keiba --allow-missing
```

## Operating Rules

- Around the 25th: fetch next month with `--allow-missing`.
- If a category is missing: retry only that category with `--only` after the source publishes it.
- Before using the app for a specific day: run `report-coverage.js --date YYYY-MM-DD`.
- After a successful monthly import: keep the generated backup and do not delete old backups automatically yet.
- If the app shows 0 events: check whether the month is not imported or only partially imported before assuming no races.

