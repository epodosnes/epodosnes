const fs = require("fs");
const path = require("path");
const { CATEGORY_LABELS, getCategoryLabel } = require("./lib/categories");
const { eventsForDate } = require("./lib/events");

const rootDir = path.resolve(__dirname, "..");
const dataPath = path.join(rootDir, "data", "events.json");
const outputPath = path.join(rootDir, "docs", "coverage-report.md");

const options = parseArgs(process.argv.slice(2));
const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
const events = Array.isArray(data.events) ? data.events : [];
const coverage = normalizeCoverage(data.coverage);
const targetDate = options.date || null;
const targetMonth = options.month || (targetDate ? targetDate.slice(0, 7) : null);

const lines = [];
lines.push("# Coverage Report");
lines.push("");
lines.push(`- Build: ${data.build || "-"}`);
lines.push(`- Source: ${data.sourceName || "-"}`);
lines.push(`- Generated at: ${data.generatedAt || "-"}`);
lines.push(`- Events: ${events.length}`);
lines.push("");

lines.push("## Imported Months");
lines.push("");
if (coverage.months.length === 0) {
  lines.push("- No coverage metadata.");
} else {
  coverage.months.forEach((month) => {
    const missing = coverage.missingByMonth[month] || [];
    lines.push(`- ${month}: ${missing.length === 0 ? "all categories" : `missing ${missing.map(getCategoryLabel).join(", ")}`}`);
  });
}
lines.push("");

lines.push("## Categories");
lines.push("");
Object.keys(CATEGORY_LABELS).forEach((category) => {
  const months = coverage.categories[category] || [];
  lines.push(`- ${getCategoryLabel(category)}: ${months.length ? months.join(", ") : "-"}`);
});
lines.push("");

if (targetMonth) {
  lines.push(`## Target Month ${targetMonth}`);
  lines.push("");
  if (!coverage.months.includes(targetMonth)) {
    lines.push("- Month is not imported.");
  } else {
    const missing = coverage.missingByMonth[targetMonth] || [];
    lines.push(`- Status: ${missing.length === 0 ? "all categories imported" : `missing ${missing.map(getCategoryLabel).join(", ")}`}`);
  }
  lines.push("");
}

if (targetDate) {
  const date = new Date(`${targetDate}T00:00:00`);
  const dailyEvents = Number.isNaN(date.getTime()) ? [] : eventsForDate(events, date);
  const counts = countBy(dailyEvents, (event) => event.category);

  lines.push(`## Target Date ${targetDate}`);
  lines.push("");
  lines.push(`- Events: ${dailyEvents.length}`);
  Object.keys(CATEGORY_LABELS).forEach((category) => {
    lines.push(`- ${getCategoryLabel(category)}: ${counts[category] || 0}`);
  });
  lines.push("");
}

fs.writeFileSync(outputPath, `${lines.join("\n")}\n`, "utf8");
console.log(`Wrote ${path.relative(rootDir, outputPath)}`);

if (targetMonth) {
  const missing = coverage.missingByMonth[targetMonth] || [];
  const status = coverage.months.includes(targetMonth)
    ? missing.length === 0
      ? "all categories imported"
      : `missing ${missing.map(getCategoryLabel).join(", ")}`
    : "not imported";
  console.log(`Month ${targetMonth}: ${status}`);
}

if (targetDate) {
  const date = new Date(`${targetDate}T00:00:00`);
  const dailyEvents = Number.isNaN(date.getTime()) ? [] : eventsForDate(events, date);
  const counts = countBy(dailyEvents, (event) => event.category);
  const summary = Object.keys(CATEGORY_LABELS)
    .map((category) => `${getCategoryLabel(category)} ${counts[category] || 0}`)
    .join(" / ");
  console.log(`Date ${targetDate}: ${dailyEvents.length} events / ${summary}`);
}

function parseArgs(args) {
  const parsed = {};
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--date") {
      parsed.date = args[index + 1];
      index += 1;
    } else if (arg === "--month") {
      parsed.month = args[index + 1];
      index += 1;
    }
  }

  if (parsed.date && !/^\d{4}-\d{2}-\d{2}$/.test(parsed.date)) {
    console.error("--date must be YYYY-MM-DD");
    process.exit(1);
  }

  if (parsed.month && !/^\d{4}-\d{2}$/.test(parsed.month)) {
    console.error("--month must be YYYY-MM");
    process.exit(1);
  }

  return parsed;
}

function normalizeCoverage(value) {
  return {
    months: Array.isArray(value?.months) ? value.months : [],
    categories: value?.categories || {},
    missingByMonth: value?.missingByMonth || {},
  };
}

function countBy(items, getKey) {
  return items.reduce((counts, item) => {
    const key = getKey(item);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}
