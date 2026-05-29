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

## Build Web-Only Package

```powershell
.\race-day.cmd web-release
```

Use this package when you only want to upload the static app folder to a web server. It contains `index.html`, `src/`, `data/events.json`, and a few reports. It excludes command scripts, backups, and incoming source downloads.

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

The web-only package also excludes:

- `scripts/`
- `race-day.cmd`
- `data/sources/`

## Smoke Test After Unzip

Full operation package:

1. Open `index.html`.
2. Run `.\race-day.cmd check`.
3. Run `.\race-day.cmd status`.
4. Run `.\race-day.cmd day 2026-06-27`.

Web-only package:

1. Upload or open the folder that contains `index.html`.
2. Confirm `index.html` loads.
3. Confirm the displayed data source line shows local data.
4. Confirm imported month warnings appear for months outside the package data.

The package does not include API keys, passwords, or tokens.
