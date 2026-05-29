const fs = require("fs");
const path = require("path");
const { getCategoryLabel } = require("./lib/categories");
const { findNextEventDate } = require("./lib/events");

const rootDir = path.resolve(__dirname, "..");
const inputPath = path.join(rootDir, "data", "events.json");
const outputPath = path.join(rootDir, "docs", "venue-report.md");
const lookupDays = 60;

const data = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const events = Array.isArray(data.events) ? data.events : [];

const lines = [];
lines.push("# Venue Report");
lines.push("");
lines.push(`- Build: ${data.build || "-"}`);
lines.push(`- Source: ${data.sourceName || "-"}`);
lines.push(`- Generated at: ${data.generatedAt || "-"}`);
lines.push(`- Venues: ${events.length}`);
lines.push(`- Next event lookup: ${lookupDays} days`);
lines.push("");
lines.push("| Venue | Category | Region | Next Event | Night | Memo | Access |");
lines.push("| --- | --- | --- | --- | --- | --- | --- |");

events
  .slice()
  .sort((a, b) => String(a.region).localeCompare(String(b.region), "ja") || String(a.venueName).localeCompare(String(b.venueName), "ja"))
  .forEach((event) => {
    lines.push(
      [
        event.venueName,
        getCategoryLabel(event.category),
        event.region,
        findNextEventDate(event, { lookupDays })?.label || "-",
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
console.log(`Wrote ${path.relative(rootDir, outputPath)} (${events.length} venues)`);

function escapeCell(value) {
  return String(value ?? "").replace(/\|/g, "\\|");
}
