# Release Guide

This project can be released as a static app package. The app itself runs by opening `index.html`.

## Before Release

```powershell
.\race-day.cmd rebuild
.\race-day.cmd release-check
```

To refresh data before the release:

```powershell
.\race-day.cmd latest
.\race-day.cmd latest 2026-07
```

You can also start the local admin page and refresh data from buttons:

```powershell
.\race-day.cmd admin
```

When you finish using the admin page, stop the local admin server from the PowerShell window with `Ctrl + C`.

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
It also excludes the local admin page and admin server.

## Included

- `index.html`
- `admin.html`
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
- `admin.html`

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
5. If the local admin server is still running, stop it with `Ctrl + C`.

The package does not include API keys, passwords, or tokens.
Static web hosting cannot run the data fetch command by itself. Refresh data locally, build a new `web-release`, and upload the new web package.
The admin page is local-only and should not be deployed publicly.
