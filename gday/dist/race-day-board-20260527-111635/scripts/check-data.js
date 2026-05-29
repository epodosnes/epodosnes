const fs = require("fs");
const path = require("path");
const vm = require("vm");

const rootDir = path.resolve(__dirname, "..");
const checks = [];

const paths = {
  csv: path.join(rootDir, "data", "events.csv"),
  sourceDir: path.join(rootDir, "data", "sources"),
  json: path.join(rootDir, "data", "events.json"),
  sample: path.join(rootDir, "src", "sample-data.js"),
  report: path.join(rootDir, "docs", "data-report.md"),
  calendarReport: path.join(rootDir, "docs", "calendar-report.md"),
  sourceReport: path.join(rootDir, "docs", "source-report.md"),
  venueReport: path.join(rootDir, "docs", "venue-report.md"),
  coverageReport: path.join(rootDir, "docs", "coverage-report.md"),
  updateStatus: path.join(rootDir, "docs", "update-status.md"),
  dashboard: path.join(rootDir, "docs", "dashboard.md"),
  backupReport: path.join(rootDir, "docs", "backup-report.md"),
  backupMaintenance: path.join(rootDir, "docs", "backup-maintenance.md"),
  dayReport: path.join(rootDir, "docs", "day-report.md"),
  quickstart: path.join(rootDir, "docs", "quickstart.md"),
  releaseGuide: path.join(rootDir, "docs", "release.md"),
  runnerCmd: path.join(rootDir, "race-day.cmd"),
  runnerPs1: path.join(rootDir, "scripts", "run.ps1"),
  backups: path.join(rootDir, "backups"),
};

const csvRows = readCsvRows(paths.csv);
const sourceCsvFiles = readSourceCsvFiles();
const jsonData = readJson(paths.json);
const sampleData = readSampleData(paths.sample);
const report = fs.existsSync(paths.report) ? fs.readFileSync(paths.report, "utf8") : "";
const calendarReport = fs.existsSync(paths.calendarReport) ? fs.readFileSync(paths.calendarReport, "utf8") : "";
const sourceReport = fs.existsSync(paths.sourceReport) ? fs.readFileSync(paths.sourceReport, "utf8") : "";
const venueReport = fs.existsSync(paths.venueReport) ? fs.readFileSync(paths.venueReport, "utf8") : "";
const coverageReport = fs.existsSync(paths.coverageReport) ? fs.readFileSync(paths.coverageReport, "utf8") : "";
const updateStatus = fs.existsSync(paths.updateStatus) ? fs.readFileSync(paths.updateStatus, "utf8") : "";
const dashboard = fs.existsSync(paths.dashboard) ? fs.readFileSync(paths.dashboard, "utf8") : "";
const backupReport = fs.existsSync(paths.backupReport) ? fs.readFileSync(paths.backupReport, "utf8") : "";
const backupMaintenance = fs.existsSync(paths.backupMaintenance) ? fs.readFileSync(paths.backupMaintenance, "utf8") : "";
const dayReport = fs.existsSync(paths.dayReport) ? fs.readFileSync(paths.dayReport, "utf8") : "";
const quickstart = fs.existsSync(paths.quickstart) ? fs.readFileSync(paths.quickstart, "utf8") : "";
const releaseGuide = fs.existsSync(paths.releaseGuide) ? fs.readFileSync(paths.releaseGuide, "utf8") : "";
const runnerCmd = fs.existsSync(paths.runnerCmd) ? fs.readFileSync(paths.runnerCmd, "utf8") : "";
const runnerPs1 = fs.existsSync(paths.runnerPs1) ? fs.readFileSync(paths.runnerPs1, "utf8") : "";
const latestBackup = getLatestBackup();

