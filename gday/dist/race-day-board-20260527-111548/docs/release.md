# Release Guide

This project can be released as a static app package. The app itself runs by opening `index.html`.

## Before Release

```powershell
.\race-day.cmd rebuild
.\race-day.cmd release-check
```

Confirm the important reports:

- `docs/update-status.md`
- `docs/coverage-report.md`
- `docs/day-report.md`
- `docs/dashboard.md`

## Build Release Package

```powershell
.\race-day.cmd release
```

The release package is written under `dist/` as both a folder and a `.zip` file.

## Included

- `index.html`
- `src/styles.css`
- `src/sample-data.js`
- `data/events.csv`
- `data/events.json`
- `data/sources/`
- `scripts/`
- `race-day.cmd`
- release and operation docs

## Excluded

- `backups/`
- `data/incoming/`
- `dist/`

## Smoke Test After Unzip

1. Open `index.html`.
2. Run `.\race-day.cmd check`.
3. Run `.\race-day.cmd status`.
4. Run `.\race-day.cmd day 2026-06-27`.

The package does not include API keys, passwords, or tokens.
