const fs = require("fs");
const path = require("path");
const { parseCsv, splitList } = require("./lib/csv");
const { buildCoverage } = require("./lib/coverage");

const rootDir = path.resolve(__dirname, "..");
const inputPath = path.join(rootDir, "data", "events.csv");
const outputPath = path.join(rootDir, "data", "events.json");

const csv = fs.readFileSync(inputPath, "utf8").replace(/^\uFEFF/, "");
const rows = parseCsv(csv);

if (rows.length < 2) {
  console.error("CSV must contain a header and at least one data row.");
  process.exit(1);
}

const headers = rows[0].map((header) => header.trim());
const requiredHeaders = [
  "id",
  "category",
  "venueName",
  "region",
  "startTime",
  "endTime",
  "days",
  "dates",
  "officialUrl",
  "night",
  "memo",
  "accessNote",
];
const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));

if (missingHeaders.length > 0) {
  console.error(`CSV is missing headers: ${missingHeaders.join(", ")}`);
  process.exit(1);
}

const events = rows
  .slice(1)
  .filter((row) => row.some((cell) => cell.trim() !== ""))
  .map((row, index) => {
    const record = Object.fromEntries(headers.map((header, column) => [header, row[column] || ""]));
    return {
      id: record.id.trim(),
      category: record.category.trim(),
      venueName: record.venueName.trim(),
      region: record.region.trim(),
      startTime: record.startTime.trim(),
      endTime: record.endTime.trim(),
      days: splitList(record.days).map(Number),
      dates: splitList(record.dates),
      officialUrl: record.officialUrl.trim(),
      night: parseBoolean(record.night, index + 2),
      memo: record.memo.trim(),
      accessNote: record.accessNote.trim(),
    };
  });

const payload = {
  build: "events-csv-v1",
  sourceName: "Local CSV data",
  generatedAt: new Date().toISOString(),
  coverage: buildCoverage(events),
  events,
};

fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`Wrote ${path.relative(rootDir, outputPath)} (${events.length} events)`);

function parseBoolean(value, lineNumber) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false" || normalized === "") return false;
  console.error(`Invalid boolean at CSV line ${lineNumber}: ${value}`);
  process.exit(1);
}
