const fs = require("fs");
const path = require("path");
const { getCategoryLabel } = require("./lib/categories");
const { eventsForDate } = require("./lib/events");
const { addDays, formatDateHeading, getDataAgeDays, startOfDay, toIsoDate } = require("./lib/date");

const rootDir = path.resolve(__dirname, "..");
const dataPath = path.join(rootDir, "data", "events.json");
const outputPath = path.join(rootDir, "docs", "dashboard.md");
const backupRoot = path.join(rootDir, "backups");

const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
const events = Array.isArray(data.events) ? data.events : [];
const today = startOfDay(new Date());
const reportFiles = [
  "docs/data-report.md",
  "docs/calendar-report.md",
  "docs/source-report.md",
  "docs/venue-report.md",
  "docs/coverage-report.md",
  "docs/day-report.md",
  "docs/update-status.md",
  "docs/backup-report.md",
  "docs/backup-maintenance.md",
];

const lines = [];
lines.push("# Dashboard");
lines.push("");
lines.push("## Data");
lines.push("");
lines.push(`- Build: ${data.build || "-"}`);
lines.push(`- Source: ${data.sourceName || "-"}`);
lines.push(`- Generated at: ${data.generatedAt || "-"}`);
lines.push(`- Data age days: ${getDataAgeDays(data.generatedAt) ?? "-"}`);
lines.push(`- Events: ${events.length}`);
lines.push(`- Coverage months: ${data.coverage?.months?.join(", ") || "-"}`);
lines.push("");

lines.push("## Coverage");
lines.push("");
if (!data.coverage || !Array.isArray(data.coverage.months) || data.coverage.months.length === 0) {
  lines.push("- No exact-date coverage metadata.");
} else {
  data.coverage.months.forEach((month) => {
    const missing = data.coverage.missingByMonth?.[month] || [];
    lines.push(`- ${month}: ${missing.length === 0 ? "all categories" : `missing ${missing.map(getCategoryLabel).join(", ")}`}`);
  });
}
lines.push("");

lines.push("## Next 7 Days");
lines.push("");
for (let offset = 0; offset < 7; offset += 1) {
  const date = addDays(today, offset);
  const dailyEvents = eventsForDate(events, date);
  const byCategory = countBy(dailyEvents, (event) => getCategoryLabel(event.category));
  const summary = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ja"))
    .map(([label, count]) => `${label}: ${count}`)
    .join(", ");
  lines.push(`- ${formatDateHeading(date)} (${toIsoDate(date)}): ${dailyEvents.length}${summary ? ` / ${summary}` : ""}`);
}
lines.push("");

lines.push("## Reports");
lines.push("");
reportFiles.forEach((relativePath) => {
  const filePath = path.join(rootDir, relativePath);
  lines.push(`- ${relativePath}: ${fs.existsSync(filePath) ? "OK" : "missing"}`);
});
lines.push("");

lines.push("## Latest Backups");
lines.push("");
const backups = listBackups().slice(0, 5);
if (backups.length === 0) {
  lines.push("- None");
} else {
  backups.forEach((backup) => {
    lines.push(`- ${backup.id}: ${backup.createdAt || "-"} / ${backup.files} files / ${backup.bytes} bytes`);
  });
}
lines.push("");

fs.writeFileSync(outputPath, `${lines.join("\n")}\n`, "utf8");
console.log(`Wrote ${path.relative(rootDir, outputPath)}`);

function countBy(items, getKey) {
  return items.reduce((counts, item) => {
    const key = getKey(item);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function listBackups() {
  if (!fs.existsSync(backupRoot)) return [];
  return fs
    .readdirSync(backupRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const manifestPath = path.join(backupRoot, entry.name, "backup-manifest.json");
      if (!fs.existsSync(manifestPath)) {
        return { id: entry.name, createdAt: "", files: 0, bytes: 0 };
      }
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
        const files = Array.isArray(manifest.files) ? manifest.files : [];
        return {
          id: entry.name,
          createdAt: manifest.createdAt || "",
          files: files.length,
          bytes: files.reduce((sum, file) => sum + Number(file.bytes || 0), 0),
        };
      } catch (error) {
        return { id: entry.name, createdAt: "", files: 0, bytes: 0 };
      }
    })
    .sort((a, b) => b.id.localeCompare(a.id));
}
