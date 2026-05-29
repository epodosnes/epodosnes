const fs = require("fs");
const path = require("path");
const { getCategoryLabel } = require("./lib/categories");
const { getDataAgeDays } = require("./lib/date");

const rootDir = path.resolve(__dirname, "..");
const inputPath = path.join(rootDir, "data", "events.json");
const sourceDir = path.join(rootDir, "data", "sources");
const outputPath = path.join(rootDir, "docs", "data-report.md");

const data = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const events = Array.isArray(data.events) ? data.events : [];

const generatedAt = data.generatedAt || "";
const ageDays = getDataAgeDays(generatedAt);
const sourceCsvFiles = listSourceCsvFiles();
const lines = [];

lines.push("# Data Report");
lines.push("");
lines.push(`- Build: ${data.build || "-"}`);
lines.push(`- Source: ${data.sourceName || "-"}`);
lines.push(`- Generated at: ${generatedAt || "-"}`);
lines.push(`- Data age days: ${ageDays === null ? "-" : ageDays}`);
lines.push(`- Source CSV files: ${sourceCsvFiles.length === 0 ? "-" : sourceCsvFiles.join(", ")}`);
lines.push(`- Events: ${events.length}`);
lines.push("");

appendCountSection("By Category", countBy(events, (event) => getCategoryLabel(event.category)));
appendCountSection("By Region", countBy(events, (event) => event.region || "-"));
appendCountSection("By Weekday", countWeekdays(events));
appendCompletenessSection();

const nightEvents = events.filter((event) => event.night);
lines.push("## Night Events");
lines.push("");
if (nightEvents.length === 0) {
  lines.push("- None");
} else {
  nightEvents.forEach((event) => {
    lines.push(`- ${event.venueName} (${getCategoryLabel(event.category)}, ${event.region})`);
  });
}
lines.push("");

const dateEvents = events.filter((event) => Array.isArray(event.dates) && event.dates.length > 0);
lines.push("## Exact Date Events");
lines.push("");
if (dateEvents.length === 0) {
  lines.push("- None");
} else {
  dateEvents.forEach((event) => {
    lines.push(`- ${event.venueName}: ${event.dates.join(", ")}`);
  });
}
lines.push("");

lines.push("## Event List");
lines.push("");
lines.push("| ID | Category | Venue | Region | Time | Days | Dates | Night | Memo | Access |");
lines.push("| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |");
events
  .slice()
  .sort((a, b) => String(a.category).localeCompare(String(b.category)) || String(a.id).localeCompare(String(b.id)))
  .forEach((event) => {
    lines.push(
      [
        event.id,
        getCategoryLabel(event.category),
        event.venueName,
        event.region,
        `${event.startTime}-${event.endTime}`,
        Array.isArray(event.days) && event.days.length > 0 ? event.days.join(";") : "-",
        Array.isArray(event.dates) && event.dates.length > 0 ? event.dates.join(";") : "-",
        event.night ? "yes" : "no",
        event.memo || "-",
        event.accessNote || "-",
      ]
        .map(escapeCell)
        .join(" | ")
        .replace(/^/, "| ")
        .replace(/$/, " |"),
    );
  });
lines.push("");

fs.writeFileSync(outputPath, `${lines.join("\n")}\n`, "utf8");
console.log(`Wrote ${path.relative(rootDir, outputPath)} (${events.length} events)`);

function appendCountSection(title, counts) {
  lines.push(`## ${title}`);
  lines.push("");
  Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ja"))
    .forEach(([label, count]) => {
      lines.push(`- ${label}: ${count}`);
    });
  lines.push("");
}

function countBy(items, getKey) {
  return items.reduce((counts, item) => {
    const key = getKey(item);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function countWeekdays(items) {
  const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const counts = Object.fromEntries(labels.map((label) => [label, 0]));
  items.forEach((event) => {
    if (!Array.isArray(event.days)) return;
    event.days.forEach((day) => {
      const label = labels[day];
      if (label) counts[label] += 1;
    });
  });
  return counts;
}

function appendCompletenessSection() {
  const missingMemo = events.filter((event) => !event.memo).length;
  const missingAccess = events.filter((event) => !event.accessNote).length;
  const missingOfficialUrl = events.filter((event) => !event.officialUrl).length;

  lines.push("## Completeness");
  lines.push("");
  lines.push(`- Missing memo: ${missingMemo}`);
  lines.push(`- Missing access note: ${missingAccess}`);
  lines.push(`- Missing official URL: ${missingOfficialUrl}`);
  lines.push("");
}

function escapeCell(value) {
  return String(value ?? "").replace(/\|/g, "\\|");
}

function listSourceCsvFiles() {
  if (!fs.existsSync(sourceDir)) return [];
  return fs
    .readdirSync(sourceDir)
    .filter((file) => file.toLowerCase().endsWith(".csv"))
    .sort()
    .map((file) => path.join("data", "sources", file).replace(/\\/g, "/"));
}
