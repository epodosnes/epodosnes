const fs = require("fs");
const path = require("path");
const { parseCsv, splitList } = require("./lib/csv");
const { ALLOWED_CATEGORIES } = require("./lib/categories");

const rootDir = path.resolve(__dirname, "..");
const inputPath = path.join(rootDir, "data", "events.csv");

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
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const csv = fs.readFileSync(inputPath, "utf8").replace(/^\uFEFF/, "");
const rows = parseCsv(csv);
const errors = [];
const warnings = [];

if (rows.length < 2) {
  errors.push("CSV must contain a header and at least one data row.");
} else {
  validateRows(rows);
}

if (warnings.length > 0) {
  console.warn("Warnings:");
  warnings.forEach((warning) => console.warn(`- ${warning}`));
}

if (errors.length > 0) {
  console.error("CSV validation failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

const dataRows = Math.max(rows.length - 1, 0);
console.log(`CSV validation passed (${dataRows} rows, ${warnings.length} warnings)`);

function validateRows(rows) {
  const headers = rows[0].map((header) => header.trim());
  const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));

  if (missingHeaders.length > 0) {
    errors.push(`CSV is missing headers: ${missingHeaders.join(", ")}`);
    return;
  }

  const seenIds = new Set();
  rows
    .slice(1)
    .filter((row) => row.some((cell) => cell.trim() !== ""))
    .forEach((row, index) => {
      const lineNumber = index + 2;
      const record = Object.fromEntries(headers.map((header, column) => [header, row[column] || ""]));
      validateRecord(record, lineNumber, seenIds);
    });
}

function validateRecord(record, lineNumber, seenIds) {
  const label = `line ${lineNumber}`;
  ["id", "category", "venueName", "region", "startTime", "endTime"].forEach((field) => {
    if (!record[field] || record[field].trim() === "") {
      errors.push(`${label}: ${field} is required`);
    }
  });

  if (record.id) {
    if (seenIds.has(record.id)) {
      errors.push(`${label}: duplicate id "${record.id}"`);
    }
    seenIds.add(record.id);
  }

  if (record.category && !ALLOWED_CATEGORIES.has(record.category)) {
    errors.push(`${label}: unknown category "${record.category}"`);
  }

  if (record.startTime && !timePattern.test(record.startTime)) {
    errors.push(`${label}: startTime must be HH:mm`);
  }

  if (record.endTime && !timePattern.test(record.endTime)) {
    errors.push(`${label}: endTime must be HH:mm`);
  }

  const days = splitList(record.days);
  const dates = splitList(record.dates);

  if (days.length === 0 && dates.length === 0) {
    errors.push(`${label}: days or dates must be provided`);
  }

  days.forEach((day) => {
    const number = Number(day);
    if (!Number.isInteger(number) || number < 0 || number > 6) {
      errors.push(`${label}: days must contain integers from 0 to 6`);
    }
  });

  dates.forEach((date) => {
    if (!datePattern.test(date)) {
      errors.push(`${label}: dates must contain YYYY-MM-DD strings`);
    }
  });

  const night = String(record.night || "").trim().toLowerCase();
  if (night !== "" && night !== "true" && night !== "false") {
    errors.push(`${label}: night must be true or false`);
  }

  if (!record.officialUrl || record.officialUrl.trim() === "") {
    warnings.push(`${label}: officialUrl is empty; category official URL will be used`);
  }

  if (!record.memo || record.memo.trim() === "") {
    warnings.push(`${label}: memo is empty`);
  }

  if (!record.accessNote || record.accessNote.trim() === "") {
    warnings.push(`${label}: accessNote is empty`);
  }
}
