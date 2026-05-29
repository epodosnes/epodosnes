# Race Day Board Quickstart

Use `race-day.cmd` from the project root for the common operations.

```powershell
.\race-day.cmd status
.\race-day.cmd status 2026-07
.\race-day.cmd coverage-date 2026-06-27
.\race-day.cmd day 2026-06-27
.\race-day.cmd backups
.\race-day.cmd release-check
.\race-day.cmd release
.\race-day.cmd web-release
.\race-day.cmd update 2026 7
.\race-day.cmd retry 2026 7 local-keiba
.\race-day.cmd check
.\race-day.cmd rebuild
```

## Daily Check

```powershell
.\race-day.cmd coverage-date 2026-06-27
.\race-day.cmd day 2026-06-27
```

Use this before checking a specific holiday or day trip. It prints counts by category and refreshes `docs/coverage-report.md`.
The `day` command also writes `docs/day-report.md` and `exports/day-YYYY-MM-DD.txt`.
The normal `rebuild` command writes `docs/day-report.md` for today.

## Monthly Update

```powershell
.\race-day.cmd update 2026 7
```

This runs the five-category monthly import with `--allow-missing`, then rebuilds app data when available categories are promoted.

## Retry One Missing Category

```powershell
.\race-day.cmd retry 2026 7 local-keiba
```

Valid categories are `jra`, `local-keiba`, `boat`, `auto`, and `keirin`.

## Backup Preview

```powershell
.\race-day.cmd backups
.\race-day.cmd backups 30
```

This refreshes `docs/backup-maintenance.md`. It only previews candidates and does not delete files.

## Release

```powershell
.\race-day.cmd release-check
.\race-day.cmd release
.\race-day.cmd web-release
```

The release package is written to `dist/`. It excludes `backups/` and `data/incoming/`.
Use `web-release` when uploading the static app folder to a web server.

## Open The App

```powershell
.\race-day.cmd open
```

This opens `index.html` in the default browser.
