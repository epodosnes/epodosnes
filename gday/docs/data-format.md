# Race Day Data Format

This app reads event data from `src/sample-data.js`.

For normal editing, update `data/events.csv` first, then generate `data/events.json` and `src/sample-data.js`.

Optional source split:

```powershell
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\merge-source-csvs.js
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\split-source-csvs.js
```

```powershell
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\update-data.js
```

To fetch, validate, promote, merge, back up, and rebuild all five official monthly sources at once:

```powershell
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\import-month.js --year 2026 --month 5
```

Useful variants:

```powershell
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\import-month.js --year 2026 --month 5 --fetch-only
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\import-month.js --year 2026 --month 5 --skip-fetch
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\import-month.js --year 2026 --month 5 --skip-update
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\import-month.js --year 2026 --month 6 --allow-missing
```

`--allow-missing` continues with the categories that are available when one official source has not published the requested month yet.
Each monthly import writes a machine-readable report under `data/incoming/import-month/YYYYMM_report.json` and a readable latest report at `docs/import-month-report.md`.

For a safer retry using already downloaded files:

```powershell
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\import-month.js --year 2026 --month 6 --skip-fetch --allow-missing
```

For checking imported files without rebuilding the browser data:

```powershell
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\import-month.js --year 2026 --month 6 --skip-fetch --skip-update --allow-missing
```

To retry only one category later:

```powershell
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\import-month.js --year 2026 --month 6 --only local-keiba --allow-missing
```

Individual steps:

```powershell
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\validate-events-csv.js
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\check-libs.js
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\check-ui.js
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\import-events-csv.js
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\build-sample-data.js
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\report-events.js
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\report-calendar.js
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\report-sources.js
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\report-venues.js
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\report-coverage.js
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\report-update-status.js
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\report-dashboard.js
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\report-backups.js
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\list-backups.js
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\compare-backup.js
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\check-data.js
```

Coverage checks:

```powershell
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\report-coverage.js --month 2026-06
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\report-coverage.js --date 2026-06-27
```

Update operation status:

```powershell
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\report-update-status.js
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\report-update-status.js --month 2026-07
```

Local keiba official monthly import:

```powershell
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\fetch-local-keiba.js --year 2026 --month 5
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\check-local-keiba-import.js 202605
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\promote-local-keiba-import.js 202605
```

This writes official local-keiba download artifacts under `data/incoming/local-keiba/YYYYMM/`. It does not overwrite `data/events.csv`.

To merge official local-keiba rows into the app data, promote the incoming CSV to `data/sources/local-keiba-YYYYMM.csv`, then run the normal source merge and update flow:

```powershell
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\filter-manual-sources.js local-keiba
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\merge-source-csvs.js
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\update-data.js
```

`filter-manual-sources.js` writes `data/sources/manual-base.csv` and keeps the original `data/sources/manual.csv` untouched. When `manual-base.csv` exists, `scripts/merge-source-csvs.js` treats `manual.csv` as a reference file and skips it to avoid duplicate sample rows.

JRA official calendar import:

```powershell
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\fetch-jra-calendar.js --year 2026 --month 5
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\check-jra-import.js 202605
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\promote-jra-import.js 202605
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\filter-manual-sources.js local-keiba,jra
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\merge-source-csvs.js
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\update-data.js
```

BOAT RACE official daily index import:

```powershell
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\fetch-boat-calendar.js --year 2026 --month 5
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\check-boat-import.js 202605
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\promote-boat-import.js 202605
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\filter-manual-sources.js local-keiba,jra,boat
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\merge-source-csvs.js
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\update-data.js
```

AutoRace.JP official calendar import:

```powershell
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\fetch-auto-calendar.js --year 2026 --month 5
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\check-auto-import.js 202605
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\promote-auto-import.js 202605
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\filter-manual-sources.js local-keiba,jra,boat,auto
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\merge-source-csvs.js
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\update-data.js
```

KEIRIN.JP official race schedule import:

```powershell
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\fetch-keirin-calendar.js --year 2026 --month 5
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\check-keirin-import.js 202605
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\promote-keirin-import.js 202605
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\filter-manual-sources.js local-keiba,jra,boat,auto,keirin
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\merge-source-csvs.js
C:\Users\golp\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe scripts\update-data.js
```

The file should assign `window.RaceDayExternalData` before the main inline app script runs.
Generated data also includes `coverage` metadata so the app can show imported months and categories that are missing for the selected month.

```js
window.RaceDayExternalData = {
  build: "sample-data-v1",
  sourceName: "Local sample data",
  generatedAt: "2026-05-24T00:00:00+09:00",
  coverage: {
    months: ["2026-05", "2026-06"],
    missingByMonth: {
      "2026-06": ["local-keiba"]
    }
  },
  events: [
    {
      id: "boat-suminoe",
      category: "boat",
      venueName: "Boat Race Suminoe",
      region: "Osaka",
      startTime: "15:00",
      endTime: "20:45",
      days: [0, 2, 4, 6],
      officialUrl: "https://www.boatrace-suminoe.jp/",
      night: true
    }
  ]
};
```

