const fs = require("fs");
const path = require("path");
const { ALLOWED_CATEGORIES } = require("./lib/categories");
const { buildCoverage } = require("./lib/coverage");

const rootDir = path.resolve(__dirname, "..");
const inputPath = path.join(rootDir, "data", "events.json");
const outputPath = path.join(rootDir, "src", "sample-data.js");

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const data = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const events = Array.isArray(data.events) ? data.events : [];
const errors = [];
const seenIds = new Set();

events.forEach((event, index) => {
  const label = `events[${index}]`;

  if (!event || typeof event !== "object") {
    errors.push(`${label}: must be an object`);
    return;
  }

  requireString(event, "id", label);
  requireString(event, "category", label);
  requireString(event, "venueName", label);
  requireString(event, "region", label);
  requireString(event, "startTime", label);
  requireString(event, "endTime", label);

  if (event.id && seenIds.has(event.id)) {
    errors.push(`${label}: duplicate id "${event.id}"`);
  }
  seenIds.add(event.id);

  if (event.category && !ALLOWED_CATEGORIES.has(event.category)) {
    errors.push(`${label}: unknown category "${event.category}"`);
  }

  if (event.startTime && !timePattern.test(event.startTime)) {
    errors.push(`${label}: startTime must be HH:mm`);
  }

  if (event.endTime && !timePattern.test(event.endTime)) {
    errors.push(`${label}: endTime must be HH:mm`);
  }

  const hasDays = Array.isArray(event.days) && event.days.length > 0;
  const hasDates = Array.isArray(event.dates) && event.dates.length > 0;

  if (!hasDays && !hasDates) {
    errors.push(`${label}: days or dates must be provided`);
  }

  if (hasDays) {
    event.days.forEach((day) => {
      if (!Number.isInteger(day) || day < 0 || day > 6) {
        errors.push(`${label}: days must contain integers from 0 to 6`);
      }
    });
  }

  if (hasDates) {
    event.dates.forEach((date) => {
      if (typeof date !== "string" || !datePattern.test(date)) {
        errors.push(`${label}: dates must contain YYYY-MM-DD strings`);
      }
    });
  }
});

if (errors.length > 0) {
  console.error("Data validation failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

const payload = {
  build: data.build || "events-json",
  sourceName: data.sourceName || "Local JSON data",
  generatedAt: data.generatedAt || new Date().toISOString(),
  coverage: data.coverage || buildCoverage(events),
  events: events.map((event) => ({
    ...event,
    memo: typeof event.memo === "string" ? event.memo : "",
    accessNote: typeof event.accessNote === "string" ? event.accessNote : "",
  })),
};

const output = `(function () {
  window.RaceDayExternalData = ${JSON.stringify(payload, null, 2)};
})();
`;

fs.writeFileSync(outputPath, output, "utf8");
console.log(`Wrote ${path.relative(rootDir, outputPath)} (${events.length} events)`);

function requireString(event, field, label) {
  if (typeof event[field] !== "string" || event[field].trim() === "") {
    errors.push(`${label}: ${field} is required`);
  }
}
