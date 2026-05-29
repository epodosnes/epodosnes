const fs = require("fs");
const path = require("path");
const { parseCsv } = require("./lib/csv");

const rootDir = path.resolve(__dirname, "..");
const ym = process.argv[2] || currentYm();
const csvPath = path.join(rootDir, "data", "incoming", "jra", ym, `${ym}_events.csv`);
const checks = [];

check("Import CSV exists", fs.existsSync(csvPath), path.relative(rootDir, csvPath));

let rows = [];
if (fs.existsSync(csvPath)) {
  rows = parseCsv(fs.readFileSync(csvPath, "utf8"));
}

const header = rows[0] || [];
const dataRows = rows.slice(1).filter((row) => row.some((cell) => String(cell).trim() !== ""));
const ids = dataRows.map((row) => row[header.indexOf("id")]);
const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);

check("Header exists", header.length > 0);
check("Has imported rows", dataRows.length > 0, `${dataRows.length} rows`);
check("Category is jra", allRowsMatch("category", "jra"));
check("Rows use exact dates", dataRows.every((row) => /^\d{4}-\d{2}-\d{2}$/.test(value(row, "dates"))));
check("No duplicate ids", duplicateIds.length === 0, Array.from(new Set(duplicateIds)).join(", "));
check("Start times are valid", dataRows.every((row) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value(row, "startTime"))));
check("End times are valid", dataRows.every((row) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value(row, "endTime"))));

checks.forEach((item) => {
  const suffix = item.detail ? ` (${item.detail})` : "";
  console.log(`${item.ok ? "OK" : "NG"} ${item.name}${suffix}`);
});

const failed = checks.filter((item) => !item.ok);
if (failed.length > 0) {
  console.error(`\nJRA import check failed: ${failed.length} issue(s)`);
  process.exit(1);
}

console.log(`\nJRA import check passed: ${checks.length} checks`);

function check(name, ok, detail = "") {
  checks.push({ name, ok: Boolean(ok), detail });
}

function value(row, key) {
  return String(row[header.indexOf(key)] || "").trim();
}

function allRowsMatch(key, expected) {
  return dataRows.every((row) => value(row, key) === expected);
}

function currentYm() {
  const date = new Date();
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
}
