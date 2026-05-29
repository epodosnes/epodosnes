const fs = require("fs");
const path = require("path");
const { CATEGORY_LABELS, getCategoryLabel } = require("./lib/categories");
const { eventsForDate } = require("./lib/events");
const { formatDateHeading } = require("./lib/date");

const rootDir = path.resolve(__dirname, "..");
const dataPath = path.join(rootDir, "data", "events.json");
const reportPath = path.join(rootDir, "docs", "day-report.md");
const exportRoot = path.join(rootDir, "exports");

const options = parseArgs(process.argv.slice(2));
const date = new Date(`${options.date}T00:00:00`);
const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
const events = Array.isArray(data.events) ? data.events : [];
const dailyEvents = eventsForDate(events, date).sort(compareEvents);
const coverage = normalizeCoverage(data.coverage);
const monthStatus = getMonthStatus(options.date.slice(0, 7), coverage);
const counts = countBy(dailyEvents, (event) => event.category);
const nightCount = dailyEvents.filter((event) => event.night).length;

const report = buildMarkdown();
fs.writeFileSync(reportPath, `${report}\n`, "utf8");

let exportPath = "";
if (options.exportText) {
  fs.mkdirSync(exportRoot, { recursive: true });
  exportPath = path.join(exportRoot, `day-${options.date}.txt`);
  fs.writeFileSync(exportPath, `${buildPlainText()}\n`, "utf8");
}

console.log(`Wrote ${path.relative(rootDir, reportPath)}`);
if (exportPath) console.log(`Wrote ${path.relative(rootDir, exportPath)}`);
console.log(
  `${options.date}: ${dailyEvents.length} events / ${Object.keys(CATEGORY_LABELS)
    .map((category) => `${getCategoryLabel(category)} ${counts[category] || 0}`)
    .join(" / ")}`,
);

function buildMarkdown() {
  const lines = [];
  lines.push(`# Day Report ${options.date}`);
  lines.push("");
  lines.push(`- Date: ${formatDateHeading(date)} (${options.date})`);
  lines.push(`- Events: ${dailyEvents.length}`);
  lines.push(`- Night-like events: ${nightCount}`);
  lines.push(`- Coverage: ${formatCoverageStatus(monthStatus)}`);
  lines.push(`- Data generated at: ${data.generatedAt || "-"}`);
  lines.push("");
  lines.push("## Category Counts");
  lines.push("");
  Object.keys(CATEGORY_LABELS).forEach((category) => {
    lines.push(`- ${getCategoryLabel(category)}: ${counts[category] || 0}`);
  });
  lines.push("");
  lines.push("## Events");
  lines.push("");
  if (dailyEvents.length === 0) {
    lines.push("- No events for this date.");
  } else {
    dailyEvents.forEach((event) => {
      const labels = [getCategoryLabel(event.category), event.region];
      if (event.night) labels.push("ナイター");
      lines.push(`- ${event.startTime}-${event.endTime} ${event.venueName} (${labels.join(" / ")})`);
      if (event.memo) lines.push(`  - ${event.memo}`);
    });
  }
  lines.push("");
  return lines.join("\n");
}

function buildPlainText() {
  const lines = [];
  lines.push(`${formatDateHeading(date)} (${options.date})`);
  lines.push(`${dailyEvents.length} events / ${formatCoverageStatus(monthStatus)}`);
  lines.push(
    Object.keys(CATEGORY_LABELS)
      .map((category) => `${getCategoryLabel(category)} ${counts[category] || 0}`)
      .join(" / "),
  );
  lines.push("");
  dailyEvents.forEach((event) => {
    const tags = [getCategoryLabel(event.category), event.region, event.night ? "ナイター" : ""].filter(Boolean);
    lines.push(`${event.startTime}-${event.endTime} / ${event.venueName} / ${tags.join(" / ")}`);
    if (event.memo) lines.push(`  ${event.memo}`);
  });
  if (dailyEvents.length === 0) lines.push("No events for this date.");
  return lines.join("\n");
}

function parseArgs(args) {
  const parsed = {
    date: toIsoDate(new Date()),
    exportText: false,
  };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--date") {
      parsed.date = args[index + 1];
      index += 1;
    } else if (arg === "--export-text") {
      parsed.exportText = true;
    }
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(parsed.date)) {
    console.error("--date must be YYYY-MM-DD");
    process.exit(1);
  }
  return parsed;
}

function toIsoDate(dateValue) {
  const year = dateValue.getFullYear();
  const month = String(dateValue.getMonth() + 1).padStart(2, "0");
  const day = String(dateValue.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeCoverage(value) {
  return {
    months: Array.isArray(value?.months) ? value.months : [],
    missingByMonth: value?.missingByMonth || {},
  };
}

function getMonthStatus(month, coverageValue) {
  if (!coverageValue.months.includes(month)) {
    return {
      status: "not imported",
      missing: Object.keys(CATEGORY_LABELS),
    };
  }
  const missing = coverageValue.missingByMonth[month] || [];
  return {
    status: missing.length ? "partially imported" : "complete",
    missing,
  };
}

function formatCoverageStatus(status) {
  if (!status.missing.length) return status.status;
  return `${status.status} / missing ${status.missing.map(getCategoryLabel).join(", ")}`;
}

function compareEvents(a, b) {
  return (
    String(a.startTime).localeCompare(String(b.startTime)) ||
    getCategoryLabel(a.category).localeCompare(getCategoryLabel(b.category), "ja") ||
    String(a.venueName).localeCompare(String(b.venueName), "ja")
  );
}

function countBy(items, getKey) {
  return items.reduce((counts, item) => {
    const key = getKey(item);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}