check("CSV exists", fs.existsSync(paths.csv));
check("Source CSV directory exists", fs.existsSync(paths.sourceDir));
check("Source CSV files exist", sourceCsvFiles.length > 0, `${sourceCsvFiles.length} files`);
check("JSON exists", fs.existsSync(paths.json));
check("Browser data exists", fs.existsSync(paths.sample));
check("Report exists", fs.existsSync(paths.report));
check("Calendar report exists", fs.existsSync(paths.calendarReport));
check("Source report exists", fs.existsSync(paths.sourceReport));
check("Venue report exists", fs.existsSync(paths.venueReport));
check("Coverage report exists", fs.existsSync(paths.coverageReport));
check("Update status exists", fs.existsSync(paths.updateStatus));
check("Dashboard exists", fs.existsSync(paths.dashboard));
check("Backup report exists", fs.existsSync(paths.backupReport));
check("Backup maintenance exists", fs.existsSync(paths.backupMaintenance));
check("Day report exists", fs.existsSync(paths.dayReport));
check("Quickstart exists", fs.existsSync(paths.quickstart));
check("Release guide exists", fs.existsSync(paths.releaseGuide));
check("Runner command exists", fs.existsSync(paths.runnerCmd));
check("Runner PowerShell exists", fs.existsSync(paths.runnerPs1));
check("CSV has data rows", csvRows > 0, `${csvRows} rows`);
check("JSON has events", Array.isArray(jsonData.events) && jsonData.events.length > 0, `${jsonData.events?.length || 0} events`);
check(
  "Browser data event count matches JSON",
  Array.isArray(jsonData.events) &&
    Array.isArray(sampleData.events) &&
    jsonData.events.length === sampleData.events.length,
  `${jsonData.events?.length || 0} JSON / ${sampleData.events?.length || 0} browser`,
);
check("Report includes event count", report.includes(`- Events: ${jsonData.events?.length || 0}`));
check("Calendar report includes window", calendarReport.includes("- Window:"));
check("Source report includes source root", sourceReport.includes("data/sources"));
check("Venue report includes venue count", venueReport.includes(`- Venues: ${jsonData.events?.length || 0}`));
check("Coverage report includes imported months", coverageReport.includes("## Imported Months"));
check("Update status includes operating rules", updateStatus.includes("## Operating Rules"));
check("Dashboard includes next 7 days", dashboard.includes("## Next 7 Days"));
check("JSON has coverage metadata", Array.isArray(jsonData.coverage?.months), `${jsonData.coverage?.months?.length || 0} months`);
check("Backup report includes summary", backupReport.includes("## Summary"));
check("Backup maintenance is preview-only", backupMaintenance.includes("preview-only"));
check("Day report includes category counts", dayReport.includes("## Category Counts"));
check("Quickstart mentions runner", quickstart.includes("race-day.cmd"));
check("Release guide mentions package", releaseGuide.includes("release package"));
check("Runner command calls PowerShell", runnerCmd.includes("run.ps1"));
check("Runner PowerShell has status command", runnerPs1.includes('"status"'));
check("Generated timestamp exists", Boolean(jsonData.generatedAt));
check("Latest backup has manifest", Boolean(latestBackup && latestBackup.manifest), latestBackup ? latestBackup.name : "none");
check("Latest backup includes generated reports", backupHasGeneratedReports(latestBackup), latestBackup ? latestBackup.name : "none");

const duplicateIds = findDuplicateIds(jsonData.events || []);
check("No duplicate event ids", duplicateIds.length === 0, duplicateIds.join(", "));
check("All events have memo", (jsonData.events || []).every((event) => Boolean(event.memo)));
check("All events have access note", (jsonData.events || []).every((event) => Boolean(event.accessNote)));

const failed = checks.filter((item) => !item.ok);
checks.forEach((item) => {
  const suffix = item.detail ? ` (${item.detail})` : "";
  console.log(`${item.ok ? "OK" : "NG"} ${item.name}${suffix}`);
});

if (failed.length > 0) {
  console.error(`\nData check failed: ${failed.length} issue(s)`);
  process.exit(1);
}

console.log(`\nData check passed: ${checks.length} checks`);

function check(name, ok, detail = "") {
  checks.push({ name, ok: Boolean(ok), detail });
}

function readCsvRows(filePath) {
  if (!fs.existsSync(filePath)) return 0;
  return fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .slice(1)
    .filter((line) => line.trim() !== "").length;
}

function readSourceCsvFiles() {
  if (!fs.existsSync(paths.sourceDir)) return [];
  return fs
    .readdirSync(paths.sourceDir)
    .filter((file) => file.toLowerCase().endsWith(".csv"));
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readSampleData(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(filePath, "utf8"), context);
  return context.window.RaceDayExternalData || {};
}

function getLatestBackup() {
  if (!fs.existsSync(paths.backups)) return null;
  const names = fs
    .readdirSync(paths.backups, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .reverse();

  if (names.length === 0) return null;
  const name = names[0];
  const manifestPath = path.join(paths.backups, name, "backup-manifest.json");
  return {
    name,
    manifest: fs.existsSync(manifestPath) ? readJson(manifestPath) : null,
  };
}

function backupHasGeneratedReports(backup) {
  if (!backup || !backup.manifest || !Array.isArray(backup.manifest.files)) return false;
  const paths = new Set(backup.manifest.files.map((file) => file.path));
  return (
    paths.has("docs/data-report.md") &&
    paths.has("docs/calendar-report.md") &&
    paths.has("docs/source-report.md") &&
    paths.has("docs/venue-report.md") &&
    paths.has("docs/dashboard.md")
  );
}

function findDuplicateIds(events) {
  const seen = new Set();
  const duplicates = new Set();
  events.forEach((event) => {
    if (seen.has(event.id)) {
      duplicates.add(event.id);
    }
    seen.add(event.id);
  });
  return Array.from(duplicates);
}
