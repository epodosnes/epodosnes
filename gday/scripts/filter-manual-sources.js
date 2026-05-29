const fs = require("fs");
const path = require("path");
const { parseCsv, toCsvLine } = require("./lib/csv");

const rootDir = path.resolve(__dirname, "..");
const inputPath = path.join(rootDir, "data", "sources", "manual.csv");
const outputPath = path.join(rootDir, "data", "sources", "manual-base.csv");
const excludedCategories = new Set((process.argv[2] || "local-keiba").split(",").map((item) => item.trim()).filter(Boolean));

if (!fs.existsSync(inputPath)) {
  console.error("Manual source not found: data/sources/manual.csv");
  process.exit(1);
}

const rows = parseCsv(fs.readFileSync(inputPath, "utf8").replace(/^\uFEFF/, ""));
if (rows.length < 2) {
  console.error("Manual source has no data rows.");
  process.exit(1);
}

const header = rows[0];
const categoryIndex = header.indexOf("category");
if (categoryIndex < 0) {
  console.error("Manual source is missing category header.");
  process.exit(1);
}

const keptRows = rows
  .slice(1)
  .filter((row) => row.some((cell) => String(cell).trim() !== ""))
  .filter((row) => !excludedCategories.has(String(row[categoryIndex] || "").trim()));

fs.writeFileSync(outputPath, `${[header, ...keptRows].map(toCsvLine).join("\n")}\n`, "utf8");
console.log(`Wrote ${path.relative(rootDir, outputPath)} (${keptRows.length} rows, excluded categories: ${Array.from(excludedCategories).join(", ")})`);
