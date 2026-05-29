const fs = require("fs");
const path = require("path");
const { getCategoryLabel } = require("./lib/categories");
const { eventsForDate } = require("./lib/events");
const { addDays, formatDateHeading, startOfDay, toIsoDate } = require("./lib/date");

const rootDir = path.resolve(__dirname, "..");
const inputPath = path.join(rootDir, "data", "events.json");
const outputPath = path.join(rootDir, "docs", "calendar-report.md");
const daysToRender = 30;

const data = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const events = Array.isArray(data.events) ? data.events : [];

const lines = [];
const startDate = startOfDay(new Date());

lines.push("# Calendar Report");
lines.push("");
lines.push(`- Build: ${data.build || "-"}`);
lines.push(`- Source: ${data.sourceName || "-"}`);
lines.push(`- Generated at: ${data.generatedAt || "-"}`);
lines.push(`- Window: ${toIsoDate(startDate)} to ${toIsoDate(addDays(startDate, daysToRender - 1))}`);
lines.push("");

for (let offset = 0; offset < daysToRender; offset += 1) {
  const date = addDays(startDate, offset);
  const isoDate = toIsoDate(date);
  const dailyEvents = eventsForDate(events, date).sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)));

  lines.push(`## ${formatDateHeading(date)} (${dailyEvents.length})`);
  lines.push("");

  if (dailyEvents.length === 0) {
    lines.push("- No events");
    lines.push("");
    continue;
  }

  dailyEvents.forEach((event) => {
    const labels = [getCategoryLabel(event.category), event.region];
    if (event.night) labels.push("\u30ca\u30a4\u30bf\u30fc");
    if (Array.isArray(event.dates) && event.dates.includes(isoDate)) labels.push("\u65e5\u4ed8\u6307\u5b9a");
    lines.push(`- ${event.startTime}-${event.endTime} ${event.venueName} (${labels.join(" / ")})`);
  });
  lines.push("");
}

fs.writeFileSync(outputPath, `${lines.join("\n")}\n`, "utf8");
console.log(`Wrote ${path.relative(rootDir, outputPath)} (${daysToRender} days)`);
