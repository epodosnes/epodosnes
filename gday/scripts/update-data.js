const { spawnSync } = require("child_process");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const nodePath = process.execPath;

const steps = [
  ["Check shared libraries", path.join("scripts", "check-libs.js")],
  ["Check UI", path.join("scripts", "check-ui.js")],
  ["Validate CSV", path.join("scripts", "validate-events-csv.js")],
  ["Backup current data", path.join("scripts", "backup-data.js")],
  ["Import CSV", path.join("scripts", "import-events-csv.js")],
  ["Build browser data", path.join("scripts", "build-sample-data.js")],
  ["Write data report", path.join("scripts", "report-events.js")],
  ["Write calendar report", path.join("scripts", "report-calendar.js")],
  ["Write source report", path.join("scripts", "report-sources.js")],
  ["Write venue report", path.join("scripts", "report-venues.js")],
  ["Write coverage report", path.join("scripts", "report-coverage.js")],
  ["Write day report", path.join("scripts", "report-day.js")],
  ["Write update status", path.join("scripts", "report-update-status.js")],
  ["Write backup report", path.join("scripts", "report-backups.js")],
  ["Write backup maintenance", path.join("scripts", "report-backup-maintenance.js")],
  ["Write dashboard", path.join("scripts", "report-dashboard.js")],
  ["Check generated data", path.join("scripts", "check-data.js")],
];

for (const [label, script] of steps) {
  console.log(`\n== ${label} ==`);
  const result = spawnSync(nodePath, [script], {
    cwd: rootDir,
    encoding: "utf8",
    stdio: "inherit",
  });

  if (result.status !== 0) {
    console.error(`\nFailed: ${label}`);
    process.exit(result.status || 1);
  }
}

console.log("\nData update complete.");