## Required Fields

- `id`: Stable unique string. Favorites are stored by this value.
- `category`: One of `jra`, `local-keiba`, `boat`, `auto`, `keirin`.
- `venueName`: Display name.
- `region`: Region or prefecture name.
- `startTime`: `HH:mm`, 24-hour format.
- `endTime`: `HH:mm`, 24-hour format.

At least one of the following schedule fields is required:

- `days`: Array of weekday numbers. `0` is Sunday, `6` is Saturday.
- `dates`: Array of exact date strings in `YYYY-MM-DD` format.

## Optional Fields

- `officialUrl`: Link used by the card button. Falls back to the category official site.
- `title`: Event label. Falls back to sample/night labels.
- `night`: Boolean. Enables the night-race badge and night-only filter.
- `memo`: Free text shown in the venue detail modal.
- `accessNote`: Free text shown in the venue detail modal.

## Validation Behavior

The app ignores invalid external records instead of failing the page.

Rejected records include:

- Unknown category.
- Missing `id`, `venueName`, `region`, `startTime`, or `endTime`.
- Invalid time format.
- Empty or invalid `days`.
- Empty or invalid `dates` when `days` is not provided.

If no valid external records are available, the app uses the inline fallback data in `index.html`.

## Current Data Flow

```txt
data/sources/*.csv
  -> scripts/merge-source-csvs.js
  -> data/events.csv
data/events.csv
  -> scripts/split-source-csvs.js
  -> data/sources/by-category/*.csv
data/events.csv
  -> scripts/update-data.js
  -> scripts/check-libs.js
  -> scripts/check-ui.js
  -> scripts/validate-events-csv.js
  -> scripts/backup-data.js
  -> scripts/import-events-csv.js
  -> data/events.json
  -> scripts/build-sample-data.js
  -> src/sample-data.js
  -> scripts/report-events.js
  -> docs/data-report.md
  -> scripts/report-calendar.js
  -> docs/calendar-report.md
  -> scripts/report-sources.js
  -> docs/source-report.md
  -> scripts/report-venues.js
  -> docs/venue-report.md
  -> scripts/report-coverage.js
  -> docs/coverage-report.md
  -> scripts/report-update-status.js
  -> docs/update-status.md
  -> scripts/report-backups.js
  -> docs/backup-report.md
  -> scripts/report-dashboard.js
  -> docs/dashboard.md
  -> scripts/check-data.js
  -> index.html
```

`scripts/validate-events-csv.js` checks the CSV before any generated files are written. `scripts/backup-data.js` copies the current CSV, JSON, browser data, and generated reports into `backups/YYYYMMDD-HHMMSS/` and writes `backup-manifest.json`. `scripts/list-backups.js` prints the available backup ids, timestamps, file counts, and byte totals. `scripts/compare-backup.js` compares a selected backup, or the latest backup by default, with the current files without restoring or overwriting anything. `scripts/import-events-csv.js` converts semicolon-separated `days` and `dates` columns into arrays. `scripts/build-sample-data.js` validates required fields, category names, weekday values, date values, time format, and duplicate ids before writing the generated file.

`scripts/report-events.js` creates `docs/data-report.md` with counts by category, region, weekday, completeness, night events, exact-date events, and a full event list.

`scripts/report-calendar.js` expands `days` and `dates` into a 30-day calendar report at `docs/calendar-report.md`.

`scripts/report-sources.js` creates `docs/source-report.md` with source CSV file counts, row counts, merge inclusion status, and duplicate ID visibility.

`scripts/report-venues.js` creates `docs/venue-report.md` with one row per venue and the next matching event date within 60 days.

`scripts/report-coverage.js` creates `docs/coverage-report.md` with imported months, category coverage, and optional target month/date diagnostics.

`scripts/report-update-status.js` creates `docs/update-status.md` with current/next month status and suggested update commands.

`scripts/report-dashboard.js` creates `docs/dashboard.md` with data freshness, next 7 days, report status, and recent backups.

`scripts/report-backups.js` creates `docs/backup-report.md` with backup counts, latest backup integrity, and a comparison between latest backup files and current files.

`scripts/check-data.js` verifies that CSV, JSON, browser data, report output, generated timestamps, event counts, duplicate ids, memo/access note fields, and the latest backup manifest are all present and consistent.

Shared helpers live under `scripts/lib/` for CSV parsing, date handling, category labels, and event date matching.

The app shows a stale-data warning when `generatedAt` is three or more days old.

## Future Real Data Flow

The safe next step is to generate this file from official or manually curated data.

```txt
official/manual source
  -> normalize to data/events.csv
  -> run scripts/import-events-csv.js
  -> run scripts/build-sample-data.js
  -> write src/sample-data.js
  -> open index.html
```

Do not put API keys, passwords, or other secrets in this file.
